import Matter from 'matter-js'
import { holes, type ScrewLevel, type ScrewState } from './logic.ts'

const { Bodies, Body, Composite, Constraint, Engine, Collision, Sleeping } = Matter
export interface PlatePose { x: number; y: number; angle: number; vx: number; vy: number; av: number; gone: boolean; pins: [number | null, number | null] }
export interface ScrewPhysicsSave { screws: number[]; moves: number; plates: PlatePose[]; separated: string[]; clearBolts?: string[] }
export interface PlateView { i: number; x: number; y: number; angle: number; length: number; a: Matter.Vector; b: Matter.Vector }
interface Piece { body: Matter.Body; span: number; pins: [number | null, number | null]; joints: Matter.Constraint[]; gone: boolean }

export class ScrewWorld {
  readonly engine = Engine.create({ enableSleeping: true, constraintIterations: 12, positionIterations: 10, velocityIterations: 8 })
  readonly pieces: Piece[] = []
  readonly level: ScrewLevel
  screws: number[]
  moves = 0
  private separated = new Set<string>()
  private bolts = new Map<number, Matter.Body>()
  private clearBolts = new Set<string>()

  constructor(level: ScrewLevel, saved?: ScrewPhysicsSave, legacy?: ScrewState) {
    this.level = level
    this.screws = [...(saved?.screws ?? legacy?.screws ?? level.screws)]
    this.moves = saved?.moves ?? legacy?.moves ?? 0
    this.engine.gravity.y = 1.7
    this.separated = new Set(saved?.separated ?? [])
    this.clearBolts = new Set(saved?.clearBolts ?? [])
    level.plates.forEach((p, i) => {
      const a = holes[p.a], b = holes[p.b], span = Math.hypot(b.x - a.x, b.y - a.y)
      const pose = saved?.plates[i]
      const body = Bodies.rectangle(pose?.x ?? (a.x + b.x) / 2, pose?.y ?? (a.y + b.y) / 2, span + 40, 34, {
        angle: pose?.angle ?? Math.atan2(b.y - a.y, b.x - a.x), density: 0.002,
        friction: 0.45, frictionAir: 0.008, restitution: 0.08,
        collisionFilter: { category: 1 << i, mask: 0 }, sleepThreshold: 90,
      })
      const gone = pose?.gone ?? legacy?.removed.includes(i) ?? false
      const pins: Piece['pins'] = pose ? [...pose.pins] : [this.screws.includes(p.a) && !gone ? p.a : null, this.screws.includes(p.b) && !gone ? p.b : null]
      const piece: Piece = { body, span, pins, joints: [], gone }
      this.pieces.push(piece)
      if (!gone) {
        Composite.add(this.engine.world, body)
        this.attach(piece)
        if (pose && !body.isStatic) { Body.setVelocity(body, { x: pose.vx, y: pose.vy }); Body.setAngularVelocity(body, pose.av) }
      }
    })
    this.syncBolts()
    this.updateCollisions()
  }

  private point(piece: Piece, side: number): Matter.Vector {
    const offset = (side === 0 ? -1 : 1) * piece.span / 2
    return { x: piece.body.position.x + Math.cos(piece.body.angle) * offset, y: piece.body.position.y + Math.sin(piece.body.angle) * offset }
  }

  private attach(piece: Piece) {
    piece.joints.forEach(j => Composite.remove(this.engine.world, j)); piece.joints = []
    const count = piece.pins.filter(p => p !== null).length
    Body.setStatic(piece.body, count === 2)
    if (count === 1) {
      const side = piece.pins[0] !== null ? 0 : 1, h = piece.pins[side]!
      const point = this.point(piece, side)
      const joint = Constraint.create({ bodyB: piece.body, pointA: { ...holes[h] },
        pointB: { x: point.x - piece.body.position.x, y: point.y - piece.body.position.y },
        length: 0, stiffness: 0.98, damping: 0.001 })
      piece.joints.push(joint); Composite.add(this.engine.world, joint)
    }
    Sleeping.set(piece.body, false)
  }

