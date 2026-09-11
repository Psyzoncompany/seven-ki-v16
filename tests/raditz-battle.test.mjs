import test from 'node:test';
import assert from 'node:assert/strict';
import {RaditzCampaignEngine} from '../dist/raditz-battle.js';
import {RADITZ_SCENES,cleanRaditz,finishRaditz,readRaditz,checkpointRaditz} from '../dist/raditz-data.js';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const start=(checkpoint=0)=>{const g=new RaditzCampaignEngine();assert(g.start(1201,{journey:{completed:true},raditz:{checkpoint}}));g.finishBattleScene();g.events=[];return g;};
const tick=(g,seconds,input={})=>{for(let i=0;i<seconds*60;i++)g.step(1/60,input);};
test('battle requires the journey, starts with Goku and preserves the opening campaign',()=>{
 const g=new RaditzCampaignEngine();assert.equal(g.start(1201,{journey:{completed:false}}),false);assert.equal(g.start(1101,{journey:{completed:false}}),true);
 const b=start();assert.equal(b.p.character,'goku');assert.equal(b.boss.storyBoss,'raditz');assert.equal(b.enemies.length,1);assert.equal(b.orbs.length,0);
});
test('all checkpoints rebuild actors, resources and neutral attacks',()=>{
 for(const [i,id] of ['goku','piccolo','gohan','goku'].entries()){const g=start(i);assert.equal(g.battle.step,i);assert.equal(g.p.character,id);assert.equal(g.p.attack,null);assert.equal(g.p.stun,0);assert(g.p.hp>0);assert.equal(g.battle.damage,0);assert.equal(g.shots.length,0);}
});
test('real combat inputs reach all four stages and the final grapple',()=>{
 const g=start();let lastStep=-1;
 for(let i=0;i<60*150&&!g.battle.scene?.key?.includes('finale');i++){
  if(g.battle.scene){g.finishBattleScene();continue;}
  const b=g.battle,p=g.p,e=g.boss,dx=e.x-p.x;
  if(b.step!==lastStep){lastStep=b.step;}
  let input;
  if(b.step===1)input={charge:true};
  else if(b.step===2)input=b.charge<1.2?{charge:true}:{pressed:{attack:true}};
  else if(b.step===3&&b.damage>=150)input={right:dx>65,left:dx< -65,guard:true};
  else input={right:dx>65,left:dx< -65,attack:Math.abs(dx)<120,pressed:i%50===0?{special:true}:{}};
  g.step(1/60,input);
  assert.notEqual(g.mode,'dead','playable sequence must not require health cheats');
 }
 assert.equal(g.battle.scene?.key,'finale');assert.equal(g.p.character,'goku');
});
test('scene pause freezes time, damage and inputs; skip and watching award once',()=>{
 for(const skip of [false,true]){const g=start(3);g.startBattleScene('finale');g.pause();const hp=g.p.hp;tick(g,2,{attack:true});assert.equal(g.battle.scene.time,0);assert.equal(g.hitPlayer(999,g.p.x+50),false);assert.equal(g.p.hp,hp);g.resume();
 if(skip)g.finishBattleScene();else tick(g,RADITZ_SCENES.finale.duration+1);
 g.finishBattleScene();tick(g,2);assert.equal(g.mode,'won');assert.equal(g.p.hp,0);assert.equal(g.boss.hp,0);assert(g.battle.otherWorldReady);assert.equal(g.events.filter(e=>e.type==='raditzVictory').length,1);
 }
});
test('story gates cannot be skipped by excessive damage or an ally',()=>{
 const g=start();g.hitEnemy(g.boss,99999,0,1,{beam:true});assert.equal(g.boss.hp,1);g.updateProgress();assert.equal(g.battle.scene.key,'opening');g.finishBattleScene();assert.equal(g.battle.step,1);tick(g,15,{guard:true});assert.equal(g.battle.step,1);assert.equal(g.battle.charge,0);
});
test('battle save is independent, sanitized and completion stays idempotent',()=>{
 storage.clear();storage.set('sevenki-saga-v1','unchanged');assert.equal(cleanRaditz({checkpoint:99,time:-2}).checkpoint,3);checkpointRaditz(2,45);assert.equal(readRaditz().checkpoint,2);finishRaditz(90);finishRaditz(110);assert.equal(readRaditz().bestTime,90);assert(readRaditz().otherWorldReady);assert.equal(storage.get('sevenki-saga-v1'),'unchanged');
});
