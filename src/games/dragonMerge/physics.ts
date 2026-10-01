import { World, Box, Circle, testOverlap, type Body, type Fixture } from 'planck'
import { RADII } from './levels'
export { RADII } from './levels'

export const WIDTH = 360, HEIGHT = 480, DANGER = 74
// Box2D uses metres and seconds. Only the view and legacy saves use pixels.
export const SCALE = 50
const STEP = 1000 / 120, FRAME = 1000 / 60, GROWTH_SPEED = 180
const position = (body: Body) => ({ x: body.getPosition().x * SCALE, y: body.getPosition().y * SCALE })
export interface SavedPiece {
  level: number; x: number; y: number; angle: number; vx: number; vy: number; age: number
  av?: number; radius?: number; overflow?: number
}
export interface MergeSave {
  pieces: SavedPiece[]; score: number; current: number; next: number
  keepPlaying: boolean; over: boolean; maxLevel: number; cooldown?: number
}
export interface DragonPiece { body: Body; fixture: Fixture; level: number; radius: number; born: number; overflow: number }
export interface MergeEffect { x: number; y: number; radius: number; age: number }

export function validSave(value: unknown): value is MergeSave {
  if (!value || typeof value !== 'object') return false
  const save = value as MergeSave
  return Number.isSafeInteger(save.score) && save.score >= 0
    && Number.isInteger(save.current) && save.current >= 0 && save.current <= 3
    && Number.isInteger(save.next) && save.next >= 0 && save.next <= 3
    && typeof save.keepPlaying === 'boolean' && typeof save.over === 'boolean'
    && Number.isInteger(save.maxLevel) && save.maxLevel >= 0 && save.maxLevel < RADII.length
    && (save.cooldown === undefined || (Number.isFinite(save.cooldown) && save.cooldown >= 0 && save.cooldown <= 650))
    && Array.isArray(save.pieces) && save.pieces.length <= 120
    && save.pieces.every(piece => piece && Number.isInteger(piece.level) && piece.level >= 0 && piece.level < RADII.length
      && Number.isFinite(piece.x) && piece.x >= -3 && piece.x <= WIDTH + 3
      && Number.isFinite(piece.y) && piece.y >= -HEIGHT * 2 && piece.y <= HEIGHT + 5
      && Number.isFinite(piece.angle) && Math.abs(piece.angle) < 1e6
      && Number.isFinite(piece.vx) && Math.abs(piece.vx) <= 100
      && Number.isFinite(piece.vy) && Math.abs(piece.vy) <= 100
      && Number.isFinite(piece.age) && piece.age >= 0 && piece.age <= 1e12
      && (piece.av === undefined || (Number.isFinite(piece.av) && Math.abs(piece.av) <= 100))
      && (piece.radius === undefined || (Number.isFinite(piece.radius) && piece.radius >= 2 && piece.radius <= RADII[piece.level]))
      && (piece.overflow === undefined || (Number.isFinite(piece.overflow) && piece.overflow >= 0 && piece.overflow <= 1500)))
}

export class MergeWorld {
  // TOI resolves only a small contact island, which can deform a crowded pile.
  // Bounded substeps instead solve the whole connected pile together.
  readonly engine = new World({ gravity: { x: 0, y: 24 }, allowSleep: false, continuousPhysics: false, warmStarting: false })
  readonly pieces = new Map<number, DragonPiece>()
  effects: MergeEffect[] = []
  score = 0
  current: number
  next: number
  maxLevel = 0
  keepPlaying = false
  over = false
  elapsed = 0
  private readyAt = 0
  private accumulator = 0
  private serial = 0
  private readonly random: () => number

