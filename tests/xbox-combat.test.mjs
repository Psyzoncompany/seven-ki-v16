import test from 'node:test';
import assert from 'node:assert/strict';
import {XboxInput,decodePad} from '../dist/gamepad.js';
import {GameEngine,MOVES,WORLD} from '../dist/engine.js';

const makePad=()=>({index:0,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
function harness(){
 const pad=makePad();let devices=[pad];const reader=new XboxInput(()=>devices);reader.poll();
 return {pad,reader,setDevices:v=>devices=v,button:(i,on=true)=>{pad.buttons[i]={pressed:on,value:on?1:0};}};
}
test('Xbox face buttons, triggers, stick dead zone and d-pad map to gameplay',()=>{
 const pad=makePad();pad.axes=[.18,-.15];assert(!decodePad(pad).right);assert(!decodePad(pad).up);
 pad.axes=[-.7,.8];assert(decodePad(pad).left);assert(decodePad(pad).down);
 for(const [index,action] of [[0,'dash'],[1,'guard'],[2,'attack'],[3,'blast'],[4,'lockOn'],[5,'jump'],[6,'charge'],[7,'descend'],[8,'zoom'],[9,'pause'],[11,'transform'],[14,'left'],[15,'right']]){
  const p=makePad();p.buttons[index]={pressed:false,value:.8};assert(decodePad(p)[action],action);
 }
});
test('held inputs do not repeat edges; jump release is delivered once',()=>{
 const h=harness();h.button(5);assert(h.reader.poll().input.pressed.jump);assert(!h.reader.poll().input.pressed.jump);
 h.button(5,false);assert(h.reader.poll().input.pressed.jumpRelease);assert(!h.reader.poll().input.pressed.jumpRelease);
 h.button(2);h.reader.suppress();assert.deepEqual(h.reader.poll().input,{pressed:{}});h.button(2,false);h.reader.poll();h.button(2);assert(h.reader.poll().input.pressed.attack);
});
test('disconnect clears held movement and reconnect requires releasing buttons',()=>{
 const h=harness();h.pad.axes[0]=1;assert(h.reader.poll().input.right);h.setDevices([null]);const gone=h.reader.poll();assert(gone.disconnected);assert.deepEqual(gone.input,{pressed:{}});
 h.setDevices([h.pad]);assert(h.reader.poll().changed);assert(!h.reader.poll().input.right);h.pad.axes[0]=0;h.reader.poll();h.button(5);assert(h.reader.poll().input.pressed.jump);
 h.setDevices([{...makePad(),mapping:''}]);assert(h.reader.poll().disconnected);assert(h.reader.poll().unsupported);
 const blocked=new XboxInput(()=>{throw Error('policy');});assert(blocked.poll().error);
});
test('Xbox up + X, A and held X finish an aerial combo while the opponent breaker is on cooldown',()=>{
 for(const stage of [1,2]){
  const h=harness(),g=new GameEngine();g.start(stage);g.p.x=640;g.p.ki=100;g.enemies=g.enemies.slice(0,1);
  const enemy=g.enemies[0];enemy.hp=enemy.maxHp=1000;enemy.cooldown=999;enemy.defenseCooldown=999;g.combatAI.ensure(enemy).breakerCooldown=999;
  let pursued=false,finished=false;
  for(let i=0;i<180;i++){
   h.pad.axes[1]=i===0?-1:0;h.button(2,i===0||i>15);h.button(0,false);
   if(!pursued&&g.p.chainWindow>0){h.button(0);pursued=true;}
   g.step(1/60,h.reader.poll().input);
   assert(Number.isFinite(g.p.x)&&Number.isFinite(g.p.y));
   if(g.events.some(e=>e.type==='aerialFinish')){finished=true;break;}
  }
  assert(pursued);assert(finished,`stage ${stage}`);assert.equal(g.airHits,4);assert(!g.p.grounded);assert(enemy.slam);assert(enemy.hp<1000);
 }
});
test('pursuit costs 15 KI before contact, respects arena walls and cooldown',()=>{
 const g=new GameEngine();g.start();g.p.x=570;g.updateEncounters();const e=g.enemies[0];e.x=540;g.p.dir=1;g.p.ki=60;
 assert(g.vanishStrike());assert.equal(g.p.ki,45);assert(g.p.x>=g.activeEncounter.left+22);assert(g.p.attack);assert(!g.vanishStrike());assert.equal(g.p.ki,45);
 g.p.vanishCooldown=0;g.p.ki=14;assert(!g.vanishStrike());assert.equal(g.p.ki,14);
});
test('hit-stop stores a special press and special cleanly cancels a combo',()=>{
 const g=new GameEngine();g.start();g.freeze=.02;g.p.ki=80;g.beginAttack();g.p.queued={kind:'normal'};
 g.step(1/60,{pressed:{special:true}});assert(g.inputBuffer.special);
 for(let i=0;i<4;i++)g.step(1/60,{});
 assert.equal(g.p.state,'special');assert.equal(g.p.attack,null);assert.equal(g.p.queued,null);assert.equal(g.specials,1);assert.equal(g.p.ki,40);
 for(let i=0;i<60;i++)g.step(1/60,{});assert(g.events.some(e=>e.type==='beam'));
});
test('connected hits permit early combo cancel; a whiff keeps its recovery',()=>{
 for(const connected of [true,false]){
  const g=new GameEngine();g.start();g.enemies=[];g.beginAttack();const attack=g.p.attack;
  attack.t=MOVES[0].end+.025;attack.connected=connected;
  g.updatePlayer(1/60,{pressed:{attack:true}});
  assert.equal(g.p.attack===attack,!connected);
 }
});
test('short and long combos remain damaging without unbounded damage scaling',()=>{
 const g=new GameEngine();g.start();const e=g.enemies[0];e.hp=10000;g.combo=100;
 g.hitEnemy(e,100,0,1);assert.equal(e.hp,9945);g.combo=0;g.hitEnemy(e,100,0,1);assert.equal(e.hp,9845);
});
test('LT chords select special, ultimate and rush without leaking a ki blast',()=>{
 const p=makePad();for(const i of [6,3])p.buttons[i]={pressed:true,value:1};
 assert(decodePad(p).special);assert(!decodePad(p).ultimate);assert(!decodePad(p).blast);
 p.axes[1]=1;assert(decodePad(p).ultimate);
 p.buttons[3]={pressed:false,value:0};p.buttons[0]={pressed:true,value:1};assert(decodePad(p).dragonDash);
});
test('air charge holds altitude and LT plus X exits charge into melee',()=>{
 const g=new GameEngine();g.start();g.enemies=[];Object.assign(g.p,{x:300,y:200,grounded:false,ki:20,vy:0});
 for(let i=0;i<60;i++)g.updatePlayer(1/60,{charge:true,flightMode:true,pressed:{}});
 assert.equal(g.p.y,200);assert(g.p.ki>=40&&g.p.ki<43);assert.equal(g.p.state,'charge');
 g.updatePlayer(1/60,{charge:true,attack:true,flightMode:true,pressed:{attack:true}});assert(g.p.attack);assert(!g.p.charging);
});
test('analog flight takes off, hovers and descends; rush spends ki and cancels into attack',()=>{
 const g=new GameEngine();g.start();g.enemies=[];g.p.x=300;
 g.updatePlayer(1/60,{flightMode:true,up:true,pressed:{}});assert(!g.p.grounded);assert(g.p.vy<0);
 Object.assign(g.p,{y:200,vy:0});for(let i=0;i<60;i++)g.updatePlayer(1/60,{flightMode:true,pressed:{}});assert.equal(g.p.y,200);
 g.updatePlayer(1/60,{flightMode:true,down:true,pressed:{}});assert(g.p.vy>0);
 const h=new GameEngine();h.start();h.p.x=300;h.p.ki=60;
 h.updatePlayer(1/60,{flightMode:true,charge:true,dragonDash:true,pressed:{}});assert(h.p.dragonRush);assert(h.p.ki<60);
 h.updatePlayer(1/60,{flightMode:true,attack:true,pressed:{attack:true}});assert(h.p.attack);assert(!h.p.dragonRush);
});
