import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
import {SAIYAN_CHAIN,SAIYAN_MOVES,SAIYAN_BOSS_SCENES,comboSpriteFrame} from '../dist/saiyan-combat.js';

const start=(id=101)=>{const g=new GameEngine();g.start(id);g.advanceDialogue(true);g.events=[];return g;};
test('Saiyan gameplay has no intro or mid narration; only boss exchanges pause play',()=>{
 for(const id of [101,102,103]){
  const g=start(id);assert.equal(g.mode,'playing');assert.equal(g.dialogue,null);
  assert.equal(g.openScene('mid'),false);assert(g.seenScenes.has('mid'));
  for(const lines of Object.values(SAIYAN_BOSS_SCENES[id]))assert(lines.every(l=>l.speaker==='GOKU'||l.speaker===g.story.bossName));
  assert(g.openScene('boss'));assert.equal(g.dialogue.lines.length,2);g.advanceDialogue(true);assert.equal(g.mode,'playing');
 }
});
test('five ground moves have their own frame timing and wrap without replacing Namek moves',()=>{
 const g=start();g.enemies=[];const ids=[];
 for(let i=0;i<6;i++){g.beginAttack();ids.push(g.p.attack.move.id);g.time+=.25;}
 assert.deepEqual(ids,['jab','cross','kick','rush','spin','jab']);
 const old=start(201);old.beginAttack();assert.equal(old.p.attack.move.id,undefined);assert.equal(old.p.attack.move.spriteFrames,undefined);
});
test('Y branches the second connected attack to spin; LT + Y remains a special',()=>{
 const g=start();g.enemies=[];g.beginAttack();g.time+=.1;g.beginAttack();
 g.p.attack.connected=true;g.p.attack.t=g.p.attack.move.active+.04;
 g.updatePlayer(1/60,{blast:true,pressed:{blast:true}});assert.equal(g.p.attack.kind,'spin');assert.equal(g.shots.length,0);
 g.p.attack.connected=true;g.p.attack.t=g.p.attack.move.active+.04;g.p.ki=100;
 g.updatePlayer(1/60,{charge:true,flightMode:true,pressed:{special:true}});assert.equal(g.p.state,'special');assert.equal(g.p.attack,null);
});
test('bosses can be launched and finished except Vegeta in Oozaru form',()=>{
 for(const id of [101,102,103]){
  const g=start(id),e=g.boss;g.hitEnemy(e,20,50,1,{launch:true});assert(e.vy<0);assert.equal(e.state,'juggle');
 }
 const ape=start(103);ape.boss.phase=2;ape.hitEnemy(ape.boss,20,50,1,{launch:true});assert.equal(ape.boss.vy,0);
 const namek=start(201);namek.hitEnemy(namek.boss,20,50,1,{launch:true});assert.equal(namek.boss.vy,0);
});
test('each new animation stays within the 24 validated poses, with six poses on finishers',()=>{
 for(const m of Object.values(SAIYAN_MOVES)){
  const frames=new Set();for(let t=0;t<=m.duration;t+=1/600){const f=comboSpriteFrame({t,move:m});assert(Number.isInteger(f)&&f>=0&&f<24);frames.add(f);}
  assert.equal(frames.size,m.spriteFrames.length);
 }
 assert.equal(SAIYAN_CHAIN.length,5);
});
test('Saiyan flight ceiling leaves room for the full uppercut and camera zoom',()=>{
 const g=start();g.enemies=[];Object.assign(g.p,{y:180,grounded:false,vy:-400});
 for(let i=0;i<60;i++)g.updatePlayer(1/60,{up:true,flightMode:true,pressed:{}});
 assert.equal(g.p.y,174);const tallestSprite=251*(105/213);assert((g.p.y-tallestSprite-270)*1.195+270>0);
});
