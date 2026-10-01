// Run: node --experimental-transform-types scripts/test-dragon-merge.mjs
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

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
assert(crowded.snapshot().pieces.some(p => p.y - RADII[p.level] < DANGER))
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
jitter.engine.setGravity({x:0, y:0})
for (let i = 0; i < 100; i++) {
  const p = [...jitter.pieces.values()][0]
  p.body.setPosition({ x: 180 / 50, y: 40 / 50 })
  p.body.setLinearVelocity({ x: 0, y: 2 })
  jitter.step()
}
assert(jitter.over)
jitter.destroy()
console.log('Merge: old saves, 4 extra tiers, continuous play, retained final balls and overflow passed.')

// Loss of a settled support must not leave a floating sleeping ball.
const unsupported = new MergeWorld(save([piece(3, 180, 443), piece(0, 180, 390)]))
advance(unsupported, 90)
const support = [...unsupported.pieces.values()].find(p => p.level === 3)
const upper = [...unsupported.pieces.values()].find(p => p.level === 0)
const before = upper.body.getPosition().y
unsupported.engine.destroyBody(support.body)
unsupported.pieces.delete(support.body.getUserData())
advance(unsupported, 120)
assert(upper.body.getPosition().y > before + 0.5, 'Unsupported balls must fall')
unsupported.destroy()

// A circle is not a polygon with a flat top. Slightly off-centre balls roll.
for (const direction of [-1, 1]) {
  const rolling = new MergeWorld(save([piece(6, 180, 413), piece(0, 180 + direction, 330)]))
  advance(rolling, 300)
  const top = rolling.snapshot().pieces.find(p => p.level === 0)
  assert(Math.abs(top.x - 180) > 70 && top.y > 440, 'A single off-centre support cannot hold a ball up')
  rolling.destroy()
}

// The normal launch itself includes only a small release imperfection.
const balance = new MergeWorld(save([piece(6, 180, 413)]), () => 0)
assert(balance.drop(180))
advance(balance, 360)
assert(balance.snapshot().pieces.find(p => p.level === 0).y > 440, 'A dropped ball should roll off a lone round support')
balance.destroy()

// A proper two-point cradle stays supported, instead of indiscriminate nudges.
const cradle = new MergeWorld(save([piece(2, 151, 451), piece(3, 217, 443), piece(0, 181, 415)]))
for (const p of cradle.pieces.values()) if(p.level > 0) p.body.setType('static')
advance(cradle, 360)
const cradled = cradle.snapshot().pieces.find(p => p.level === 0)
assert(cradled.x > 150 && cradled.x < 217 && cradled.y < 440)
cradle.destroy()

// Bounded substeps: neither fast balls nor crowded growth can tunnel.
const fast = new MergeWorld(save([{...piece(0,180,300), vx:100}, piece(4,280,434)]))
advance(fast, 360)
for (const p of fast.snapshot().pieces) assert(p.x >= RADII[p.level] - 1 && p.x <= 360 - RADII[p.level] + 1 && p.y + RADII[p.level] <= 481)
fast.destroy()
const headOn = new MergeWorld(save([{...piece(0,90,300), vx:100}, {...piece(1,270,300), vx:-100}]))
headOn.engine.setGravity({x:0,y:0})
for (let frame=0;frame<30;frame++) {
  headOn.step()
  const s=headOn.snapshot()
  assert(s.pieces.find(p=>p.level===0).x<s.pieces.find(p=>p.level===1).x, 'Fast opposing circles must not pass through each other')
}
headOn.destroy()

const timing=[]
for (const fps of [30,60,120]) {
  const w=new MergeWorld(save([piece(3,100,400),piece(0,101,340),{...piece(1,260,220),vx:-0.5,av:0.08}]))
  for(let frame=0;frame<fps*3;frame++)w.step(1000/fps)
  timing.push(w.snapshot());w.destroy()
}
assert.deepEqual(timing[0],timing[1]);assert.deepEqual(timing[1],timing[2], 'Physics timing must be independent of display refresh rate')