  constructor(saved?: MergeSave, random: () => number = Math.random) {
    this.random = random
    this.current = this.chooseLevel(); this.next = this.chooseLevel()
    const wall = this.engine.createBody()
    // No ceiling: an expanding pile can push balls upwards, not through the floor.
    wall.createFixture(new Box(0.2, 20, { x: -0.2, y: 0 }), { friction: 0.2 })
    wall.createFixture(new Box(0.2, 20, { x: WIDTH / SCALE + 0.2, y: 0 }), { friction: 0.2 })
    wall.createFixture(new Box(WIDTH / SCALE / 2 + 0.4, 0.2, { x: WIDTH / SCALE / 2, y: HEIGHT / SCALE + 0.2 }), { friction: 0.3 })
    if (saved) {
      this.score = saved.score; this.current = saved.current; this.next = saved.next
      this.maxLevel = saved.maxLevel; this.keepPlaying = saved.keepPlaying; this.over = saved.over
      for (const piece of saved.pieces) {
        const body = this.add(piece.level, piece.x, piece.y, -piece.age, piece.radius)
        body.setAngle(piece.angle)
        body.setLinearVelocity({ x: piece.vx * 60 / SCALE, y: piece.vy * 60 / SCALE })
        body.setAngularVelocity((piece.av ?? 0) * 60)
        this.pieces.get(body.getUserData() as number)!.overflow = piece.overflow ?? 0
      }
      this.readyAt = saved.cooldown ?? (saved.pieces.some(piece => piece.y < DANGER + RADII[piece.level]) ? 650 : 0)
    }
  }

  private chooseLevel() {
    const chance = this.random()
    return chance < 0.45 ? 0 : chance < 0.75 ? 1 : chance < 0.93 ? 2 : 3
  }
  get ready() { return !this.over && this.elapsed + 1e-7 >= this.readyAt }
  get danger() { return Math.min(1, Math.max(0, ...[...this.pieces.values()].map(piece => piece.overflow / 1400))) }

  private fixture(body: Body, level: number, radius: number) {
    return body.createFixture(new Circle(radius / SCALE), {
      density: RADII[level] * SCALE / (Math.PI * radius ** 2), friction: 0.22, restitution: 0.08,
    })
  }
  private add(level: number, x: number, y: number, born = this.elapsed, radius: number = RADII[level]) {
    const body = this.engine.createDynamicBody({
      position: { x: x / SCALE, y: y / SCALE },
      linearDamping: 0.45, angularDamping: 0.3, allowSleep: false, userData: ++this.serial,
    })
    // Mass grows with diameter (maximum ratio 11:1), not exponentially by tier.
    const fixture = this.fixture(body, level, radius)
    this.pieces.set(this.serial, { body, fixture, level, radius, born, overflow: 0 })
    return body
  }

  drop(x: number) {
    if (!this.ready || !Number.isFinite(x)) return false
    const radius = RADII[this.current]
    const body = this.add(this.current, Math.max(radius + 0.25, Math.min(WIDTH - radius - 0.25, x)), 32)
    // A tiny release velocity avoids mathematically perfect, unstable balancing.
    // It is applied once at release, never as a per-frame "roll away" force.
    body.setLinearVelocity({ x: (this.random() < 0.5 ? -1 : 1) * 0.08, y: 0 })
    this.maxLevel = Math.max(this.maxLevel, this.current)
    this.current = this.next; this.next = this.chooseLevel()
    this.readyAt = this.elapsed + 650
    return true
  }

  private grow(piece: DragonPiece, dt: number) {
    if (piece.radius >= RADII[piece.level]) return
    piece.radius = Math.min(RADII[piece.level], piece.radius + GROWTH_SPEED * dt)
    piece.body.destroyFixture(piece.fixture)
    piece.fixture = this.fixture(piece.body, piece.level, piece.radius)
  }

