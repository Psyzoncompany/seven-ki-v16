import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
import {VersusEngine} from '../dist/versus.js';
import {ARRIVAL_ID,ARRIVAL_OBJECTIVES,cleanArrival,arrivalCanInteract} from '../dist/arrival-mission.js';
const start=(checkpoint={})=>{const g=new VersusEngine();g.start(ARRIVAL_ID,{arrivalCheckpoint:checkpoint});if(g.dialogue)g.advanceDialogue(true);g.events=[];return g;};
function scan(g){const t=ARRIVAL_OBJECTIVES[g.arrival.step];Object.assign(g.p,{x:t.x,y:t.y,vx:0,vy:0,grounded:true});g.step(1/60,{pressed:{}});}
function fight(g){
 const arena=g.encounters.find(a=>a.missionStep===g.arrival.step);g.p.x=arena.trigger;g.step(1/60,{});
 for(const id of arena.ids){const enemy=g.enemies[id];
  for(let i=0;i<900&&enemy.hp>0&&g.mode==='playing';i++){
   if(i%30===0){g.p.x=enemy.x-55;g.p.y=enemy.y;g.p.vx=0;g.p.vy=0;}
   g.step(1/60,{attack:true,pressed:i%18===0?{attack:true}:{}});
  }
  assert(enemy.hp<=0,'creature defeated with real attack input');
 }
 g.step(1/60,{});while(g.freeze>0)g.step(1/60,{});g.step(1/60,{});assert(!g.activeEncounter);
}
function clearRubble(g){
 for(const r of g.rocks){Object.assign(g.p,{x:r.x-65,y:462,vx:0,vy:0,dir:1,attack:null,queued:null,grounded:true,recovery:0});
  for(let i=0;i<180&&!r.broken;i++)g.step(1/60,{attack:true,pressed:i===0?{attack:true}:{}});
  assert(r.broken,'each rubble must break with real melee hitboxes');
 }
}
test('arrival begins as an independent exploration mission with no boss or sphere requirement',()=>{
 const g=start();assert.equal(g.stageId,ARRIVAL_ID);assert.equal(g.enemies.length,3);assert(g.enemies.every(e=>e.creature));assert.equal(g.orbs.length,0);assert.equal(g.arrival.step,0);assert.equal(g.saiyanCombat,true);
 g.p.x=6200;g.step(1/60,{});assert.equal(g.mode,'playing');assert(g.p.x<3460);assert(!arrivalCanInteract(g));
});
test('all four objectives complete through real input; skipping ending grants victory once',()=>{
 const g=start();scan(g);assert.equal(g.arrival.step,1);g.advanceDialogue(true);
 scan(g);assert.equal(g.arrival.step,1);assert.equal(g.mode,'playing');
 fight(g);clearRubble(g);assert.equal(g.arrival.step,2);g.advanceDialogue(true);
 fight(g);scan(g);assert.equal(g.arrival.step,3);g.advanceDialogue(true);
 assert.equal(g.events.filter(e=>e.type==='arrivalCheckpoint').length,3);
 Object.assign(g.p,{x:350,y:462,vx:0,vy:0});g.step(1/60,{});assert.equal(g.dialogue.key,'abduction');assert.equal(g.mode,'dialogue');
 g.advanceDialogue(true);g.advanceDialogue(true);g.step(1/60,{});
 assert.equal(g.mode,'won');assert(g.finished);assert.equal(g.events.filter(e=>e.type==='victory').length,1);
});
test('the ending auto-plays, freezes gameplay and has the same final state',()=>{
 const g=start({checkpoint:3,time:80});g.p.x=350;g.step(1/60,{});const hp=g.p.hp;
 for(let i=0;i<1500&&g.mode!=='won';i++)g.step(1/60,{attack:true,right:true});
 assert.equal(g.mode,'won');assert.equal(g.p.hp,hp);assert.equal(g.p.x,280);assert.equal(g.events.filter(e=>e.type==='victory').length,1);
});
test('checkpoint reconstructs objective state and a completed replay starts at the beginning',()=>{
 for(let checkpoint=1;checkpoint<=3;checkpoint++){
  const g=start({checkpoint,time:45});assert.equal(g.arrival.step,checkpoint);assert.equal(g.time,45);assert.equal(g.p.x,ARRIVAL_OBJECTIVES[checkpoint].checkpoint[0]);assert.equal(g.rocks.every(r=>r.broken),checkpoint>=2);
 }
 const replay=start({checkpoint:3,completed:true,time:80});assert.equal(replay.arrival.step,0);assert.equal(replay.time,0);
 assert.equal(cleanArrival({checkpoint:900,time:NaN}).checkpoint,3);assert.equal(cleanArrival(null).time,0);
});
test('landmarks advance immediately without holding a key or stopping movement',()=>{
 const g=start();for(let i=0;i<30;i++)g.step(1/60,{right:true});assert.equal(g.arrival.step,0);
 Object.assign(g.p,{x:880,y:462,vx:266,vy:0,grounded:true});g.step(1/60,{right:true});
 assert.equal(g.arrival.step,1);assert.equal(g.mode,'playing');assert(g.p.vx>250);assert(g.arrival.radio.length>0);assert.equal(g.dialogue,null);
});
test('KI blasts break mission rubble and legacy chapters stay independent',()=>{
 const g=start({checkpoint:1}),r=g.rocks[0];
 for(let i=0;i<2;i++){g.shots.push({x:r.x-4,y:420,vx:0,vy:0,r:9,trail:[],owner:'player',damage:12,life:1});g.step(1/60,{});while(g.freeze>0)g.step(1/60,{});}
 assert(r.broken);g.start(101);assert.equal(g.arrival,null);assert.equal(g.enemies.length,10);
});
test('creatures telegraph before damage, permit blocking and do not teleport or fire KI',()=>{
 const g=start({checkpoint:1}),e=g.enemies[0];g.p.x=e.x-90;g.p.dir=1;g.updateEncounters();e.cooldown=0;
 const hp=g.p.hp;g.updateEnemy(e,1/60);assert.equal(e.state,'windup');assert(e.timer>=.35);assert.equal(g.p.hp,hp);
 for(let i=0;i<120;i++){g.updatePlayer(1/60,{guard:true});g.updateEnemy(e,1/60);}
 assert(g.p.hp>=hp-5);assert.equal(g.shots.length,0);assert(!g.events.some(e=>e.type==='enemyVanish'));
});
test('mini fights are optional and players can cross their boundaries at full speed',()=>{
 const g=start({checkpoint:2});assert.equal(g.enemies[0].hp,0);
 Object.assign(g.p,{x:2400,y:240,vx:266,vy:0,flying:true,grounded:false});g.step(1/60,{right:true});
 assert(g.encounters[1].active);assert.equal(g.activeEncounter,null);
 Object.assign(g.p,{x:2860,y:462,vx:266,vy:0,flying:false,grounded:true});g.step(1/60,{right:true});assert(g.p.x>2860);
 g.p.x=3000;g.step(1/60,{});assert.equal(g.arrival.step,3);assert.equal(g.mode,'playing');assert(g.enemies[1].hp>0);
});
test('exactly two rocks surround the farmer, crack once and free him automatically',()=>{
 const g=start({checkpoint:1});assert.equal(g.rocks.length,2);assert(g.rocks[0].x<1790&&g.rocks[1].x>1790);
 const r=g.rocks[0];g.shots.push({x:r.x,y:420,vx:0,vy:0,r:9,trail:[],owner:'player',damage:12,life:1});g.step(1/60,{});
 assert.equal(r.hp,1);assert(!r.broken);assert.equal(g.arrival.step,1);while(g.freeze>0)g.step(1/60,{});
 clearRubble(g);assert.equal(g.arrival.step,2);assert.equal(g.mode,'playing');assert(g.arrival.farmerTime>0);assert(g.enemies[0].hp>0);
});
test('optional encounter rewards are granted only once',()=>{
 const g=start({checkpoint:1});g.p.hp=40;g.enemies[0].hp=0;g.updateEncounters();assert.equal(g.p.hp,60);g.updateEncounters();assert.equal(g.p.hp,60);
});
