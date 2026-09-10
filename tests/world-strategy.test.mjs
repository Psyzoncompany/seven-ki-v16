import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine,WORLD} from '../dist/engine.js';
import {CHAPTERS} from '../dist/saga.js';
import {VersusEngine} from '../dist/versus.js';
import {freezaPose} from '../dist/freeza-animation.js';
test('chapters have distinct encounter sequences, all enemies and airborne entries',()=>{
 const signatures=new Set();
 for(const chapter of CHAPTERS){const g=new GameEngine();g.reset(chapter.id);
  signatures.add(g.encounters.map(a=>a.kind+':'+a.ids.length).join(','));
  assert.deepEqual(g.encounters.flatMap(a=>a.ids),[0,1,2,3,4,5,6,7,8,9]);
  const a=g.encounters.find(a=>a.kind==='pursuit');g.p.x=a.trigger;g.updateEncounters();
  assert.equal(g.activeEncounter,a);for(const id of a.ids){assert(g.enemies[id].y<350);assert(g.enemies[id].combat.flight);}
 }
 assert.equal(signatures.size,CHAPTERS.length);
});
test('thrown opponents break a rock once and strong landings create bounded craters',()=>{
 const g=new GameEngine();g.start(101);const r=g.rocks[0],e=g.enemies[0];
 Object.assign(e,{x:r.x+50,y:WORLD.ground,vx:500,stun:.4});g.breakRocks(e,r.x-70);assert(r.broken);
 g.breakRocks(e,r.x-70);assert.equal(g.events.filter(v=>v.type==='rockBreak').length,1);
 for(let i=0;i<12;i++)g.groundImpact(i*20,WORLD.ground);assert.equal(g.craters.length,8);
 g.time=4;g.updatePlayer(1/60,{});assert.equal(g.craters.length,0);
});
test('KI charge has startup, interruption cost and delayed enemy response',()=>{
 const g=new GameEngine();g.start(101);g.p.ki=20;
 for(let i=0;i<15;i++)g.updatePlayer(1/60,{charge:true});assert.equal(g.p.ki,20);
 for(let i=0;i<20;i++)g.updatePlayer(1/60,{charge:true});assert(g.p.ki>20);
 const e=g.enemies[0];e.x=g.p.x+100;e.combat=null;
 assert.equal(g.combatAI.decide(g,e,1/60),'combo');
 const ki=g.p.ki;g.p.invincible=0;g.hitPlayer(10,g.p.x+100);assert.equal(g.p.ki,ki-8);assert(!g.p.charging);assert(g.p.chargeLock>0);
});
test('Kaioken pays entry cost, wears faster while attacking and cannot charge or restart immediately',()=>{
 const g=new GameEngine();g.start(102,{skills:['kaioken']});g.mode='playing';g.p.ki=80;
 g.updatePlayer(1/60,{pressed:{transform:true}});assert(g.p.form);assert.equal(g.p.ki,65);
 g.p.state='idle';g.p.stateTime=2;g.updatePlayer(.1,{charge:true});assert(!g.p.charging);assert(g.p.formFatigue>0);
 g.updatePlayer(1/60,{pressed:{transform:true}});assert(!g.p.form);assert(g.p.formCooldown>0);
 g.p.ki=100;g.updatePlayer(1/60,{pressed:{transform:true}});assert(!g.p.form);
});
test('Freeza has distinct beam and ball attacks, aerial string and dedicated poses',()=>{
 const g=new VersusEngine();g.startVersus('freeza','freeza');const e=g.boss;
 e.attackKind='galick';e.aimX=g.p.x;e.aimY=g.p.y-40;g.fireStoryBoss(e);assert.equal(g.shots.at(-1).r,6);
 e.attackKind='double';g.fireStoryBoss(e);assert.equal(g.shots.at(-1).r,28);assert(Math.abs(g.shots.at(-1).vx)<300);
 g.queueEnemyCombo(e,true);assert.equal(e.attackKind,'launcher');assert.deepEqual(e.combat.comboQueue,['airStrike','finisher']);
 assert.equal(freezaPose({...e,state:'guard',stun:0}),20);
 assert.equal(freezaPose({...e,state:'windup',attackKind:'double'}),19);
 assert.equal(freezaPose({...e,hp:0}),23);
});
