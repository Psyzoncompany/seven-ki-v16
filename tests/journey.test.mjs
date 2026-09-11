import test from 'node:test';
import assert from 'node:assert/strict';
import {JourneyEngine,cleanJourney,readJourney,saveJourney,finishJourney} from '../dist/journey.js';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const start=(segment=1101,checkpoint=0)=>{const g=new JourneyEngine();g.start(1101,{journey:{segment,checkpoint,time:25}});g.advanceDialogue(true);g.events=[];return g;};
test('one public mission chains all three segments and awards victory only at the end',()=>{
 const g=start();assert.equal(g.stageId,1101);
 for(const next of [1102,1103]){const time=g.time;g.mode='won';g.emit('victory');assert.equal(g.mode,'transition');assert(!g.events.some(e=>e.type==='victory'));g.step(1/60,{});assert.equal(g.stageId,next);assert.equal(g.time,time);g.advanceDialogue(true);assert.equal(g.mode,'playing');assert(!g.finished);}
 g.mode='won';g.emit('victory');assert.equal(g.events.filter(e=>e.type==='victory').length,1);
});
test('actual closing scenes transition automatically, including skipped scenes',()=>{
 for(const skip of [false,true]){const g=start(1101,3);g.p.x=350;g.step(1/60,{});assert.equal(g.mode,'dialogue');
  if(skip)g.advanceDialogue(true);else for(let i=0;i<1500&&g.stageId===1101;i++)g.step(1/60,{});
  g.step(1/60,{});assert.equal(g.stageId,1102);assert.equal(g.p.character,'piccolo');assert(!g.events.some(e=>e.type==='victory'));
 }
});
test('Piccolo transition is consumed once and gameplay keeps advancing',()=>{
 const g=start(1101,3);g.p.x=350;g.step(1/60,{});g.advanceDialogue(true);g.step(1/60,{});
 assert.equal(g.stageId,1102);assert.equal(g.nextSegment,null);g.advanceDialogue(true);
 const x=g.p.x,time=g.time;g.events=[];
 for(let i=0;i<90;i++)g.step(1/60,{right:true,pressed:{}});
 assert.equal(g.mode,'playing');assert(g.time>time+1);assert(g.p.x>x+100);
 assert(!g.events.some(e=>e.type==='characterChanged'||e.type==='journeyCheckpoint'));
});
test('journey checkpoints restore the correct region, actor and rescue state after death',()=>{
 for(const [segment,index,actor] of [[1101,1,undefined],[1102,1,'piccolo'],[1102,2,'piccolo'],[1103,2,'gohan'],[1103,3,'goku']]){
  const g=start(segment,index);g.p.hp=1;g.p.invincible=0;g.hitPlayer(500,g.p.x+70);assert.equal(g.mode,'dead');
  g.start(1101,{journey:{segment,checkpoint:index,time:91}});assert.equal(g.stageId,segment);assert.equal(g.p.character,actor);assert.equal(g.time,91);assert(g.p.hp>0);assert.equal((g.arrival||g.episode).step,index);
  if(segment===1102)assert.equal(g.enemies.find(e=>e.id===3).hp===0,index>1);
 }
});
test('only farmer rocks remain and later segments cannot start as separate public missions',()=>{
 const g=start();assert.equal(g.rocks.length,2);for(const id of [1102,1103,101,201,1201])assert.equal(g.start(id),false);
 for(const id of [1102,1103])assert.equal(start(id).rocks.length,0);
 g.startVersus('freeza','vegeta');assert.equal(g.journey,null);assert.equal(g.versus.player.id,'freeza');
});
test('migration preserves old keys; new checkpoint and completion are independent',()=>{
 storage.clear();storage.set('sevenki-arrival-1-1-v1',JSON.stringify({completed:true,bestTime:30}));storage.set('sevenki-episode-one-v1',JSON.stringify({missions:{1102:{completed:true,bestTime:40},1103:{checkpoint:2,time:10}}}));
 const snapshot=[...storage.entries()];const migrated=readJourney();assert.equal(migrated.segment,1103);assert.equal(migrated.checkpoint,2);assert.equal(migrated.time,80);
 saveJourney(migrated);finishJourney(100);finishJourney(120);assert.equal(readJourney().bestTime,100);for(const [k,v] of snapshot)assert.equal(storage.get(k),v);
 const g=new JourneyEngine();g.start(1101);assert.equal(g.stageId,1101);assert.equal(g.arrival.step,0);assert.equal(g.time,0);
 assert.equal(cleanJourney({segment:999,checkpoint:99}).segment,1101);
});