  private covers(piece: Piece, point: Matter.Vector) {
    const dx = point.x - piece.body.position.x, dy = point.y - piece.body.position.y
    const x = dx * Math.cos(piece.body.angle) + dy * Math.sin(piece.body.angle)
    const y = -dx * Math.sin(piece.body.angle) + dy * Math.cos(piece.body.angle)
    return Math.abs(x) <= piece.span / 2 + 20 && Math.abs(y) <= 17
  }

  accessible(hole: number): boolean {
    if (!holes[hole]) return false
    const point = holes[hole]
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i]
      if (p.gone || !this.covers(p, point)) continue
      if (this.screws.includes(hole) && this.clearBolts.has(`${i}:${hole}`)) return true
      return [0, 1].some(side => Math.hypot(this.point(p, side).x - point.x, this.point(p, side).y - point.y) < 11)
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
        const point = this.point(piece, side)
        if (piece.pins[side] === null && Math.hypot(point.x - holes[to].x, point.y - holes[to].y) < 9) {
          piece.pins[side] = to; changed = true
        }
      }
      if (changed) this.attach(piece)
    })
    // A sleeping board may have been resting on the support just unpinned.
    this.pieces.forEach(p => { if (!p.gone && !p.body.isStatic) Sleeping.set(p.body, false) })
    this.moves++
    this.syncBolts()
    return true
  }

  private syncBolts() {
    for (const [h, body] of this.bolts) if (!this.screws.includes(h)) {
      Composite.remove(this.engine.world, body); this.bolts.delete(h)
      this.pieces.forEach((_, i) => this.clearBolts.delete(`${i}:${h}`))
    }
    for (const h of this.screws) if (!this.bolts.has(h)) {
      const body = Bodies.circle(holes[h].x, holes[h].y, 10, {
        isStatic: true, friction: 0.3, restitution: 0,
        collisionFilter: { category: 1 << 20, mask: 0 },
      })
      this.bolts.set(h, body); Composite.add(this.engine.world, body)
    }
  }

  private updateCollisions() {
    this.pieces.forEach(p => { p.body.collisionFilter.mask = 0 })
    // A board's own pins sit inside its drilled holes. Screws already
    // covered by another depth layer become obstacles once that layer clears.
    for (const [h, bolt] of this.bolts) {
      bolt.collisionFilter.mask = 0
      this.pieces.forEach((p, i) => {
        if (p.gone || p.pins.includes(h)) return
        const key = `${i}:${h}`
        if (!Collision.collides(p.body, bolt)) this.clearBolts.add(key)
        if (this.clearBolts.has(key)) {
          bolt.collisionFilter.mask! |= p.body.collisionFilter.category!
          p.body.collisionFilter.mask! |= bolt.collisionFilter.category!
        }
      })
    }
    for (let i = 0; i < this.pieces.length; i++) for (let j = i + 1; j < this.pieces.length; j++) {
      const a = this.pieces[i], b = this.pieces[j], key = `${i}:${j}`
      if (a.gone || b.gone) continue
      // Initially overlapping boards sit in different depth layers. Do not
      // explosively resolve those overlaps; once clear, physical collisions
      // take over, so a swinging/falling board can hit another board.
      if (!this.separated.has(key) && !Collision.collides(a.body, b.body)) this.separated.add(key)
      if (this.separated.has(key)) {
        a.body.collisionFilter.mask! |= b.body.collisionFilter.category!
        b.body.collisionFilter.mask! |= a.body.collisionFilter.category!
      }
    }
  }

  step(delta = 1000 / 60) {
    this.updateCollisions(); Engine.update(this.engine, delta)
    this.pieces.forEach(p => {
      if (!p.gone && p.pins.every(h => h === null) && p.body.bounds.min.y > 380) {
        p.gone = true; Composite.remove(this.engine.world, p.body)
      }
    })
  }

  get views(): PlateView[] {
    return this.pieces.flatMap((p, i) => p.gone ? [] : [{ i, x: p.body.position.x, y: p.body.position.y,
      angle: p.body.angle * 180 / Math.PI, length: p.span + 40, a: this.point(p, 0), b: this.point(p, 1) }])
  }
  get remaining() { return this.pieces.filter(p => !p.gone).length }
  get active() { return this.pieces.some(p => !p.gone && !p.body.isStatic && !p.body.isSleeping) }
  hint(): [number, number] | null {
    const destinations = holes.map((point, h) => ({ point, h })).filter(({ point, h }) => !this.screws.includes(h)
      && this.pieces.every(p => p.gone || !this.covers(p, point))).sort((a, b) => a.point.y - b.point.y)
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i]
      if (piece.gone) continue
      for (const from of piece.pins) {
        if (from === null || !this.accessible(from)) continue
        if (destinations.length) return [from, destinations[0].h]
      }
    }
    // Detached boards can rest on parked screws: remove those supports too.
    for (const from of [...this.screws].sort((a, b) => holes[b].y - holes[a].y)) {
      if (!this.accessible(from)) continue
      const bolt = this.bolts.get(from)!
      const supporting = this.pieces.some((p, i) => !p.gone && !p.pins.includes(from)
        && this.clearBolts.has(`${i}:${from}`) && Matter.Query.collides(bolt, [p.body]).length > 0)
      const target = destinations.find(({ point }) => point.y < holes[from].y)
      if (supporting && target) return [from, target.h]
    }
    return null
  }
  snapshot(): ScrewPhysicsSave {
    return { screws: [...this.screws], moves: this.moves, separated: [...this.separated], clearBolts: [...this.clearBolts], plates: this.pieces.map(p => ({
      x: p.body.position.x, y: p.body.position.y, angle: p.body.angle, vx: p.body.velocity.x, vy: p.body.velocity.y,
      av: p.body.angularVelocity, pins: [...p.pins], gone: p.gone,
    })) }
  }
  destroy() { Composite.clear(this.engine.world, false); Engine.clear(this.engine) }
}

