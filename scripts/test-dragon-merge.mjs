// Run: node --experimental-transform-types scripts/test-dragon-merge.mjs
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import Matter from 'matter-js'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './levels' && context.parentURL?.endsWith('/dragonMerge/physics.ts')) specifier += '.ts'
    return nextResolve(specifier, context)
  },
})
const { MergeWorld, RADII, DANGER, validSave } = await import('../src/games/dragonMerge/physics.ts')
const piece = (level, x, y) => ({ level, x, y, angle: 0, vx: 0, vy: 0, age: 5000 })
const save = pieces => ({ pieces, score: 17200, current: 0, next: 1, keepPlaying: false, over: false, maxLevel: Math.max(0, ...pieces.map(p => p.level)) })
const advance = (world, frames = 240) => { for (let i = 0; i < frames; i++) world.step() }

// An old completed game resumes automatically, without a win gate.
const oldSave = save([piece(8, 180, 388)])
assert(validSave(oldSave))
const old = new MergeWorld(oldSave)
advance(old)
assert(!old.over)
assert(old.ready)
assert(old.drop(40))
old.destroy()

// Every added tier merges onward, including the former final tier.
for (let level = 8; level < RADII.length - 1; level++) {
  const radius = RADII[level]
  const world = new MergeWorld(save([piece(level, 180 - 4, 480 - radius), piece(level, 180 + 4, 480 - radius)]))
  world.step()
  assert.equal(world.pieces.size, 1)
  assert.equal([...world.pieces.values()][0].level, level + 1)
  advance(world)
  assert(!world.over, `Tier ${level + 1} must not end the game`)
  assert(world.ready)
  assert(validSave(world.snapshot()))
  world.destroy()
}

// Final balls stay in the bucket. Two cannot fit below the danger line.
const finalLevel = RADII.length - 1
const crowded = new MergeWorld(save([piece(finalLevel, 180, 306), piece(finalLevel, 180, 120)]))
advance(crowded, 600)
assert.equal(crowded.pieces.size, 2)
assert(crowded.over)
assert([...crowded.pieces.values()].some(p => p.body.position.y - RADII[p.level] < DANGER))
assert(!crowded.drop(180))
crowded.destroy()

// A falling piece starts above the line, but must be allowed to settle.
const fresh = new MergeWorld(undefined, () => 0)
assert(fresh.drop(180))
advance(fresh)
assert(!fresh.over)
fresh.destroy()

// Movement cannot continually reset the overflow timer.
const jitter = new MergeWorld(save([piece(0, 180, 40)]))
jitter.engine.gravity.y = 0
for (let i = 0; i < 100; i++) {
  const p = [...jitter.pieces.values()][0]
  Matter.Body.setPosition(p.body, { x: 180, y: 40 })
  Matter.Body.setVelocity(p.body, { x: 0, y: 2 })
  jitter.step()
}
assert(jitter.over)
jitter.destroy()
console.log('Merge: old saves, 4 extra tiers, continuous play, retained final balls and overflow passed.')
