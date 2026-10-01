import { World, Box, Circle, RevoluteJoint, testOverlap, type Body, type Fixture } from 'planck'
import { holes, type ScrewLevel, type ScrewState } from './logic.ts'

const SCALE = 50, STEP = 1000 / 120, BOLT_CATEGORY = 1 << 14
export interface PlatePose { x: number; y: number; angle: number; vx: number; vy: number; av: number; gone: boolean; pins: [number | null, number | null] }
export interface ScrewPhysicsSave { screws: number[]; moves: number; plates: PlatePose[]; separated: string[]; clearBolts?: string[] }
export interface PlateView { i: number; x: number; y: number; angle: number; length: number; a: { x: number; y: number }; b: { x: number; y: number } }
interface Piece { body: Body; fixture: Fixture; span: number; pins: [number | null, number | null]; joint: RevoluteJoint | null; gone: boolean }
const position = (body: Body) => ({ x: body.getPosition().x * SCALE, y: body.getPosition().y * SCALE })
const overlaps = (a: Fixture, b: Fixture) => testOverlap(a.getShape(), 0, b.getShape(), 0, a.getBody().getTransform(), b.getBody().getTransform())
const holeDistance = (a: number, b: number) => Math.hypot(holes[a].x - holes[b].x, holes[a].y - holes[b].y)

export class ScrewWorld {
  readonly engine = new World({ gravity: { x: 0, y: 34 }, allowSleep: true, continuousPhysics: true })
  readonly pieces: Piece[] = []
  readonly level: ScrewLevel
  screws: number[]
  moves = 0
  private ground = this.engine.createBody()
  private separated = new Set<string>()
  private bolts = new Map<number, Body>()
  private clearBolts = new Set<string>()
  private accumulator = 0

  constructor(level: ScrewLevel, saved?: ScrewPhysicsSave, legacy?: ScrewState) {
    this.level = level
    this.screws = [...(saved?.screws ?? legacy?.screws ?? level.screws)]
    this.moves = saved?.moves ?? legacy?.moves ?? 0
    this.separated = new Set(saved?.separated ?? [])
    this.clearBolts = new Set(saved?.clearBolts ?? [])
    level.plates.forEach((p, i) => {
      const a = holes[p.a], b = holes[p.b], span = holeDistance(p.a, p.b), pose = saved?.plates[i]
      const body = this.engine.createDynamicBody({
        position: { x: (pose?.x ?? (a.x + b.x) / 2) / SCALE, y: (pose?.y ?? (a.y + b.y) / 2) / SCALE },
        angle: pose?.angle ?? Math.atan2(b.y - a.y, b.x - a.x),
        linearDamping: 0.48, angularDamping: 0.48, bullet: true,
      })
      const fixture = body.createFixture(new Box((span / 2 + 20) / SCALE, 17 / SCALE), {
        density: 5, friction: 0.45, restitution: 0.05, filterCategoryBits: 1 << i, filterMaskBits: 0,
      })
      const gone = pose?.gone ?? legacy?.removed.includes(i) ?? false
      const pins: Piece['pins'] = pose ? [...pose.pins] : [this.screws.includes(p.a) && !gone ? p.a : null, this.screws.includes(p.b) && !gone ? p.b : null]
      const piece: Piece = { body, fixture, span, pins, joint: null, gone }
      this.pieces.push(piece)
      if (gone) this.engine.destroyBody(body)
      else {
        this.attach(piece)
        if (pose && !body.isStatic()) {
          body.setLinearVelocity({ x: pose.vx * 60 / SCALE, y: pose.vy * 60 / SCALE })
          body.setAngularVelocity(pose.av * 60)
        }
      }
    })
    this.syncBolts()
    this.updateCollisions()
  }

  private point(piece: Piece, side: number) {
    const p = piece.body.getWorldPoint({ x: (side === 0 ? -1 : 1) * piece.span / 2 / SCALE, y: 0 })
    return { x: p.x * SCALE, y: p.y * SCALE }
  }

  private attach(piece: Piece) {
    if (piece.joint) this.engine.destroyJoint(piece.joint)
    piece.joint = null
    const count = piece.pins.filter(p => p !== null).length
    piece.body.setType(count === 2 ? 'static' : 'dynamic')
    if (count === 2) {
      const a = holes[piece.pins[0]!], b = holes[piece.pins[1]!]
      piece.body.setTransform({ x: (a.x + b.x) / 2 / SCALE, y: (a.y + b.y) / 2 / SCALE }, Math.atan2(b.y - a.y, b.x - a.x))
    } else if (count === 1) {
      const side = piece.pins[0] !== null ? 0 : 1, h = holes[piece.pins[side]!]
      const p = this.point(piece, side), centre = piece.body.getPosition()
      piece.body.setPosition({ x: centre.x + (h.x - p.x) / SCALE, y: centre.y + (h.y - p.y) / SCALE })
      const joint = new RevoluteJoint({}, this.ground, piece.body, { x: h.x / SCALE, y: h.y / SCALE })
      this.engine.createJoint(joint); piece.joint = joint
    }
    piece.body.setAwake(true)
  }