export function validPhysicsSave(level: ScrewLevel, value: unknown): value is ScrewPhysicsSave {
  const s = value as ScrewPhysicsSave | null
  return !!s && Number.isSafeInteger(s.moves) && s.moves >= 0 && Array.isArray(s.screws)
    && s.screws.length === level.screws.length && new Set(s.screws).size === s.screws.length
    && s.screws.every(h => Number.isInteger(h) && !!holes[h]) && Array.isArray(s.plates) && s.plates.length === level.plates.length
    && s.plates.every(p => p && [p.x, p.y, p.angle, p.vx, p.vy, p.av].every(Number.isFinite)
      && Math.abs(p.x) < 2000 && Math.abs(p.y) < 2000 && Math.abs(p.angle) < 10000
      && Math.abs(p.vx) < 100 && Math.abs(p.vy) < 100 && Math.abs(p.av) < 10 && typeof p.gone === 'boolean'
      && Array.isArray(p.pins) && p.pins.length === 2 && (p.pins[0] === null || p.pins[0] !== p.pins[1])
      && p.pins.every(h => h === null || (Number.isInteger(h) && s.screws.includes(h)))
      && (!p.gone || p.pins.every(h => h === null)))
    && Array.isArray(s.separated) && s.separated.length <= level.plates.length ** 2
    && s.separated.every(k => typeof k === 'string' && /^\d+:\d+$/.test(k))
    && (s.clearBolts === undefined || (Array.isArray(s.clearBolts) && s.clearBolts.length <= level.plates.length * holes.length
      && s.clearBolts.every(k => typeof k === 'string' && /^\d+:\d+$/.test(k))))
}
