import test from 'node:test';
import assert from 'node:assert/strict';
import {ContinuationEngine} from '../dist/continuation-engine.js';
import {CONTINUATION,cleanContinuation,saveContinuation,readContinuation} from '../dist/continuation-data.js';
import {decodeKeyboard} from '../dist/keyboard.js';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
function start(id,index=0){const progress=cleanContinuation();for(const r of Object.values(progress.missions))r.completed=true;progress.missions[id]={completed:false,checkpoint:index};const g=new ContinuationEngine();assert(g.start(id,{raditz:{completed:true},continuation:progress}));g.advanceDialogue(true);g.events=[];return g;}
function tick(g,n,input={}){for(let i=0;i<n*60;i++)g.step(1/60,input);}
test('new missions enforce prerequisites and restore every checkpoint cleanly',()=>{
 const g=new ContinuationEngine();assert.equal(g.start(1301,{raditz:{completed:false}}),false);assert.equal(g.start(1401,{continuation:cleanContinuation()}),false);
 for(const m of CONTINUATION)for(let i=0;i<m.steps.length;i++){const x=start(m.id,i);assert.equal(x.p.character,m.steps[i].actor);assert.equal(x.p.hp,x.maxHp);assert.equal(x.p.attack,null);assert.equal(x.p.stun,0);assert.equal(x.shots.length,0);}
});
test('serpent falls recover locally and combat must finish before the exit',()=>{const g=start(1301);g.p.x=640;tick(g,.05);assert.equal(g.p.x,180);g.p.x=1700;g.updateProgress();assert.equal(g.continuation.step,0);for(const e of g.enemies){e.invincible=0;g.hitEnemy(e,500,0,1);}g.updateProgress();assert.equal(g.continuation.step,1);assert(g.dialogue);});
test('Bubbles requires contact and guard; Gregory only counts hits during his opening',()=>{const g=start(1401,1);tick(g,1,{guard:true});assert.equal(g.continuation.score,0);for(let i=0;i<100&&g.continuation.step===1;i++){g.p.x=900+Math.sin((g.continuation.elapsed+1/60)*.8)*470;g.step(1/60,{guard:true});}assert.equal(g.continuation.step,2);g.advanceDialogue(true);const e=g.boss;assert.equal(g.hitEnemy(e,20,0,1),false);g.continuation.elapsed=2;g.hitEnemy(e,20,0,1);assert.equal(g.continuation.score,1);});
test('Kaioken and Genki training require actual technique hits',()=>{
 const g=start(1401,3);g.p.x=g.boss.x-60;g.hitEnemy(g.boss,80,0,1);assert.equal(g.continuation.score,0);g.boss.invincible=0;g.p.form=true;g.hitEnemy(g.boss,100,0,1);g.updateProgress();assert.equal(g.continuation.step,4);g.advanceDialogue(true);
 g.p.x=170;g.fireGenki();assert.equal(g.continuation.score,0);g.p.x=g.boss.x-100;g.p.state='genki';g.fireGenki();g.updateProgress();assert(g.continuation.ending);
});
test('Nappa objectives preserve the boss and all three defenders are playable',()=>{
 for(const i of [2,3,4,5]){const g=start(1601,i);g.hitEnemy(g.boss,9999,0,1);assert(g.boss.hp>=1);g.updateProgress();if(i===3)assert.equal(g.continuation.step,3);if(i===5)assert.equal(g.continuation.step,5);}
 const g=start(1601,5);g.hitEnemy(g.boss,80,0,1);g.p.x=1320;tick(g,1,{guard:true});assert(g.continuation.ending);assert.equal(g.mode,'dialogue');
});
test('scene pause freezes animation and skipping completion emits only once',()=>{const g=start(1601,5);g.tell([['GOKU','Cheguei.']],true);g.continuation.scenePaused=true;tick(g,2);assert.equal(g.continuation.sceneTime,0);const hp=g.p.hp;tick(g,1,{attack:true});assert.equal(g.p.hp,hp);g.advanceDialogue(true);g.advanceDialogue(true);assert.equal(g.events.filter(e=>e.type==='continuationVictory').length,1);assert.equal(g.mode,'won');});
test('watching the ending reaches the same single victory without input',()=>{const g=start(1601,5);g.tell([['PICCOLO','Gohan!'],['GOKU','Eu cheguei.']],true);tick(g,12);assert.equal(g.mode,'won');assert.equal(g.events.filter(e=>e.type==='continuationVictory').length,1);});
test('the Genki lesson accepts the displayed keyboard charge and special combination',()=>{const g=start(1401,4);g.p.x=g.boss.x-100;const input=decodeKeyboard(new Set(['ControlLeft','ArrowUp']));g.step(1/60,{...input,pressed:{special:true}});tick(g,2);assert(g.continuation.ending);});
test('save completion is independent, idempotent and invalid values are sanitized',()=>{storage.clear();saveContinuation(1301,2,40,true);saveContinuation(1301,1,8);assert(readContinuation().missions[1301].completed);assert.equal(cleanContinuation({missions:{1401:{checkpoint:Infinity,time:NaN}}}).missions[1401].checkpoint,0);assert.equal(storage.size,1);});
test('all combat checkpoints can be completed with movement and attack inputs',()=>{
 for(const [id,index] of [[1301,1],[1401,2],[1401,3],[1401,4],[1601,0],[1601,1],[1601,2],[1601,3],[1601,4],[1601,5]]){
  const g=start(id,index);
  for(let frame=0;frame<60*100&&!g.dialogue&&g.mode==='playing';frame++){
   const s=g.objective,q=g.continuation,e=g.enemies.find(e=>e.hp>0),p=g.p;
   const target=s.kind==='protect'&&q.damage>=60?1320:e.x-55,dx=target-p.x;
   let input={right:dx>10,left:dx< -10,attack:Math.abs(dx)<80,pressed:{}};
   if(s.kind==='protect'&&q.damage>=60)input={right:dx>15,left:dx< -15,guard:Math.abs(dx)<75};
   if(s.kind==='kaioken'&&!p.form){input.charge=p.ki<60;if(p.ki>=60)input.pressed.transform=true;}
   if(s.kind==='genki'){input.attack=false;if(Math.abs(dx)<400){input.charge=true;if(p.ki>=80)input.pressed.special=true;}}
   g.step(1/60,input);
  }
  assert.notEqual(g.mode,'dead',`${id}/${index}: player must survive`);
  assert(g.dialogue,`${id}/${index}: goal must be reachable with existing controls (damage ${g.continuation.damage}, score ${g.continuation.score})`);
 }
});
