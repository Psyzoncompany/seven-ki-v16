import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
import {PLAYER_MOVES,movePhase,profileFor} from '../dist/combat-data.js';

test('frame data exposes startup, active, recovery, stun and cancel windows',()=>{
  for(const move of Object.values(PLAYER_MOVES)){
    assert.ok(move.startupFrames>0&&move.activeFrames>0&&move.recoveryFrames>0);
    assert.ok(move.hitstunFrames>0&&move.blockstunFrames>0);
    assert.ok(move.cancelStartFrame<=move.cancelEndFrame);
  }
  assert.equal(movePhase({t:0,move:PLAYER_MOVES.light1}),'startup');
  assert.equal(movePhase({t:PLAYER_MOVES.light1.active+.001,move:PLAYER_MOVES.light1}),'active');
});

test('boss personalities are distinct and Vegeta reacts fastest',()=>{
  const raditz=profileFor({storyBoss:'raditz'}),nappa=profileFor({storyBoss:'nappa'}),vegeta=profileFor({storyBoss:'vegeta'});
  assert.notEqual(raditz.preferredDistance,nappa.preferredDistance);
  assert.ok(vegeta.reactionTime<raditz.reactionTime);
  assert.ok(vegeta.comboSkill>nappa.comboSkill);
});

test('air recovery spends stamina and escapes hitstun once',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});game.events=[];
  game.p.grounded=false;game.p.y=300;game.p.stun=.5;game.p.stamina=100;
  game.step(1/60,{pressed:{dash:true}});
  assert.equal(game.p.stun,0);assert.ok(game.p.airRecovery>1);assert.ok(game.p.stamina<80);
  assert.ok(game.events.some(e=>e.type==='airRecover'));
});

test('enemy guard meter breaks and opens a punish window',()=>{
  const game=new GameEngine();game.start(101,{skills:[]});const enemy=game.enemies[0];
  enemy.state='guard';enemy.dir=-1;enemy.x=game.p.x+60;const combat=game.combatAI.ensure(enemy);combat.guardMeter=20;
  assert.equal(game.hitEnemy(enemy,20,90,1,{finisher:true}),true);
  assert.equal(enemy.state,'hurt');assert.ok(enemy.stun>=.8);assert.ok(game.events.some(e=>e.type==='guardBreak'));
});

test('combat debug snapshot reports boxes and AI intent without mutating play state',()=>{
  const game=new GameEngine();game.start(101,{skills:[]});const before=game.p.hp,snapshot=game.getDebugSnapshot();
  assert.equal(snapshot.player.phase,'neutral');assert.ok(snapshot.player.hurtbox.w>0);
  assert.ok(snapshot.enemies.length>0);assert.equal(game.p.hp,before);
});

test('hovering player is recognized and chased vertically without waiting for chance',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});const enemy=game.enemies[0];game.encounters[0].active=true;
  game.p.x=enemy.x+180;game.p.y=210;game.p.grounded=false;game.p.vy=0;
  for(let i=0;i<55;i++)game.combatAI.observe(game,1/60);
  assert.equal(game.combatAI.airSpam,true);
  const startY=enemy.y;for(let i=0;i<45;i++)game.updateEnemy(enemy,1/60);
  assert.equal(game.combatAI.ensure(enemy).flight,true);assert.ok(enemy.y<startY-70);
});

test('enemy air combo cancels between hits and finishes by slamming the player',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});const enemy=game.enemies[0];game.encounters[0].active=true;
  game.activeEncounter=game.encounters[0];for(const other of game.enemies)if(other!==enemy)other.hp=0;
  game.p.x=enemy.x+70;game.p.y=280;game.p.grounded=false;enemy.y=290;enemy.grounded=false;game.events=[];
  game.queueEnemyCombo(enemy,false,true);for(let i=0;i<100&&game.mode==='playing';i++)game.step(1/60,{});
  assert.ok(game.damageTaken>=24&&game.damageTaken<=36);assert.ok(game.events.some(e=>e.type==='enemyComboCancel'));assert.ok(game.p.y>300);
});

test('experienced enemy can cancel its attack into a defensive vanish',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});const enemy=game.enemies[0];game.encounters[0].active=true;game.events=[];
  game.p.x=enemy.x+55;game.p.y=enemy.y;game.p.dir=-1;game.beginAttack('normal');game.p.attack.t=game.p.attack.move.active;
  enemy.state='attack';enemy.timer=.2;const combat=game.combatAI.ensure(enemy);combat.profile={...combat.profile,defense:1,vanishChance:1};combat.ki=100;combat.stamina=100;game.random=()=>0;
  game.updateEnemy(enemy,1/60);assert.ok(game.events.some(e=>e.type==='enemyVanish'));assert.equal(enemy.state,'windup');
});