  private covers(piece: Piece, point: { x: number; y: number }) {
    const p = piece.body.getLocalPoint({ x: point.x / SCALE, y: point.y / SCALE })
    return Math.abs(p.x * SCALE) <= piece.span / 2 + 20 && Math.abs(p.y * SCALE) <= 17
  }

  private aligned(piece: Piece, side: number, hole: number, tolerance: number) {
    const p = this.point(piece, side), target = holes[hole], other = piece.pins[1 - side]
    return Math.hypot(p.x - target.x, p.y - target.y) < tolerance
      && (other === null || Math.abs(holeDistance(other, hole) - piece.span) < 0.5)
  }

  accessible(hole: number): boolean {
    if (!holes[hole]) return false
    const point = holes[hole]
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i]
      if (p.gone || !this.covers(p, point)) continue
      if (this.screws.includes(hole) && this.clearBolts.has(`${i}:${hole}`)) return true
      return [0, 1].some(side => this.aligned(p, side, hole, 11))
    }
    return true
  }

  relocate(from: number, to: number): boolean {
    if (!this.screws.includes(from) || this.screws.includes(to) || !this.accessible(from) || !this.accessible(to)) return false
    this.screws = this.screws.map(h => h === from ? to : h)
    this.pieces.forEach(piece => {
      if (piece.gone) return
      let changed = false
      for (const side of [0, 1]) {
        if (piece.pins[side] === from) { piece.pins[side] = null; changed = true }
        if (piece.pins[side] === null && this.aligned(piece, side, to, 9)) {
          piece.pins[side] = to; changed = true
        }
      }
      if (changed) this.attach(piece)
    })
    // Removing an anchor or parked screw changes an entire support island.
    this.pieces.forEach(p => { if (!p.gone && !p.body.isStatic()) p.body.setAwake(true) })
    this.moves++; this.syncBolts(); this.updateCollisions()
    return true
  }

  private syncBolts() {
    for (const [h, body] of this.bolts) if (!this.screws.includes(h)) {
      this.engine.destroyBody(body); this.bolts.delete(h)
      this.pieces.forEach((_, i) => this.clearBolts.delete(`${i}:${h}`))
    }
    for (const h of this.screws) if (!this.bolts.has(h)) {
      const body = this.engine.createBody({ position: { x: holes[h].x / SCALE, y: holes[h].y / SCALE } })
      body.createFixture(new Circle(10 / SCALE), {
        friction: 0.3, restitution: 0, filterCategoryBits: BOLT_CATEGORY, filterMaskBits: 0,
      })
      this.bolts.set(h, body)
    }
  }

  private updateCollisions() {
    const masks = this.pieces.map(() => 0)
    for (const [h, bolt] of this.bolts) {
      const fixture = bolt.getFixtureList()!
      let mask = 0
      this.pieces.forEach((p, i) => {
        if (p.gone || p.pins.includes(h)) return
        const key = `${i}:${h}`
        if (!overlaps(p.fixture, fixture)) this.clearBolts.add(key)
        if (this.clearBolts.has(key)) { mask |= 1 << i; masks[i] |= BOLT_CATEGORY }
      })
      if (fixture.getFilterMaskBits() !== mask) fixture.setFilterData({ categoryBits: BOLT_CATEGORY, maskBits: mask, groupIndex: 0 })
    }
    for (let i = 0; i < this.pieces.length; i++) for (let j = i + 1; j < this.pieces.length; j++) {
      const a = this.pieces[i], b = this.pieces[j], key = `${i}:${j}`
      if (a.gone || b.gone) continue
      // Initially crossed boards occupy separate depth layers. Once they
      // separate, subsequent impacts and support use ordinary rigid contacts.
      if (!this.separated.has(key) && !overlaps(a.fixture, b.fixture)) this.separated.add(key)
      if (this.separated.has(key)) { masks[i] |= 1 << j; masks[j] |= 1 << i }
    }
    this.pieces.forEach((p, i) => {
      if (!p.gone && p.fixture.getFilterMaskBits() !== masks[i])
        p.fixture.setFilterData({ categoryBits: 1 << i, maskBits: masks[i], groupIndex: 0 })
    })
  }

  step(delta = 1000 / 60) {
    if (!Number.isFinite(delta) || delta <= 0) return
    this.accumulator += Math.min(delta, 100)
    while (this.accumulator + 1e-7 >= STEP) {
      this.accumulator -= STEP
      this.updateCollisions(); this.engine.step(STEP / 1000, 12, 8)
      this.pieces.forEach(p => {
        if (p.gone || p.pins.some(h => h !== null)) return
        const minY = Math.min(...[-1, 1].flatMap(x => [-1, 1].map(y =>
          p.body.getWorldPoint({ x: x * (p.span / 2 + 20) / SCALE, y: y * 17 / SCALE }).y * SCALE)))
        if (minY > 380) { p.gone = true; this.engine.destroyBody(p.body) }
      })
    }
  }

  get views(): PlateView[] {
    return this.pieces.flatMap((p, i) => p.gone ? [] : [{ i, ...position(p.body),
      angle: p.body.getAngle() * 180 / Math.PI, length: p.span + 40, a: this.point(p, 0), b: this.point(p, 1) }])
  }
  get remaining() { return this.pieces.filter(p => !p.gone).length }
  get active() { return this.pieces.some(p => !p.gone && !p.body.isStatic() && p.body.isAwake()) }
  hint(): [number, number] | null {
    const destinations = holes.map((point, h) => ({ point, h })).filter(({ point, h }) => !this.screws.includes(h)
      && this.pieces.every(p => p.gone || !this.covers(p, point))).sort((a, b) => a.point.y - b.point.y)
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i]
      if (piece.gone) continue
      for (const from of piece.pins) {
        if (from !== null && this.accessible(from) && destinations.length) return [from, destinations[0].h]
      }
    }
    for (const from of [...this.screws].sort((a, b) => holes[b].y - holes[a].y)) {
      if (!this.accessible(from)) continue
      const bolt = this.bolts.get(from)!
      const supporting = this.pieces.some(p => {
        if (p.gone || p.pins.includes(from)) return false
        for (let edge = p.body.getContactList(); edge; edge = edge.next)
          if (edge.other === bolt && edge.contact.isTouching()) return true
        return false
      })
      const target = destinations[0]
      if (supporting && target) return [from, target.h]
    }
    // With every external parking hole occupied, move a loose screw into an
    // exposed drilled hole first. This frees a parking hole for the next pin.
    if (!destinations.length) {
      const target = holes.map((point, h) => ({ h, layer: this.pieces.reduce((layer, p, i) => !p.gone && this.covers(p, point) ? i : layer, -1) }))
        .filter(({ h }) => !this.screws.includes(h) && this.accessible(h)).sort((a, b) => a.layer - b.layer)[0]
      const from = [...this.screws].sort((a, b) => holes[a].y - holes[b].y)
        .find(h => this.accessible(h) && this.pieces.every(p => p.gone || !p.pins.includes(h)))
      if (target && from !== undefined) return [from, target.h]
    }
    return null
  }
  snapshot(): ScrewPhysicsSave {
    return { screws: [...this.screws], moves: this.moves, separated: [...this.separated], clearBolts: [...this.clearBolts], plates: this.pieces.map(p => ({
      ...position(p.body), angle: p.body.getAngle(), vx: p.body.getLinearVelocity().x * SCALE / 60, vy: p.body.getLinearVelocity().y * SCALE / 60,
      av: p.body.getAngularVelocity() / 60, pins: [...p.pins], gone: p.gone,
    })) }
  }
  destroy() {
    for (let body = this.engine.getBodyList(); body;) { const next = body.getNext(); this.engine.destroyBody(body); body = next }
  }
}

