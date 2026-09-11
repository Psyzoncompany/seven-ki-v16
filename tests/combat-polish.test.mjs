import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
const start=()=>{const g=new GameEngine();g.start(101);g.advanceDialogue(true);return g;};
test('a failed enemy reaction cannot reroll on subsequent frames of the same swing',()=>{
 const g=start(),e=g.enemies[0];g.p.x=e.x-55;g.beginAttack();e.state='attack';e.stun=0;e.invincible=0;
 let rolls=0;g.random=()=>{rolls++;return 1;};
 for(let i=0;i<12;i++)assert.equal(g.combatAI.reactiveCancel(g,e),null);
 assert.equal(rolls,1);
 g.beginAttack();g.combatAI.reactiveCancel(g,e);assert.equal(rolls,2);
});
test('a missed swing finishes recovery without executing an old queued combo',()=>{
 const g=start();g.enemies=[];g.beginAttack();g.p.queued={kind:'normal',perfect:false};g.p.attack.t=g.p.attack.move.duration-.005;
 g.updatePlayer(1/60,{pressed:{}});assert.equal(g.p.attack,null);assert.equal(g.p.queued,null);assert(g.p.recovery>0);
});
test('guard break clears the attack and starts a fresh hurt animation',()=>{
 const g=start();g.beginAttack();g.p.guarding=true;g.p.guardTime=1;g.p.guardMeter=1;g.p.stateTime=8;
 g.hitPlayer(20,g.p.x+g.p.dir*50);assert.equal(g.p.state,'hurt');assert.equal(g.p.attack,null);assert.equal(g.p.stateTime,0);assert.equal(g.p.stun,.8);
});