test('player can leave hitstun directly into guard',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});game.events=[];game.hitPlayer(18,game.p.x+40,220,false,{combo:true,hitstunFrames:18});
  for(let i=0;i<5;i++)game.updatePlayer(1/60,{guard:true,pressed:{}});
  assert.equal(game.p.stun,0);assert.equal(game.p.guarding,true);assert.ok(game.events.some(e=>e.type==='guardRecovery'));
});

test('ground dodge button becomes an accessible defensive recovery during hitstun',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});game.p.grounded=true;game.events=[];game.hitPlayer(18,game.p.x+40,220,false,{combo:true,hitstunFrames:18});
  for(let i=0;i<4;i++)game.updatePlayer(1/60,{pressed:i===3?{dash:true}:{}});
  assert.equal(game.p.stun,0);assert.equal(game.p.guarding,true);assert.ok(game.events.some(e=>e.type==='guardRecovery'));
});

test('timed attack during hitstun performs a stamina-limited counter burst',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});const enemy=game.enemies[0];enemy.x=game.p.x+70;game.events=[];game.hitPlayer(18,enemy.x,220,false,{combo:true});
  game.updatePlayer(1/60,{pressed:{attack:true}});
  assert.ok(game.events.some(e=>e.type==='counterBurst'));assert.ok(enemy.stun>=.4);assert.ok(game.p.stamina<=70);assert.ok(game.p.counterCooldown>1);
});

test('repeated aerial pressure triggers an enemy combo breaker and counter',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});const enemy=game.enemies[0],combat=game.combatAI.ensure(enemy);game.events=[];
  game.encounters[0].active=true;game.activeEncounter=game.encounters[0];game.p.x=700;game.p.y=280;game.p.grounded=false;game.p.lastMove='normal';game.p.dir=1;game.combatAI.sameAttackCount=3;enemy.x=760;enemy.y=280;enemy.hp=200;
  game.hitEnemy(enemy,5,0,1,{});game.hitEnemy(enemy,5,0,1,{});game.hitEnemy(enemy,5,0,1,{});
  assert.ok(game.events.some(e=>e.type==='enemyBreaker'));assert.equal(enemy.state,'windup');assert.equal(enemy.attackKind,'counter');assert.equal(enemy.stun,0);assert.equal(enemy.launchTime,0);assert.ok(enemy.invincible>=.3);assert.ok(combat.breakerCooldown>2);
  const hp=game.p.hp;for(let i=0;i<28;i++)game.updateEnemy(enemy,1/60);assert.ok(game.p.hp<hp);
});

test('combo breaker cooldown prevents repeated reversals on every hit',()=>{
  const game=new GameEngine();game.start(1,{skills:[]});const enemy=game.enemies[0],combat=game.combatAI.ensure(enemy);game.events=[];
  game.p.grounded=false;game.p.lastMove='normal';game.combatAI.sameAttackCount=4;enemy.hp=200;
  for(let i=0;i<6;i++)game.hitEnemy(enemy,2,0,1,{});
  assert.equal(game.events.filter(e=>e.type==='enemyBreaker').length,1);assert.ok(combat.breakerCooldown>0);
});


test('live aerial hit cannot overwrite an enemy reversal with automatic slam',()=>{
  const g=new GameEngine();g.start(1);g.enemies=g.enemies.slice(0,1);const e=g.enemies[0];
  g.p.x=700;g.p.y=280;g.p.grounded=false;g.p.dir=1;g.p.airChain=3;
  e.x=750;e.y=280;e.grounded=false;e.hp=e.maxHp=1000;
  const c=g.combatAI.ensure(e);c.pressureHits=1;c.pressureTime=1;c.breakerCooldown=0;
  g.combatAI.sameAttackCount=3;g.beginAttack();g.p.attack.step=2;g.p.attack.t=g.p.attack.move.active;
  g.events=[];g.updatePlayer(1/60,{pressed:{}});
  assert(g.events.some(v=>v.type==='enemyBreaker'));
  assert(!g.events.some(v=>v.type==='aerialFinish'));
  assert.equal(e.stun,0);assert.equal(e.launchTime,0);assert.equal(e.slam,false);
  assert.equal(e.state,'windup');assert.equal(g.p.chainWindow,0);assert.equal(g.p.airChain,0);
});

test('guard cancels a connected attack and repeated-attack memory expires',()=>{
  const g=new GameEngine();g.start(1);g.beginAttack();g.p.attack.connected=true;
  g.updatePlayer(1/60,{guard:true,pressed:{}});assert.equal(g.p.attack,null);assert(g.p.guarding);
  g.combatAI.sameAttackCount=8;g.time=10;g.p.lastAttack=1;g.combatAI.observe(g,1/60);
  assert.equal(g.combatAI.sameAttackCount,0);
});
