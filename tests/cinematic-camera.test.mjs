import test from 'node:test';import assert from 'node:assert/strict';
import {DuelCamera} from '../dist/duel-camera.js';import {VersusEngine} from '../dist/versus.js';import {HeroAnimator,heroMotionFrame,normalizeHeroAtlas} from '../dist/hero-animation.js';
test('KO is slow motion, ignores damage/input, pauses, and emits one delayed result',()=>{
 for(const win of [true,false]){const g=new VersusEngine();g.startVersus();g.versus.score[win?'player':'cpu']=1;win?g.hitEnemy(g.boss,9999,350,1,{beam:true}):g.hitPlayer(9999,g.boss.x);
  assert.equal(g.mode,'playing');assert(!g.events.some(e=>e.type==='versusEnd'));const before=g.visualTime,hp=g.p.hp;
  for(let i=0;i<30;i++)g.step(1/60,{pressed:{special:true,attack:true}});assert(Math.abs(g.visualTime-before-.08)<.001);assert.equal(g.p.hp,hp);
  const elapsed=g.versus.finish.elapsed;g.pause();g.step(.5);assert.equal(g.versus.finish.elapsed,elapsed);g.resume();
  for(let i=0;i<120;i++)g.step(1/60);assert.equal(g.events.filter(e=>e.type==='versusEnd').length,1);assert.equal(g.mode,win?'won':'dead');
 }
});
test('camera zooms close and fits both silhouettes during sudden aerial pursuit',()=>{
 for(const width of [350,960,1500]){const camera=new DuelCamera(),actors=[{x:600,y:462,height:135},{x:710,y:462,height:180}],options={width,height:540,top:75,bottom:135};
  const close=camera.update(1/60,actors,options).zoom;
  actors[1].x=1300;actors[1].y=174;const c=camera.update(1/60,actors,options);assert(c.zoom<close);
  for(const x of [c.bounds.left,c.bounds.right])assert((x-c.left)*c.zoom>=19.99&&(x-c.left)*c.zoom<=width-19.99);
  assert((c.bounds.top-c.top)*c.zoom>=74.99);assert((c.bounds.bottom-c.top)*c.zoom<=405.01);
 }
});
test('hero transitions distinguish flight, hover, braking, charge, guard and hurt',()=>{
 const a=new HeroAnimator(),p={hp:100,grounded:false,vx:300,vy:0,dir:1,state:'flight',anim:0};assert.equal(a.sample(p,.016).frame,26);
 p.vx=0;assert.equal(a.sample(p,.016).frame,22);for(let i=0;i<12;i++)a.sample(p,1/60);assert.equal(a.sample(p,.016).frame,19);
 p.grounded=true;p.state='idle';assert.equal(a.sample(p,.016).frame,24);
 p.state='charge';assert.equal(a.sample(p,.016).frame,27);p.state='guard';assert.equal(a.sample(p,.016).frame,24);p.stun=.2;assert.equal(a.sample(p,.016).frame,25);
 assert.equal(heroMotionFrame({hp:100,attack:{t:.2,move:{effect:'kick',active:.1,end:.25,frames:[6,7,8]}}}),10);
});
test('Goku and Kaioken use matching physical pose heights and hip anchors',()=>{
 const atlas=h=>normalizeHeroAtlas({frames:Array.from({length:30},()=>({rect:[0,0,100,h],anchor:.5}))});const a=atlas(180),b=atlas(165);
 for(let i=0;i<30;i++){assert(Math.abs(a.frames[i].rect[3]*a.frames[i].scale-b.frames[i].rect[3]*b.frames[i].scale)<.001);assert.equal(a.frames[i].anchor,b.frames[i].anchor);}
});
test('Vegeta punishes recovery and Raditz withdraws after a short successful string',()=>{
 const g=new VersusEngine();g.startVersus('goku','vegeta');g.boss.x=g.p.x+95;g.boss.state='run';g.beginAttack();g.p.attack.t=g.p.attack.move.end+.02;
 assert.equal(g.combatAI.decide(g,g.boss,1/60),'counter');
 g.startVersus('goku','raditz');const e=g.boss;e.x=g.p.x+85;e.state='attack';e.timer=.001;e.attackDid=true;e.combat.comboQueue=[];g.updateEnemy(e,1/60);assert.equal(e.state,'retreat');assert(e.vx>0);
});
