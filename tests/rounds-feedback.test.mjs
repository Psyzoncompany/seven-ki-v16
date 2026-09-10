import test from 'node:test';import assert from 'node:assert/strict';
import {VersusEngine} from '../dist/versus.js';import {impactFeedback} from '../dist/impact-feedback.js';
const advance=(g,n)=>{for(let i=0;i<n;i++)g.step(1/60);};
test('best of three preserves score, resets resources and ends at 2-1 or 2-0',()=>{
 for(const winners of [['player','cpu','player'],['cpu','cpu']]){
  const g=new VersusEngine();g.startVersus('raditz','vegeta','namek');g.fitVersusArena(390);
  winners.forEach((win,index)=>{g.p.invincible=0;win==='player'?g.hitEnemy(g.boss,9999,0,1,{beam:true}):g.hitPlayer(9999,g.boss.x);
   advance(g,101);assert.equal(g.versus.round,index+1);
   if(index<winners.length-1){assert.equal(g.mode,'playing');assert(!g.events.some(e=>e.type==='versusEnd'));const elapsed=g.versus.finish.elapsed;g.pause();advance(g,120);assert.equal(g.versus.finish.elapsed,elapsed);g.resume();advance(g,91);assert.equal(g.versus.round,index+2);assert.equal(g.p.hp,300);assert.equal(g.p.ki,60);assert.equal(g.boss.hp,300);assert.equal(g.activeEncounter.right-g.activeEncounter.left,320);}
   else{assert.equal(g.versus.score[win],2);assert.equal(g.mode,win==='player'?'won':'dead');assert.equal(g.events.filter(e=>e.type==='versusEnd').length,1);advance(g,300);assert.equal(g.versus.round,winners.length);}
  });
 }
});
test('block, parry, guard break and counter have distinct readable feedback',()=>{
 const kinds=['guard','parry','guardBreak','counterHit'];assert.equal(new Set(kinds.map(k=>impactFeedback[k].frame)).size,4);for(const k of kinds)assert(impactFeedback[k].label.length>0);
});
