import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
import {hitReaction} from '../dist/hit-reaction.js';
import {decodePad} from '../dist/gamepad.js';
const start=()=>{const g=new GameEngine();g.start(101);g.advanceDialogue(true);g.events=[];return g;};
const ready=(g,step=0)=>{g.enemies=[];g.beginAttack();g.p.attack.step=step;g.p.attack.connected=true;g.p.attack.t=g.p.attack.move.active+.04;};
test('combo branches select close pressure, launch and knock-away without firing KI',()=>{
  for(const [step,input,kind] of [[0,{},'pressure'],[1,{},'spin'],[0,{up:true},'launch']]){
    const g=start();ready(g,step);const ki=g.p.ki;
    g.updatePlayer(1/60,{...input,blast:true,pressed:{blast:true}});
    assert.equal(g.p.attack.kind,kind);assert.equal(g.shots.length,0);
    assert.equal(g.p.ki,ki-(kind==='launch'?14:0)+(g.p.attack.perfect?4:0));
    if(kind==='pressure')assert(g.p.attack.move.knock<30);
    if(kind==='spin')assert(g.p.attack.move.knock>400);
  }
});
test('air directional Y selects hammer and cannot leak a projectile',()=>{
  const g=start();ready(g);Object.assign(g.p,{grounded:false,y:300});
  g.updatePlayer(1/60,{down:true,blast:true,pressed:{blast:true}});
  assert.equal(g.p.attack.kind,'slam');assert(g.p.vy>0);assert.equal(g.shots.length,0);
});
test('B plus A is a short stamina dodge, preserves facing and cannot be spammed',()=>{
  const g=start();g.enemies=[];const p=g.p,x=p.x,ki=p.ki,dir=p.dir;
  const pad={buttons:Array.from({length:16},(_,i)=>({pressed:i===0||i===1})),axes:[0,0]};
  const input=decodePad(pad);g.updatePlayer(1/60,{...input,pressed:{dash:true,guard:true}});
  assert(p.shortDodging);assert.equal(p.ki,ki);assert.equal(p.dir,dir);assert(p.invincible>0);
  assert.equal(g.shortDodge(),false);
  for(let i=0;i<12;i++)g.updatePlayer(1/60,{guard:true,pressed:{}});
  assert(Math.abs(p.x-x)>10&&Math.abs(p.x-x)<60);assert(p.guarding);assert(!p.shortDodging);
});
test('guard interrupts a dash immediately and a timely parry grants one riposte',()=>{
  const g=start(),e=g.enemies[0],p=g.p;e.x=p.x+60;e.y=p.y;
  p.dashTimer=.18;p.state='dash';g.updatePlayer(1/60,{guard:true});
  assert(p.guarding);assert.equal(p.dashTimer,0);
  assert.equal(g.hitPlayer(20,e.x),false);assert(p.riposteWindow>0);
  g.enemies=[];g.updatePlayer(1/60,{guard:true,pressed:{attack:true}});
  assert(p.attack?.perfect);assert.equal(p.riposteWindow,0);assert(!p.guarding);
});
test('late blocks do not grant ripostes and the parry opportunity expires',()=>{
  const g=start();g.enemies=[];g.p.guarding=true;g.p.guardTime=.2;
  g.hitPlayer(20,g.p.x+50);assert(!g.p.riposteWindow);
  g.p.riposteWindow=.1;g.updatePlayer(.11,{});g.beginAttack();assert(!g.p.attack.perfect);
});
test('punches, kicks and heavy hits have distinct contact pauses and body reactions',()=>{
  const pauses=[],leans=[];
  for(const options of [{style:'jab'},{style:'kick'},{finisher:true}]){
    const g=start(),e=g.enemies[0];g.hitEnemy(e,10,40,1,options);
    pauses.push(g.freeze);leans.push(hitReaction(e).lean);
    e.hitReaction.life=0;assert.deepEqual(hitReaction(e),{lean:0,lift:0,squash:0});
  }
  assert(pauses[0]<pauses[1]&&pauses[1]<pauses[2]);assert(leans[0]<leans[1]&&leans[1]<leans[2]);
});