export function validPhysicsSave(level: ScrewLevel, value: unknown): value is ScrewPhysicsSave {
  const s = value as ScrewPhysicsSave | null
  return !!s && Number.isSafeInteger(s.moves) && s.moves >= 0 && Array.isArray(s.screws)
    && s.screws.length === level.screws.length && new Set(s.screws).size === s.screws.length
    && s.screws.every(h => Number.isInteger(h) && !!holes[h]) && Array.isArray(s.plates) && s.plates.length === level.plates.length
    && s.plates.every((p, i) => p && [p.x, p.y, p.angle, p.vx, p.vy, p.av].every(Number.isFinite)
      && Math.abs(p.x) < 2000 && Math.abs(p.y) < 2000 && Math.abs(p.angle) < 10000
      && Math.abs(p.vx) < 100 && Math.abs(p.vy) < 100 && Math.abs(p.av) < 10 && typeof p.gone === 'boolean'
      && Array.isArray(p.pins) && p.pins.length === 2 && (p.pins[0] === null || p.pins[0] !== p.pins[1])
      && p.pins.every(h => h === null || (Number.isInteger(h) && s.screws.includes(h)))
      && (p.pins.includes(null) || Math.abs(holeDistance(p.pins[0]!, p.pins[1]!) - holeDistance(level.plates[i].a, level.plates[i].b)) < 0.5)
      && (!p.gone || p.pins.every(h => h === null)))
    && Array.isArray(s.separated) && s.separated.length <= level.plates.length ** 2
    && s.separated.every(k => typeof k === 'string' && /^\d+:\d+$/.test(k))
    && (s.clearBolts === undefined || (Array.isArray(s.clearBolts) && s.clearBolts.length <= level.plates.length * holes.length
      && s.clearBolts.every(k => typeof k === 'string' && /^\d+:\d+$/.test(k))))
}
