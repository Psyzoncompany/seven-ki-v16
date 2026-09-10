import test from 'node:test';
import assert from 'node:assert/strict';
import {VersusEngine,VERSUS_FIGHTERS,versusPose} from '../dist/versus.js';

test('every roster pairing including mirrors starts unlocked and ends by knockout',()=>{
 assert.equal(new Set(VERSUS_FIGHTERS.map(f=>f.id)).size,VERSUS_FIGHTERS.length);
 for(const p of VERSUS_FIGHTERS)for(const cpu of VERSUS_FIGHTERS){
  const g=new VersusEngine();g.startVersus(p.id,cpu.id);
  assert.equal(g.mode,'playing');assert.equal(g.dialogue,null);assert.equal(g.enemies.length,1);
  assert.equal(g.p.hp,300);assert.equal(g.boss.hp,300);assert.equal(g.orbs.length,0);assert.equal(g.hazards.length,0);
  assert.equal(g.versus.player.id,p.id);assert.equal(g.versus.opponent.id,cpu.id);
  g.versus.score.player=1;g.hitEnemy(g.boss,10000,0,1,{beam:true});assert(g.versus.finish);for(let i=0;i<101;i++)g.step(1/60);assert.equal(g.mode,'won',`${p.id} vs ${cpu.id}`);
  assert.equal(g.versus.winner,'player');assert.equal(g.events.filter(e=>e.type==='versusEnd').length,1);
  g.updateProgress();assert(!g.events.some(e=>e.type==='victory'));assert(!g.openScene('outro'));
 }
});
test('CPU can defeat the player and rematch resets resources, match and arena',()=>{
 const g=new VersusEngine();g.startVersus('freeza','goku','namek');g.versus.score.cpu=1;g.hitPlayer(10000,g.boss.x);
 assert.equal(g.versus.winner,'cpu');assert(!g.events.some(e=>e.type==='gameover'));for(let i=0;i<101;i++)g.step(1/60);assert.equal(g.mode,'dead');assert(g.events.some(e=>e.type==='versusEnd'));
 g.startVersus('freeza','goku','namek');assert.equal(g.p.hp,300);assert.equal(g.p.ki,60);assert.equal(g.versus.winner,null);assert.equal(g.mode,'playing');assert.equal(g.story.saga,'freeza');
});
test('all player specials deal damage and all character poses stay inside their atlas',()=>{
 for(const f of VERSUS_FIGHTERS){
  const g=new VersusEngine();g.startVersus(f.id,'goku');g.boss.x=g.p.x+100;g.fireBeam();
  for(let i=0;i<12;i++)g.updateShots(1/60);assert(g.boss.hp<300,f.id);
  for(const state of ['idle','run','guard','charge','special','blast','attack','dash','hurt','feint']){
   const frame=versusPose(f,{...g.p,state,stun:state==='hurt'?.2:0,vx:state==='run'?100:0});
   assert(frame>=0&&frame<(f.frames||(f.full?30:6)),`${f.id} / ${state}`);
  }
 }
});
test('each CPU stays active in a direct duel without story gates or scene interruptions',()=>{
 for(const f of VERSUS_FIGHTERS){
  const g=new VersusEngine();g.startVersus('goku',f.id);g.p.hp=100000;
  for(let i=0;i<360;i++)g.step(1/60,{});
  assert.equal(g.mode,'playing',f.id);assert.equal(g.dialogue,null);assert(g.damageTaken>0,`${f.id} never attacked`);
  assert(g.p.x>=532&&g.p.x<=1368);assert(g.boss.x>=542&&g.boss.x<=1358);
 }
});
test('leaving versus restores campaign and invalid choices do not replace the match',()=>{
 const g=new VersusEngine();g.startVersus('vegeta','vegeta');assert.throws(()=>g.startVersus('missing','goku'));
 assert.equal(g.versus.player.id,'vegeta');g.start(101);assert.equal(g.versus,null);assert.equal(g.enemies.length,10);
 assert.equal(g.story.boss,'raditz');assert(g.orbs.length>0);
});
test('portrait arena keeps both fighters inside a visible compact ring',()=>{
 const g=new VersusEngine();g.startVersus('nappa','raditz');g.fitVersusArena(350);
 assert.equal(g.activeEncounter.right-g.activeEncounter.left,320);
 for(let i=0;i<120;i++)g.step(1/60,{left:true,pressed:{}});
 assert(g.p.x>=g.activeEncounter.left+22);assert(g.boss.x<=g.activeEncounter.right-32);
 assert(Math.abs(g.boss.x-g.p.x)<350);
});
