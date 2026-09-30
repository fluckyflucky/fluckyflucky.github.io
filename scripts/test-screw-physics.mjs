import assert from 'node:assert/strict'
import Matter from 'matter-js'
import { ScrewWorld, validPhysicsSave } from '../src/games/screws/physics.ts'
import { levels, holes } from '../src/games/screws/logic.ts'

function steps(world, count) { for (let i = 0; i < count; i++) world.step() }
const pendulum = new ScrewWorld(levels[0])
steps(pendulum, 60)
assert(Math.abs(pendulum.views[0].angle) < 0.001, 'Two screws keep a board still')
assert(!pendulum.accessible(7), 'The intact board initially covers this empty hole')
assert(pendulum.relocate(6, 0))
assert.equal(pendulum.remaining, 1, 'Removing one screw must not delete the plate')
steps(pendulum, 45)
assert(Math.abs(pendulum.views[0].angle) > 30, 'Gravity must visibly rotate a single-pinned board')
assert(Math.hypot(pendulum.views[0].b.x - holes[9].x, pendulum.views[0].b.y - holes[9].y) < 1, 'The remaining screw is the fixed pivot')
assert(!pendulum.pieces[0].body.isStatic)
assert(pendulum.pieces[0].joints.length === 1)
assert(pendulum.accessible(7), 'Rotating the board must reveal the previously covered hole')
const snapshot = pendulum.snapshot()
assert(validPhysicsSave(levels[0], snapshot))
const restored = new ScrewWorld(levels[0], JSON.parse(JSON.stringify(snapshot)))
assert(Math.abs(restored.views[0].angle - pendulum.views[0].angle) < 0.001)
steps(restored, 30)
assert(Math.abs(restored.views[0].angle - pendulum.views[0].angle) > 1, 'Restored pendulums continue moving')
assert(pendulum.relocate(9, 1))
assert.equal(pendulum.pieces[0].joints.length, 0)
assert.equal(pendulum.remaining, 1, 'Unpinned boards must fall physically before clearing')
steps(pendulum, 180)
assert.equal(pendulum.remaining, 0)
assert(!validPhysicsSave(levels[0], { ...snapshot, plates: [{ ...snapshot.plates[0], x: NaN }] }))
assert(!validPhysicsSave(levels[0], { ...snapshot, plates: [{ ...snapshot.plates[0], pins: [9, 9] }] }))
pendulum.destroy(); restored.destroy()

const repinned = new ScrewWorld(levels[0])
assert(repinned.relocate(6, 0)); assert(repinned.relocate(0, 6))
steps(repinned, 60)
assert(repinned.pieces[0].body.isStatic, 'An aligned reinserted screw must fix the board again')
assert(Math.abs(repinned.views[0].angle) < 0.001)
repinned.destroy()

const fixture = { name: 'Collision test', plates: [{ a: 2, b: 5, color: '#c90' }, { a: 10, b: 13, color: '#ac0' }], screws: [2, 5, 10, 13] }
const falling = new ScrewWorld(fixture)
let contacts = 0
Matter.Events.on(falling.engine, 'collisionStart', e => { contacts += e.pairs.length })
assert(falling.relocate(2, 0)); assert(falling.relocate(5, 1)); steps(falling, 180)
assert(contacts > 0, 'A falling board must collide with a lower board')
assert(falling.views[0].y < 230 && falling.views[0].y > 180, 'The lower board must support the fallen board')
assert.equal(falling.remaining, 2)
assert(falling.relocate(10, 18)); assert(falling.relocate(13, 19)); steps(falling, 240)
assert.equal(falling.remaining, 0, 'Removing the lower support lets both boards fall')
falling.destroy()

const boltFixture = { name: 'Screw stops a board', plates: [{ a: 2, b: 5, color: '#c90' }], screws: [2, 5, 10, 13] }
const blocked = new ScrewWorld(boltFixture)
let boltContacts = 0
Matter.Events.on(blocked.engine, 'collisionStart', e => { boltContacts += e.pairs.filter(p => p.bodyA.circleRadius || p.bodyB.circleRadius).length })
assert(blocked.relocate(2, 0)); assert(blocked.relocate(5, 1)); steps(blocked, 240)
assert(boltContacts > 0, 'Parked screws must be physical obstacles, not just drawings')
assert(blocked.views[0].y > 200 && blocked.views[0].y < 225, 'The board must rest above the screw heads')
assert.equal(blocked.remaining, 1)
const blockedRestore = new ScrewWorld(boltFixture, blocked.snapshot())
steps(blockedRestore, 120)
assert(blockedRestore.views[0].y < 225, 'Restoring must retain screw collision state')
assert(blocked.accessible(10) && blocked.accessible(13), 'Supporting screws must remain removable')
assert(blocked.relocate(10, 18)); assert(blocked.relocate(13, 19)); steps(blocked, 240)
assert.equal(blocked.remaining, 0, 'Removing the screw obstacles releases the board')
blocked.destroy(); blockedRestore.destroy()
const swingBlocked = new ScrewWorld({ ...levels[0], screws: [6, 9, 13] })
assert(swingBlocked.relocate(6, 0)); steps(swingBlocked, 240)
assert(swingBlocked.views[0].angle > -80 && swingBlocked.views[0].angle < -40, 'A swinging board must stop against a screw instead of passing through')
assert(Math.hypot(swingBlocked.views[0].b.x - holes[9].x, swingBlocked.views[0].b.y - holes[9].y) < 1, 'Screw collisions must not pull out the pivot')
swingBlocked.destroy()
for (const level of levels) {
  const fresh = new ScrewWorld(level)
  assert.equal(fresh.moves, 0)
  assert.deepEqual(fresh.screws, level.screws)
  assert(fresh.pieces.every(p => p.pins.every(h => h !== null)), 'Every fresh board starts with both screws')
  fresh.destroy()
}

// Let gravity act for a full second after every move: do not validate the
// old static puzzle by ripping out all screws before physics can respond.
for (const [i, level] of levels.entries()) {
  const world = new ScrewWorld(level)
  for (let turn = 0; turn < 100 && world.remaining; turn++) {
    const action = world.hint()
    if (action) assert(world.relocate(...action))
    steps(world, 60)
    assert(validPhysicsSave(level, world.snapshot()), `Invalid snapshot in level ${i + 1}`)
  }
  assert.equal(world.remaining, 0, `Physical level ${i + 1} must be completable`)
  world.destroy()
}
console.log(`${levels.length} physical levels passed: fixed boards, pivot rotation, free fall, collisions and restore.`)
