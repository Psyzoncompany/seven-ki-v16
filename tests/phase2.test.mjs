import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine,WORLD} from '../dist/engine.js';
import {cleanProgress,isUnlocked,stageRecord,recordVictory} from '../dist/campaign.js';

test('stage 2 has unique arenas, platforms, Saiyans and exactly seven sphere sources',()=>{
 const g=new GameEngine();g.start(1);const first=g.platforms;assert.equal(g.enemies.length,10);
 g.start(2);assert.notEqual(g.platforms,first);assert.equal(g.enemies.length,12);assert(g.enemies.every(e=>e.saiyan));assert.equal(g.boss.name,'RAZEK');
 const ids=[...g.orbs.map(o=>o.id),...g.enemies.filter(e=>e.orb).map(e=>e.orb)].sort();assert.deepEqual(ids,[1,2,3,4,5,6,7]);
 assert.deepEqual(g.encounters.flatMap(a=>a.ids),g.enemies.map(e=>e.id));
 for(const a of g.encounters)for(const id of a.ids){const e=g.enemies[id];assert(e.x>a.left&&e.x<a.right);}
 g.start(1);assert(!g.enemies.some(e=>e.saiyan));assert.equal(g.enemies.length,10);
});
test('old progress unlocks stage 2 and completion records remain separate',()=>{
 let stored;globalThis.localStorage={setItem:(k,v)=>stored=v};
 let p=cleanProgress({completed:true,bestTime:240,bestCombo:30});assert(isUnlocked(p,2));assert.equal(stageRecord(p,1).bestTime,240);assert(!stageRecord(p,2).completed);
 p=recordVictory(p,300,24,2).progress;assert(stageRecord(p,2).completed);assert.equal(stageRecord(p,1).bestTime,240);assert.equal(stageRecord(p,2).bestTime,300);assert(stored);
 p=recordVictory(p,340,41,2).progress;assert.equal(stageRecord(p,2).bestTime,300);assert.equal(p.bestCombo,41);
 assert(!isUnlocked(cleanProgress({}),2));assert(!recordVictory(cleanProgress({}),50,5,2).saved);
});
test('Saiyan rush travels over time, hits once, then exposes recovery',()=>{
 const g=new GameEngine();g.start(2);const e=g.enemies[0];for(const a of g.encounters)a.active=true;
 g.p.x=e.x+100;g.p.y=WORLD.ground;e.state='windup';e.timer=.001;e.attackKind='rush';e.dir=1;
 const x=e.x;g.updateEnemy(e,1/60);assert.equal(e.x,x);assert.equal(e.state,'attack');
 for(let i=0;i<30;i++)g.updateEnemy(e,1/60);
 assert(e.x>x+80);assert.equal(g.p.hp,WORLD.maxHealth-18);assert.equal(e.state,'recover');
});
test('Razek shoots a three-projectile fan, five in second phase',()=>{
 const g=new GameEngine();g.start(2);const e=g.boss;g.encounters.at(-1).active=true;
 for(const [phase,count] of [[1,3],[2,5]]){g.shots=[];e.phase=phase;e.state='windup';e.timer=.001;e.attackKind='volley';e.aimX=e.x-300;e.aimY=e.y-40;e.dir=-1;g.updateEnemy(e,1/60);assert.equal(g.shots.length,count);assert(g.shots.every(s=>Number.isFinite(s.vx)&&s.vx<0));}
});
test('all forest encounters can clear, spheres can collect and exit can win',()=>{
 const g=new GameEngine();g.start(2);
 for(const arena of g.encounters){g.p.x=arena.trigger+5;g.updateEncounters();assert.equal(g.activeEncounter,arena);
  for(const id of arena.ids)g.hitEnemy(g.enemies[id],9999,0,1,{beam:true});
  g.updateEncounters();assert(arena.cleared);assert.equal(g.activeEncounter,null);
 }
 assert.equal(g.orbs.length,7);for(const o of g.orbs){g.p.x=o.x;g.p.y=o.y+38;g.updateOrbs(1/60);}
 assert.equal(g.collected,7);g.p.x=6100;g.updateProgress();assert.equal(g.mode,'won');assert(g.bossDefeated);
});