const expanding = new MergeWorld(save([piece(4, 134, 434), piece(4, 226, 434), piece(0, 180, 390)]))
expanding.step()
const fused = expanding.snapshot()
assert(fused.pieces.some(p => p.radius < RADII[p.level]))
const midRestore = new MergeWorld(JSON.parse(JSON.stringify(fused)))
assert(validSave(midRestore.snapshot()))
for (const [i, p] of midRestore.snapshot().pieces.entries()) {
  for (const field of ['x', 'y', 'angle', 'vx', 'vy', 'av', 'radius', 'age', 'overflow'])
    assert(Math.abs(p[field] - fused.pieces[i][field]) < 1e-9, `Moving fusion restore changed ${field}`)
}
advance(midRestore, 120)
assert(midRestore.snapshot().pieces.every(p => p.radius === RADII[p.level]))
midRestore.destroy()
let maximumLift = 0
for (let frame = 0; frame < 90; frame++) {
  expanding.step()
  const p = expanding.snapshot().pieces.find(p => p.level === 0)
  maximumLift = Math.max(maximumLift, 390 - p.y)
}
assert(expanding.score > 17200)
assert(maximumLift > 8, 'Growing merged balls should push neighbours upwards')
const expanded = expanding.snapshot()
for (let i=0;i<expanded.pieces.length;i++) for(let j=i+1;j<expanded.pieces.length;j++) {
  const a=expanded.pieces[i],b=expanded.pieces[j]
  assert(Math.hypot(a.x-b.x,a.y-b.y) >= a.radius+b.radius-1, 'Settled growth must not leave deep overlaps')
}
assert(validSave(expanded))
const growthRestore = new MergeWorld(JSON.parse(JSON.stringify(expanded)))
assert.deepEqual(growthRestore.snapshot().pieces, expanded.pieces)
expanding.destroy(); growthRestore.destroy()

const random = seed => () => {seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/2**32}
let drops = 0, merges = 0, wallError = 0, overlapError = 0, worstWall = null, worstPair = null
const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : Array.from({length:30}, (_,i) => i+1)
for (const seed of seeds) {
  const rng=random(seed), world=new MergeWorld(undefined,rng)
  for(let i=0;i<120&&!world.over;i++) {
    if(world.ready) { assert(world.drop(16+rng()*328)); drops++ }
    const beforeCount = world.pieces.size
    advance(world,42)
    merges += beforeCount - world.pieces.size
    const s=world.snapshot()
    assert(validSave(s), `Invalid stress save, seed ${seed}, drop ${i}: ${JSON.stringify(s)}`)
    for(const p of s.pieces) {
      const error = Math.max(p.radius-p.x, p.x+p.radius-360, p.y+p.radius-480)
      if (error > wallError) { wallError = error; worstWall = {seed, drop:i, ...p} }
    }
    for(let a=0;a<s.pieces.length;a++) for(let b=a+1;b<s.pieces.length;b++) {
      const p=s.pieces[a], q=s.pieces[b]
      const error=p.radius+q.radius-Math.hypot(p.x-q.x,p.y-q.y)
      if(error>overlapError) {overlapError=error;worstPair={seed,drop:i,p,q}}
    }
  }
  world.destroy()
}
assert(drops>seeds.length*30 && merges>seeds.length*30)
assert(wallError < 1, `Deep wall overlap: ${JSON.stringify(worstWall)}`)
assert(overlapError < 2, `Deep ball overlap: ${overlapError}px, ${JSON.stringify(worstPair)}`)
console.log(`Merge physics: unsupported fall, rolling, cradle, fast collisions, growth pressure, restore, ${drops} drops and ${merges} merges passed. Maximum wall/ball error ${wallError.toFixed(2)}/${overlapError.toFixed(2)}px.`)
