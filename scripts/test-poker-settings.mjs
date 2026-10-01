import assert from 'node:assert/strict'
import { createTable, action, deal, botAction, humanSeat, tableSettings, validSettings, validPoker, restorePoker, mayRaise, raiseMin, botStyles } from '../src/games/poker/logic.ts'
const random = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 }
const config = (human, bots) => ({ seats: Array.from({length:6}, (_,i) => ({kind:i === human ? 'human' : bots.includes(i) ? 'bot' : 'empty',style:Object.keys(botStyles)[i%4]})), bounty:true })
assert(!validSettings(config(0, [])))
assert(!validSettings({ ...config(0,[1]), seats:Array(6).fill({kind:'bot',style:'tag'}) }))
assert(!validSettings({ ...config(0,[1]), seats:Array(6).fill({kind:'human',style:'tag'}) }))
assert(validSettings(config(5,[0])))
assert.equal(createTable().players.length,6)
assert.equal(createTable().bankroll,6000)
for (const value of [null, undefined, [], 42, '', {}, {version:2,players:Array(6).fill(null)}]) assert(!validPoker(value))
const malformed=createTable(config(0,[1]))
for (const field of ['players','deck','board','pending','acted','actedAt','log','revealed']) assert(!validPoker({...malformed,[field]:null}))
assert(!validPoker({...malformed,actor:undefined,pending:[]}))

let hands = 0
for (let self = 0; self < 6; self++) for (const bots of [[(self+2)%6], [0,1,2,3,4,5].filter(i=>i!==self)]) {
  const rng=random(self+31), s=createTable(config(self,bots),rng)
  assert.equal(humanSeat(s),self)
  for (let hand=0;hand<15;hand++) {
    let moves=0
    while (!s.done) {
      assert(validPoker(s)); assert(moves++ < 180)
      if(s.actor===self) {
        const p=s.players[self], n=rng()
        if(n<0.08) action(s,'fold')
        else if(n>0.75 && mayRaise(s)) action(s,'raise',Math.min(p.bet+p.chips,raiseMin(s)+20))
        else action(s,'call')
      } else botAction(s,rng)
    }
    assert(validPoker(s)); assert.equal(s.players.reduce((sum,p)=>sum+p.chips,0),s.bankroll)
    assert(s.players.filter(p=>p.kind==='empty').every(p=>!p.playing&&!p.hole.length&&p.chips===0))
    assert(validPoker(JSON.parse(JSON.stringify(s))))
    hands++; if (!deal(s,rng)) break
  }
}

// Heads-up button/small blind and action order work at every physical seat.
for(let human=0;human<6;human++) for(let bot=0;bot<6;bot++) if(human!==bot) {
  const s=createTable(config(human,[bot]),random(7))
  assert.equal(s.players[s.dealer].bet,10);assert.equal(s.actor,s.dealer)
  while(s.street===0&&!s.done) assert(action(s,'call'))
  assert.equal(s.actor,s.dealer===human?bot:human)
}

// Multiple short all-ins can cumulatively reopen action after a full raise.
const short=createTable()
short.current=100;short.minRaise=100;short.actor=1;short.pending=[1,2,3,4,5,0];short.acted=[0];short.actedAt[0]=100
short.players.forEach(p=>{p.bet=100;p.total=100;p.chips=900;p.folded=false;p.playing=true})
short.players[1].chips=40;short.players[2].chips=80;short.players[3].chips=120
assert(action(short,'raise',140));assert(!mayRaise(short,0))
assert(action(short,'raise',180));assert(!mayRaise(short,0))
assert(action(short,'raise',220));assert(mayRaise(short,0));assert.equal(short.minRaise,100)

// Changing robot style changes decisions without seeing anyone else's cards.
const decisions={}
for(const style of Object.keys(botStyles)) {
  const stats={fold:0,call:0,raise:0}
  for(let seed=1;seed<=120;seed++) {
    const s=createTable(config(1,[0]),random(seed));s.players[0].style=style
    const before=s.current;botAction(s,random(seed+9000))
    stats[s.players[0].folded?'fold':s.current>before?'raise':'call']++
  }
  decisions[style]=stats
}
assert(decisions.rock.fold>decisions.calling.fold)
assert(decisions.lag.raise>decisions.calling.raise)
assert(decisions.tag.raise>decisions.rock.raise)
const honest=createTable(config(5,[0,1,2])), altered=structuredClone(honest)
const actor=honest.actor
for(let i=0;i<6;i++) if(i!==actor) altered.players[i].hole=[i,i+13]
altered.deck.reverse();botAction(honest,random(77));botAction(altered,random(77))
assert.deepEqual(honest.players[actor],altered.players[actor])

const old=createTable(config(0,[1,2,3]),random(13))
const legacy={...old,version:1,players:old.players.slice(0,4)}
delete legacy.bankroll;delete legacy.actedAt
const resumed=restorePoker(JSON.parse(JSON.stringify(legacy)))
assert(resumed && validPoker(resumed));assert.equal(resumed.bankroll,4000)
assert.equal(resumed.actor,old.actor);assert.deepEqual(resumed.players.slice(0,4).map(p=>[p.chips,p.hole,p.bet]),old.players.slice(0,4).map(p=>[p.chips,p.hole,p.bet]))
assert.equal(tableSettings(resumed).seats.filter(p=>p.kind==='empty').length,2)
assert.equal(restorePoker({...old,bankroll:5000}),null)
console.log(`Poker settings: all six human seats, empty seats, ${hands} hands, 30 heads-up positions, styles, short all-ins and legacy saves passed.`)
console.log(decisions)
