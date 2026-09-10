import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
const start=(id=101)=>{const g=new GameEngine();g.start(id);g.advanceDialogue(true);g.events=[];return g;};
test('launcher pays KI and insufficient energy cannot create a launcher',()=>{
 const g=start();g.enemies=[];g.p.ki=13;assert.equal(g.beginAttack('launch'),false);assert.equal(g.p.attack,null);
 g.p.ki=40;g.beginAttack('launch');assert.equal(g.p.ki,26);assert.equal(g.p.attack.kind,'launch');
});
test('spin creates space against all human Saiyan bosses',()=>{
 for(const id of [101,102,103]){const g=start(id),e=g.boss;g.hitEnemy(e,30,540,1,{finisher:true});assert(e.vx>=350);}
});
test('special on whiff cannot erase recovery; beam startup can be interrupted',()=>{
 const g=start();g.enemies=[];g.beginAttack();g.p.attack.t=.01;g.updatePlayer(1/60,{pressed:{special:true}});assert(g.p.attack);
 g.p.attack.connected=true;g.p.attack.t=g.p.attack.move.active+.04;g.updatePlayer(1/60,{pressed:{special:true}});assert.equal(g.p.state,'special');
 g.hitPlayer(20,g.p.x+50);assert.equal(g.p.state,'hurt');assert(!g.events.some(e=>e.type==='beam'));
});
test('guard starts immediately even during startup; holding it cannot break hitstun',()=>{
 const g=start();g.enemies=[];g.beginAttack();g.updatePlayer(1/60,{guard:true});assert(g.p.guarding);assert.equal(g.p.attack,null);
 g.hitPlayer(20,g.p.x-50);const ki=g.p.ki;
 for(let i=0;i<8;i++)g.updatePlayer(1/60,{guard:true});assert(g.p.stun>0);assert.equal(g.p.ki,ki);
});
test('fresh recovery command spends 25 KI and shares a two-second escape cooldown',()=>{
 const g=start();g.enemies=[];g.hitPlayer(20,g.p.x+50);g.p.stateTime=.1;g.p.ki=60;
 g.updatePlayer(1/60,{guard:true});assert.equal(g.p.stun,0);assert.equal(g.p.ki,35);assert(g.p.escapeCooldown>1.9);
 g.p.invincible=0;g.hitPlayer(20,g.p.x-50);g.p.stateTime=.1;g.updatePlayer(1/60,{pressed:{attack:true}});assert(g.p.stun>0);assert.equal(g.p.ki,35);
});
test('defensive teleport needs a threat within 140ms and charges for mistiming',()=>{
 const g=start(),e=g.enemies[0];e.x=g.p.x+90;e.state='windup';e.timer=.12;g.p.ki=60;
 assert(g.defensiveVanish());assert.equal(g.p.ki,40);assert(g.p.invincible>0);
 g.p.vanishCooldown=0;e.timer=.5;assert.equal(g.defensiveVanish(),false);assert.equal(g.p.ki,20);
});
test('Nappa resists damage and commits to heavy windup while Raditz can be interrupted',()=>{
 const r=start(),n=start(102);r.boss.state=n.boss.state='windup';
 r.hitEnemy(r.boss,100,50,1);n.hitEnemy(n.boss,100,50,1);
 assert.equal(r.boss.maxHp-r.boss.hp,100);assert.equal(n.boss.maxHp-n.boss.hp,78);
 assert.equal(r.boss.state,'hurt');assert.equal(n.boss.state,'windup');
 r.queueEnemyCombo(r.boss,true);n.queueEnemyCombo(n.boss,true);assert(n.boss.timer>r.boss.timer*3);
 assert.deepEqual(n.boss.combat.comboQueue,['finisher']);
});
test('Vegeta uses a visible feint into guard, then a counter',()=>{
 const g=start(103),e=g.boss;g.seenScenes.add('boss');g.encounters.at(-1).active=true;g.p.x=e.x-100;e.cooldown=0;
 assert.equal(g.combatAI.decide(g,e,1/60),'feint');g.combatAI.ensure(e).decision=0;
 g.updateEnemy(e,1/60);assert.equal(e.state,'feint');
 for(let i=0;i<12;i++)g.updateEnemy(e,1/60);assert.equal(e.state,'guard');
 for(let i=0;i<16;i++)g.updateEnemy(e,1/60);assert.equal(e.attackKind,'counter');
});