  private mergeContacts() {
    const pairs: [number, number][] = []
    for (let contact = this.engine.getContactList(); contact; contact = contact.getNext()) {
      const fa = contact.getFixtureA(), fb = contact.getFixtureB()
      const a = fa.getBody().getUserData(), b = fb.getBody().getUserData()
      if (typeof a !== 'number' || typeof b !== 'number') continue
      // New broad-phase contacts arrive after integration. Test their current
      // geometry too, so matching circles merge on touch, not a frame later.
      if (!contact.isTouching() && !testOverlap(fa.getShape(), 0, fb.getShape(), 0, fa.getBody().getTransform(), fb.getBody().getTransform())) continue
      pairs.push([Math.min(a, b), Math.max(a, b)])
    }
    pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1])
    for (const [a, b] of pairs) {
      const first = this.pieces.get(a), second = this.pieces.get(b)
      if (!first || !second || first.level !== second.level || first.level === RADII.length - 1) continue
      const pa = position(first.body), pb = position(second.body)
      const centre = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }
      const va = first.body.getLinearVelocity(), vb = second.body.getLinearVelocity()
      const velocity = { x: va.x * first.body.getMass() + vb.x * second.body.getMass(), y: va.y * first.body.getMass() + vb.y * second.body.getMass() }
      const orbital = (p: typeof pa, v: typeof va, mass: number) =>
        mass * ((p.x - centre.x) / SCALE * v.y - (p.y - centre.y) / SCALE * v.x)
      const momentum = first.body.getInertia() * first.body.getAngularVelocity()
        + second.body.getInertia() * second.body.getAngularVelocity()
        + orbital(pa, va, first.body.getMass()) + orbital(pb, vb, second.body.getMass())
      const level = first.level + 1
      const radius = Math.max(2, Math.min(first.radius, second.radius, centre.x, WIDTH - centre.x, HEIGHT - centre.y,
        ...[...this.pieces.entries()].filter(([id]) => id !== a && id !== b)
          .map(([, piece]) => { const p = position(piece.body); return Math.hypot(p.x - centre.x, p.y - centre.y) - piece.radius })))
      this.engine.destroyBody(first.body); this.engine.destroyBody(second.body)
      this.pieces.delete(a); this.pieces.delete(b)
      const body = this.add(level, centre.x, centre.y, this.elapsed, radius)
      body.setLinearVelocity({ x: velocity.x / body.getMass(), y: velocity.y / body.getMass() })
      // The fusion event assigns the final body's spin. Do not compress its
      // angular momentum into the tiny starting radius: that adds huge energy.
      body.setAngularVelocity(momentum / (body.getMass() * (RADII[level] / SCALE) ** 2 / 2))
      // The contact graph is rebuilt by Box2D; no frozen-support bookkeeping.
      for (const piece of this.pieces.values()) piece.body.setAwake(true)
      this.score += 10 * 2 ** level
      this.maxLevel = Math.max(this.maxLevel, level)
      this.effects.push({ ...position(body), radius: RADII[level], age: 0 })
    }
  }

  step(delta = FRAME) {
    if (this.over || !Number.isFinite(delta) || delta <= 0) return
    this.accumulator += Math.min(delta, 100)
    while (this.accumulator + 1e-7 >= STEP && !this.over) {
      this.accumulator -= STEP
      let subdivisions = 3
      for (const piece of this.pieces.values()) {
        const v = piece.body.getLinearVelocity()
        subdivisions = Math.max(subdivisions, Math.ceil((Math.hypot(v.x, v.y) + 24 * STEP / 1000) * SCALE * STEP / 1000))
        if (piece.radius < RADII[piece.level]) subdivisions = Math.max(subdivisions, Math.ceil(GROWTH_SPEED * STEP / 1000 / 0.5))
      }
      const dt = STEP / 1000 / subdivisions
      // Adaptive substeps use fresh impulses: scaling a cached contact impulse
      // across a sharply different timestep can inject energy into the pile.
      for (let substep = 0; substep < subdivisions && !this.over; substep++) {
        // Fuse before the solve so the new rigid circle and all its
        // neighbours are resolved together, including the side walls/floor.
        this.mergeContacts()
        this.elapsed += dt * 1000
        for (const piece of this.pieces.values()) this.grow(piece, dt)
        this.engine.step(dt, 16, 96)
        this.effects = this.effects.filter(effect => { effect.age += dt * 1000; return effect.age < 380 })
        for (const piece of this.pieces.values()) {
          const top = position(piece.body).y - piece.radius
          if (this.elapsed - piece.born > 1400 && top < DANGER) piece.overflow += dt * 1000
          else piece.overflow = 0
          if (piece.overflow + 1e-7 >= 1400) this.over = true
        }
      }
    }
  }

  snapshot(): MergeSave {
    return {
      score: this.score, current: this.current, next: this.next, maxLevel: this.maxLevel,
      keepPlaying: this.keepPlaying, over: this.over, cooldown: Math.max(0, this.readyAt - this.elapsed),
      pieces: [...this.pieces.values()].map(({ body, level, radius, born, overflow }) => ({
        level, ...position(body), radius, angle: body.getAngle(), av: body.getAngularVelocity() / 60,
        vx: body.getLinearVelocity().x * SCALE / 60, vy: body.getLinearVelocity().y * SCALE / 60,
        age: Math.max(0, this.elapsed - born), overflow,
      })),
    }
  }
  destroy() {
    for (let body = this.engine.getBodyList(); body;) { const next = body.getNext(); this.engine.destroyBody(body); body = next }
    this.pieces.clear(); this.effects = []
  }
}
