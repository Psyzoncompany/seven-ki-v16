import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
import {ARRIVAL_ID} from '../dist/arrival-mission.js';
import {worldGuidance} from '../dist/world-guidance.js';
const mission=()=>{const g=new GameEngine();g.start(ARRIVAL_ID,{arrivalCheckpoint:{checkpoint:1}});if(g.dialogue)g.advanceDialogue(true);return g;};

test('solid farmer rocks stop movement from both sides, including fast knockback',()=>{
  for(const direction of [1,-1]){
    const g=mission(),r=g.rocks[0],half=g.p.w*.4,edge=r.x-direction*(r.w+half);
    Object.assign(g.p,{x:edge-direction*12,y:462,vx:direction*2200,vy:0,stun:1,grounded:true});
    g.updatePlayer(.05,{});
    assert.equal(g.p.x,edge);assert.equal(g.p.vx,0);assert(!r.broken);
  }
});
test('player lands on rock tops, can fly above them and crosses destroyed rubble',()=>{
  const g=mission(),r=g.rocks[0];
  Object.assign(g.p,{x:r.x,y:r.y-r.h-5,vx:0,vy:250,grounded:false});g.updatePlayer(.05,{});
  assert.equal(g.p.y,r.y-r.h);assert(g.p.grounded);
  Object.assign(g.p,{x:r.x-r.w-40,y:r.y-r.h-25,vx:1000,vy:0,stun:1,grounded:false});g.updatePlayer(.05,{});
  assert(g.p.x>r.x-r.w-g.p.w*.4);
  r.broken=true;Object.assign(g.p,{x:r.x-r.w-40,y:462,vx:1000,vy:0,stun:1,grounded:true});g.updatePlayer(.05,{});
  assert(g.p.x>r.x-r.w-g.p.w*.4);
});
test('guidance changes to the capsule after rescue and points back to Gohan',()=>{
  const g=mission();assert.equal(worldGuidance(g).x,1790);
  g.arrival.step=2;assert.equal(worldGuidance(g).x,3000);
  g.arrival.step=3;g.p.x=3000;assert(worldGuidance(g).x<g.p.x);
  g.pause();assert.equal(worldGuidance(g),null);
});
test('chapter guidance hides during combat and leads to missing spheres then the exit',()=>{
  const g=new GameEngine();g.start(101);g.advanceDialogue(true);
  g.activeEncounter=g.encounters[0];assert.equal(worldGuidance(g),null);
  g.activeEncounter=null;g.bossDefeated=true;g.p.x=3000;
  assert(g.orbs.some(o=>!o.got&&o.x===worldGuidance(g).x));
  for(const orb of g.orbs)orb.got=true;assert(worldGuidance(g).x>6060);
});
