import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine,WORLD} from '../dist/engine.js';
import {CHAPTERS,SAIYAN_CHAPTERS,FREEZA_CHAPTERS,cleanSaga,sagaUnlocked,finishSaga,buySkill,saveSaga} from '../dist/saga.js';
const start=(id,build={})=>{const g=new GameEngine();g.start(id,build);g.advanceDialogue(true);g.events=[];return g;};
function closeScene(g){if(g.dialogue)g.advanceDialogue(true);}
const stored=new Map();globalThis.localStorage={setItem:(k,v)=>stored.set(k,v)};

test('all saga chapters retain seven unique spheres and final named bosses',()=>{
 for(const chapter of CHAPTERS){
  const g=start(chapter.id);assert.equal(g.boss.name,chapter.bossName);assert.equal(g.enemies.length,10);assert.equal(g.hazards.length,chapter.hazards.length);
  assert.deepEqual([...g.orbs.map(o=>o.id),...g.enemies.filter(e=>e.orb).map(e=>e.orb)].sort(),[1,2,3,4,5,6,7]);
  assert(g.encounters.at(-1).ids.includes(g.boss.id));assert.equal(g.encounters.at(-1).title,chapter.bossName);
 }
});
test('dialogue freezes simulation and resumes without a stale attack',()=>{
 const g=new GameEngine();g.start(101);assert.equal(g.mode,'playing');g.openScene('boss');assert.equal(g.mode,'dialogue');const time=g.time,x=g.p.x,hp=g.p.hp;
 for(let i=0;i<120;i++)g.step(1/60,{right:true,attack:true,pressed:{special:true}});
 assert.equal(g.p.x,x);assert.equal(g.p.hp,hp);assert.equal(g.time,time);assert.equal(g.p.attack,null);
 g.advanceDialogue();assert.equal(g.dialogue.index,1);g.advanceDialogue(true);assert.equal(g.mode,'playing');assert.deepEqual(g.inputBuffer,{});
});
test('all saga chapters clear arenas, collect spheres and finish after their ending scene',()=>{
 let progress=cleanSaga();
 for(const chapter of CHAPTERS){
  assert(sagaUnlocked(progress,chapter.id));const g=start(chapter.id,progress);
  for(const arena of g.encounters){g.p.x=arena.trigger+10;g.updateEncounters();closeScene(g);
   for(const id of arena.ids){const enemy=g.enemies[id];for(let n=0;n<5&&enemy.hp>0;n++){g.hitEnemy(enemy,9999,0,1,{beam:true});if(enemy.hp>0)g.updateEnemy(enemy,1/60);closeScene(g);}assert.equal(enemy.hp,0);}
   g.updateEncounters();assert(arena.cleared);
  }
  for(const o of g.orbs){g.p.x=o.x;g.p.y=o.y+38;g.updateOrbs(1/60);}assert.equal(g.collected,7);
  g.p.x=6100;g.updateProgress();closeScene(g);g.updateProgress();assert.equal(g.dialogue.key,'outro');assert(!g.events.some(e=>e.type==='victory'));
  g.advanceDialogue(true);assert.equal(g.mode,'won');assert(g.events.some(e=>e.type==='victory'));
  progress=finishSaga(progress,chapter.id,210,15,7).progress;
 }
 assert.equal(Object.values(progress.chapters).filter(c=>c.completed).length,7);assert(sagaUnlocked(progress,204));
});
test('Saiyan completion unlocks Namekusei and Freeza bosses have distinct phase scenes',()=>{
 let progress=cleanSaga();for(const chapter of SAIYAN_CHAPTERS)progress=finishSaga(progress,chapter.id,180,12,7).progress;
 assert(sagaUnlocked(progress,FREEZA_CHAPTERS[0].id));
 for(const [id,key] of [[202,'transform'],[204,'transform']]){const g=start(id),e=g.boss;g.hitEnemy(e,99999,0,1,{beam:true});assert(e.hp>0);g.updateStoryBoss(e);assert.equal(g.dialogue.key,key);}
});
test('story progression and skill points do not inherit prototype wins or reward repeated clears',()=>{
 const empty=cleanSaga({completed:true,stages:{1:{completed:true},2:{completed:true}},points:999,skills:['kaioken4']});assert(!sagaUnlocked(empty,102));assert.equal(empty.points,3);assert(!empty.skills.includes('kaioken4'));
 let p=finishSaga(empty,101,200,10,7).progress;assert(sagaUnlocked(p,102));assert(p.skills.includes('kaioken'));assert.equal(p.points,7);
 p=finishSaga(p,101,220,20,7).progress;assert.equal(p.points,7);assert.equal(p.chapters[101].bestTime,200);assert.equal(p.chapters[101].bestCombo,20);
 assert.equal(finishSaga(cleanSaga(),103,100,10,7).saved,false);
});
test('skill purchases enforce prerequisites, charge once and persist selected form',()=>{
 let p=cleanSaga();assert(buySkill(p,'combo').reason);p=buySkill(p,'vigor').progress;assert.equal(p.points,2);assert(buySkill(p,'vigor').reason);
 p=buySkill(p,'combo').progress;p=buySkill(p,'ki').progress;assert.equal(p.points,0);assert(buySkill(p,'kame').reason);
 p=finishSaga(p,101,200,10,7).progress;assert.equal(p.points,4);p=buySkill(p,'genki').progress;assert(p.skills.includes('genki'));assert(buySkill(p,'kaioken3').reason);
 p=finishSaga(p,102,200,10,7).progress;p=buySkill(p,'kaioken3').progress;p=buySkill(p,'kaioken4').progress;
 const equipped=saveSaga({...p,form:4}).progress;assert.equal(equipped.form,4);assert.equal(start(103,equipped).kaiokenLevel,4);assert.equal(start(102,equipped).kaiokenLevel,2);
});
test('Goku learns Kaioken after Raditz; higher multipliers drain life without self-KO',()=>{
 const first=start(101,{skills:['kaioken'],form:2});first.p.ki=100;first.updatePlayer(1/60,{pressed:{transform:true}});assert(!first.p.form);
 const later=start(103,{skills:['vigor','kaioken','kaioken3','kaioken4'],form:4});assert.equal(later.maxHp,290);later.p.ki=100;later.p.hp=2;later.updatePlayer(1/60,{pressed:{transform:true}});assert(later.p.form);assert.equal(later.p.formTime,8);
 for(let i=0;i<90;i++)later.updatePlayer(1/60,{});assert.equal(later.p.hp,1);assert(later.p.form);
});
test('Genki Dama requires training, charges over time and can be interrupted',()=>{
 const g=start(102,{skills:['ki','genki']});g.enemies=[];g.p.ki=100;g.updatePlayer(1/60,{charge:true,pressed:{special:true}});assert.equal(g.p.state,'genki');assert.equal(g.p.ki,20);assert(!g.events.some(e=>e.type==='genki'));
 for(let i=0;i<70;i++)g.updatePlayer(1/60,{});assert(g.events.some(e=>e.type==='genki'));
 const interrupted=start(102,{skills:['genki']});interrupted.p.ki=100;interrupted.p.invincible=0;interrupted.updatePlayer(1/60,{charge:true,pressed:{special:true}});interrupted.hitPlayer(20,interrupted.p.x+50,150);
 for(let i=0;i<90;i++)interrupted.updatePlayer(1/60,{});assert(!interrupted.events.some(e=>e.type==='genki'));
});
test('lava deals bounded damage, jumping clears it and traps warn before activation',()=>{
 const g=start(102);g.p.invincible=0;const lava=g.hazards.find(h=>h.type==='lava');g.p.x=lava.x+20;g.p.y=WORLD.ground;g.updateHazards(1/60);assert.equal(g.p.hp,g.maxHp-22);assert(g.p.x<lava.x);
 const hp=g.p.hp;g.p.x=lava.x+20;g.p.y=WORLD.ground-100;g.hazardCooldown=0;g.p.invincible=0;g.updateHazards(1/60);assert.equal(g.p.hp,hp);
 const trap={type:'spikes',period:3.4,offset:0};g.time=.2;assert.equal(g.hazardState(trap),'warning');g.time=1;assert.equal(g.hazardState(trap),'active');g.time=2;assert.equal(g.hazardState(trap),'idle');
});
test('Raditz, Nappa and Vegeta have different signature attacks and recovery',()=>{
 for(const [id,kind] of [[101,'double'],[102,'eruption'],[103,'galick']]){
  const g=start(id),e=g.boss;g.encounters.at(-1).active=true;e.attackKind=kind;e.aimX=e.x-200;e.dir=-1;g.p.x=e.x-200;g.p.y=WORLD.ground;g.p.invincible=0;
  g.fireStoryBoss(e);assert.equal(e.state,'recover');assert(e.timer>1);
  if(id===101)assert.equal(g.shots.length,2);
  if(id===102){assert.equal(g.hazards.filter(h=>h.type==='eruption').length,3);assert(g.hazards.filter(h=>h.born!=null).every(h=>g.hazardState(h)==='warning'));}
  if(id===103){assert(g.events.some(e=>e.type==='enemyBeam'));assert.equal(g.p.hp,g.maxHp-42);}
 }
});
test('Vegeta cannot skip Oozaru and Yajirobe scenes even with excessive damage',()=>{
 const g=start(103),e=g.boss;g.hitEnemy(e,99999,0,1,{beam:true});assert(e.hp>0);g.updateStoryBoss(e);assert.equal(e.phase,2);assert.equal(e.spriteRow,3);assert.equal(g.dialogue.key,'ape');g.advanceDialogue(true);
 g.hitEnemy(e,99999,0,1,{beam:true});assert(e.hp>0);g.updateStoryBoss(e);assert.equal(e.phase,3);assert.equal(e.spriteRow,2);assert.equal(g.dialogue.key,'assist');g.advanceDialogue(true);g.hitEnemy(e,99999,0,1,{beam:true});assert.equal(e.hp,0);
});
