import Matter from 'matter-js'
import { RADII } from './levels'
export { RADII } from './levels'

const { Bodies, Body, Composite, Engine, Events } = Matter
export const WIDTH = 360, HEIGHT = 480, DANGER = 74

export interface SavedPiece { level: number; x: number; y: number; angle: number; vx: number; vy: number; age: number }
export interface MergeSave {
  pieces: SavedPiece[]
  score: number
  current: number
  next: number
  keepPlaying: boolean
  over: boolean
  maxLevel: number
}
export interface DragonPiece { body: Matter.Body; level: number; born: number; overflow: number }
export interface MergeEffect { x: number; y: number; radius: number; age: number }

export function validSave(value: unknown): value is MergeSave {
  if (!value || typeof value !== 'object') return false
  const save = value as MergeSave
  return Number.isSafeInteger(save.score) && save.score >= 0
    && Number.isInteger(save.current) && save.current >= 0 && save.current <= 3
    && Number.isInteger(save.next) && save.next >= 0 && save.next <= 3
    && typeof save.keepPlaying === 'boolean' && typeof save.over === 'boolean'
    && Number.isInteger(save.maxLevel) && save.maxLevel >= 0 && save.maxLevel < RADII.length
    && Array.isArray(save.pieces) && save.pieces.length <= 120
    && save.pieces.every(piece => piece && Number.isInteger(piece.level) && piece.level >= 0 && piece.level < RADII.length
      && Number.isFinite(piece.x) && piece.x >= RADII[piece.level] - 3 && piece.x <= WIDTH - RADII[piece.level] + 3
      && Number.isFinite(piece.y) && piece.y >= -100 && piece.y <= HEIGHT + 5
      && Number.isFinite(piece.angle) && Math.abs(piece.angle) < 1e6
      && Number.isFinite(piece.vx) && Math.abs(piece.vx) <= 100
      && Number.isFinite(piece.vy) && Math.abs(piece.vy) <= 100
      && Number.isFinite(piece.age) && piece.age >= 0 && piece.age <= 1e12)
}

export class MergeWorld {
  readonly engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 8 })
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
  private pending: [number, number][] = []
  private readonly collect = (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) this.pending.push([pair.bodyA.id, pair.bodyB.id])
  }

  constructor(saved?: MergeSave, private readonly random: () => number = Math.random) {
    this.current = this.chooseLevel(); this.next = this.chooseLevel()
    this.engine.gravity.y = 1.1
    Composite.add(this.engine.world, [
      Bodies.rectangle(-9, HEIGHT / 2, 18, HEIGHT + 200, { isStatic: true }),
      Bodies.rectangle(WIDTH + 9, HEIGHT / 2, 18, HEIGHT + 200, { isStatic: true }),
      Bodies.rectangle(WIDTH / 2, HEIGHT + 9, WIDTH + 36, 18, { isStatic: true }),
    ])
    Events.on(this.engine, 'collisionStart', this.collect)
    Events.on(this.engine, 'collisionActive', this.collect)
    if (saved) {
      this.score = saved.score; this.current = saved.current; this.next = saved.next
      this.maxLevel = saved.maxLevel; this.keepPlaying = saved.keepPlaying; this.over = saved.over
      for (const piece of saved.pieces) {
        const body = this.add(piece.level, piece.x, piece.y, -piece.age)
        Body.setAngle(body, piece.angle)
        Body.setVelocity(body, { x: piece.vx, y: piece.vy })
      }
      // A restored falling piece gets time to clear the launch area before another drop.
      if ([...this.pieces.values()].some(piece => piece.body.position.y < DANGER + RADII[piece.level])) this.readyAt = 650
    }
  }

  private chooseLevel() {
    const chance = this.random()
    return chance < 0.45 ? 0 : chance < 0.75 ? 1 : chance < 0.93 ? 2 : 3
  }
  get ready() { return !this.over && this.elapsed >= this.readyAt }
  get danger() { return Math.min(1, Math.max(0, ...[...this.pieces.values()].map(piece => piece.overflow / 1400))) }

  private add(level: number, x: number, y: number, born = this.elapsed) {
    const radius = RADII[level]
    const body = Bodies.circle(Math.max(radius + 0.5, Math.min(WIDTH - radius - 0.5, x)), y, radius, {
      restitution: 0.12, friction: 0.4, frictionStatic: 0.9, frictionAir: 0.012,
      density: 0.001, slop: 0.03, sleepThreshold: 70,
    })
    Composite.add(this.engine.world, body)
    this.pieces.set(body.id, { body, level, born, overflow: 0 })
    return body
  }

  drop(x: number) {
    if (!this.ready) return false
    this.add(this.current, x, 32)
    this.maxLevel = Math.max(this.maxLevel, this.current)
    this.current = this.next; this.next = this.chooseLevel()
    this.readyAt = this.elapsed + 650
    return true
  }

  step(delta = 1000 / 60) {
    if (this.over) return
    this.elapsed += delta
    Engine.update(this.engine, delta)
    const queue = this.pending
    this.pending = []
    for (const [a, b] of queue) {
      const first = this.pieces.get(a), second = this.pieces.get(b)
      if (!first || !second || first.level !== second.level || first.level === RADII.length - 1) continue
      const level = first.level + 1, radius = RADII[level]
      const x = (first.body.position.x + second.body.position.x) / 2
      const y = Math.min(HEIGHT - radius - 1, (first.body.position.y + second.body.position.y) / 2)
      const vx = (first.body.velocity.x + second.body.velocity.x) / 2
      const vy = (first.body.velocity.y + second.body.velocity.y) / 2
      Composite.remove(this.engine.world, [first.body, second.body])
      this.pieces.delete(a); this.pieces.delete(b)
      const body = this.add(level, x, y)
      Body.setVelocity(body, { x: vx * 0.5, y: Math.min(2, vy * 0.5) })
      this.score += 10 * 2 ** level
      this.maxLevel = Math.max(this.maxLevel, level)
      this.effects.push({ x: body.position.x, y, radius, age: 0 })
    }
    this.effects = this.effects.filter(effect => { effect.age += delta; return effect.age < 380 })
    for (const piece of this.pieces.values()) {
      const top = piece.body.position.y - RADII[piece.level]
      // Ignore newly dropped/merged pieces briefly, but don't let pile jitter prevent overflow.
      if (this.elapsed - piece.born > 1400 && top < DANGER) piece.overflow += delta
      else piece.overflow = 0
      if (piece.overflow >= 1400) this.over = true
    }
  }

  snapshot(): MergeSave {
    return {
      score: this.score, current: this.current, next: this.next, maxLevel: this.maxLevel,
      keepPlaying: this.keepPlaying, over: this.over,
      pieces: [...this.pieces.values()].map(({ body, level, born }) => ({
        level, x: body.position.x, y: body.position.y, angle: body.angle,
        vx: body.velocity.x, vy: body.velocity.y, age: Math.max(0, this.elapsed - born),
      })),
    }
  }

  destroy() {
    Events.off(this.engine, 'collisionStart', this.collect)
    Events.off(this.engine, 'collisionActive', this.collect)
    Composite.clear(this.engine.world, false)
    Engine.clear(this.engine)
    this.pieces.clear(); this.pending = []; this.effects = []
  }
}
