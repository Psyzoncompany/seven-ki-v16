import {JourneyEngine,readJourney} from './journey.js';
import {EPISODE_ACTORS} from './episode-campaign.js';
import {WORLD,clamp} from './engine.js';
import {RADITZ_ID,RADITZ_MISSION,RADITZ_STEPS,RADITZ_SCENES,readRaditz,cleanRaditz} from './raditz-data.js';
const sign=n=>n<0?-1:1;
export class RaditzCampaignEngine extends JourneyEngine{
 reset(...args){this.battle=null;super.reset(...args);}
 start(id=1101,build={}){
  if(id!==RADITZ_ID)return super.start(id,build);
  if(!(build.journey||readJourney()).completed)return false;
  this.reset(101,{skills:[]});
  const enemy={...this.boss};this.neutralPlayer=structuredClone(this.p);
  this.story=this.level=RADITZ_MISSION;this.stageId=id;this.arrival=this.episode=this.journey=null;
  this.platforms=[];this.rocks=[];this.hazards=[];this.orbs=[];this.seenScenes.add('assist');
  this.enemies=[{...enemy,id:0,x:1060,home:1060,hp:560,maxHp:560,orb:0,name:'RADITZ',storyBoss:'raditz',spriteRow:0,w:60,h:105}];
  this.encounters=[{left:300,right:1500,ids:[0],active:true,cleared:false}];this.activeEncounter=this.encounters[0];this.bossAwake=true;
  const record=cleanRaditz(build.raditz||readRaditz());this.time=record.completed?0:record.time;
  this.battle={step:0,damage:0,charge:0,grapple:0,scene:null,scenePaused:false,allyClock:0,allyStrike:0,rush:0,completed:false};
  this.setBattleStep(record.completed?0:record.checkpoint);
  if(!record.checkpoint||record.completed)this.startBattleScene('intro');
  return true;
 }
 get saiyanCombat(){return !!this.battle||super.saiyanCombat;}
 get progress(){return this.battle?(this.finished?1:this.battle.step/4):super.progress;}
 setBattleStep(index){
  const b=this.battle,s=RADITZ_STEPS[index],a=EPISODE_ACTORS[s.actor];
  Object.assign(b,{step:index,damage:0,charge:0,grapple:0,scene:null,scenePaused:false,allyClock:0,allyStrike:0,rush:0});
  this.p={...structuredClone(this.neutralPlayer),character:s.actor,x:index===2?1280:620,y:WORLD.ground,dir:index===2?-1:1,w:a.w,h:a.h,hp:a.hp,ki:s.actor==='gohan'?0:70};
  this.maxHp=a.hp;this.zone=index;this.shots=[];this.inputBuffer={};this.freeze=0;this.combo=0;this.comboTime=0;
  Object.assign(this.boss,{hp:s.hp,maxHp:560,x:index===2?850:1050,y:WORLD.ground,stun:0,hitstun:0,invincible:0,flash:0,vx:0,vy:0,grounded:true,state:'idle',timer:0,cooldown:1.4,attackCount:0,combat:null});
  this.mode='playing';this.emit('characterChanged',{character:s.actor});this.emit('raditzCheckpoint',{checkpoint:index,time:this.time});
 }
 startBattleScene(key){
  if(this.battle.scene||this.battle.completed)return;
  this.battle.scene={key,time:0,cue:0};this.battle.scenePaused=false;this.mode='cinematic';this.shots=[];this.freeze=0;this.inputBuffer={};this.p.attack=null;this.p.queued=null;this.p.vx=this.p.vy=0;this.emit('raditzScene',{key});
 }
 finishBattleScene(){
  const key=this.battle?.scene?.key;if(!key)return;
  this.battle.scene=null;this.battle.scenePaused=false;this.inputBuffer={};this.emit('raditzSceneEnd');
  if(key==='finale'){
   if(this.battle.completed)return;this.battle.completed=true;this.battle.otherWorldReady=true;this.finished=true;this.bossDefeated=true;this.p.hp=0;this.boss.hp=0;this.p.state=this.boss.state='dead';this.mode='won';this.emit('raditzVictory',{time:this.time});return;
  }
  if(key==='opening')this.setBattleStep(1);else if(key==='firstBeam')this.setBattleStep(2);else if(key==='intervention')this.setBattleStep(3);else{this.mode='playing';this.p.invincible=.8;}
 }
 pause(){if(this.battle?.scene){this.battle.scenePaused=true;return;}super.pause();}
 resume(){if(this.battle?.scene){this.battle.scenePaused=false;return;}super.resume();}
 step(dt,input={}){
  if(!this.battle)return super.step(dt,input);
  if(this.battle.scene){
   if(this.battle.scenePaused)return;
   const scene=this.battle.scene,old=scene.time;scene.time+=Math.min(dt,1/30);this.visualTime+=dt;
   const cue=scene.key==='finale'?9:scene.key==='firstBeam'?1.2:scene.key==='intervention'?.5:null;
   if(cue!==null&&old<cue&&scene.time>=cue)this.emit(scene.key==='intervention'?'gohanPulse':'makankosappo',{x:600,y:400,dir:1});
   if(scene.time>=RADITZ_SCENES[scene.key].duration)this.finishBattleScene();return;
  }
  if(this.mode!=='playing')return;
  this.battle.dt=Math.min(dt,1/30);super.step(dt,input);
 }
 updateEncounters(){if(!this.battle)return super.updateEncounters();this.activeEncounter=this.encounters[0];}
 updateHazards(dt){if(!this.battle)super.updateHazards(dt);}
 updateProgress(){
  if(!this.battle)return super.updateProgress();const b=this.battle;
  if(b.step===0&&b.damage>=RADITZ_STEPS[0].goal)this.startBattleScene('opening');
  else if(b.step===1&&b.charge>=4)this.startBattleScene('firstBeam');
 }
 updatePlayer(dt,input){
  if(!this.battle)return super.updatePlayer(dt,input);
  const b=this.battle,p=this.p,e=this.boss;
  if(b.step===2){
   p.anim+=dt;p.invincible=Math.max(0,p.invincible-dt);
   if(b.rush>0){const dx=e.x-p.x,dy=e.y-35-p.y,d=Math.hypot(dx,dy);b.rush-=dt;p.state='attack';p.dir=sign(dx);p.x+=dx/Math.max(1,d)*Math.min(d,780*dt);p.y+=dy/Math.max(1,d)*Math.min(d,780*dt);p.grounded=false;
    if(d<65){this.emit('gohanPulse',{x:e.x,y:e.y-55});this.startBattleScene('intervention');}else if(b.rush<=0){p.y=WORLD.ground;p.grounded=true;}return;}
   const move=(input.right?1:0)-(input.left?1:0);p.vx=move*170;p.x=clamp(p.x+p.vx*dt,340,1460);p.y=WORLD.ground;p.grounded=true;if(move)p.dir=move;
   p.charging=!!input.charge;p.state=p.charging?'charge':move?'run':'idle';
   if(p.charging)b.charge=Math.min(1.2,b.charge+dt);p.ki=b.charge/1.2*100;
   if(b.charge>=1.2&&(input.pressed?.attack||input.pressed?.dash||input.pressed?.special)){b.rush=1.8;p.charging=false;this.emit('dash',{x:p.x,y:p.y-30,dir:sign(e.x-p.x)});}return;
  }
  super.updatePlayer(dt,{...input,transform:false,ultimate:false,pressed:{...input.pressed,transform:false,ultimate:false}});
  if(b.step===1){
   if(p.charging&&p.stun<=0)b.charge=Math.min(4,b.charge+dt);
   b.allyClock+=dt;b.allyStrike=Math.max(0,b.allyStrike-dt);
   if(b.allyClock>=4.5){b.allyClock=0;b.allyStrike=.7;e.stun=Math.max(e.stun,.7);e.state='hurt';e.vx=0;this.emit('hit',{x:e.x,y:e.y-50,damage:0,dir:1,heavy:false});}
  }
  if(b.step===3&&b.damage>=150){
   if(p.guarding&&p.stun<=0&&Math.abs(p.x-e.x)<105&&Math.abs(p.y-e.y)<75)b.grapple+=dt;else b.grapple=Math.max(0,b.grapple-dt);
   if(b.grapple>=.6)this.startBattleScene('finale');
  }
 }
 beginAttack(...args){const result=super.beginAttack(...args);if(this.battle&&this.p.character==='piccolo'&&this.p.attack){const a=this.p.attack;a.move={...a.move,reach:a.move.reach+25,damage:Math.round(a.move.damage*.95)};}return result;}
 fireBeam(){if(!this.battle||this.p.character!=='piccolo')return super.fireBeam();this.emit('makankosappo',{x:this.p.x,y:this.p.y-57,dir:this.p.dir});if((this.boss.x-this.p.x)*this.p.dir>0&&Math.abs(this.boss.y-this.p.y)<90)this.hitEnemy(this.boss,65,200,this.p.dir,{beam:true});}
 hitEnemy(e,damage,knock,dir,options={}){
  if(!this.battle)return super.hitEnemy(e,damage,knock,dir,options);
  if(this.mode!=='playing'||this.battle.step===2)return false;
  const before=e.hp,result=super.hitEnemy(e,Math.min(damage,Math.max(0,e.hp-1)),knock,dir,options);
  this.battle.damage+=before-e.hp;return result;
 }
 hitPlayer(...args){if(this.battle&&(this.mode!=='playing'||this.battle.step===2))return false;const hit=super.hitPlayer(...args);if(hit&&this.battle?.step===1)this.battle.charge=Math.max(0,this.battle.charge-.45);return hit;}
 registerEnemyPressure(e,options){if(this.battle)return false;return super.registerEnemyPressure(e,options);}
 updateEnemy(e,dt){
  if(!this.battle)return super.updateEnemy(e,dt);
  const b=this.battle,p=this.p;e.anim=(e.anim||0)+dt;e.moveCycle+=dt;e.flash=Math.max(0,e.flash-dt);e.invincible=Math.max(0,e.invincible-dt);
  if(b.step===2){e.state='recover';return;}
  if(e.stun>0){e.stun=Math.max(0,e.stun-dt);e.state='hurt';e.x+=e.vx*dt;e.vx*=Math.exp(-8*dt);e.vy+=WORLD.gravity*dt;e.y=Math.min(WORLD.ground,e.y+e.vy*dt);e.x=clamp(e.x,340,1460);e.grounded=e.y>=WORLD.ground;return;}
  e.dir=sign(p.x-e.x);e.cooldown=Math.max(0,e.cooldown-dt);e.timer-=dt;
  if(b.step===3&&b.damage>=150){e.state='recover';e.vx=0;e.y=Math.min(WORLD.ground,e.y+180*dt);return;}
  if(e.state==='windup'){
   e.vx=0;
   if(e.timer<=0){e.state='attack';e.timer=e.attackKind==='double'?.4:.26;e.attackDid=false;e.dir=e.attackDir;
    if(e.attackKind==='double'){for(const offset of [-15,15])this.shots.push({x:e.x+e.dir*45,y:e.y-55+offset,vx:e.dir*390,vy:offset*.8,damage:14,r:8,owner:'enemy',life:2,trail:[]});this.emit('blast',{x:e.x,y:e.y-50});}
   }return;
  }
  if(e.state==='attack'){
   e.dir=e.attackDir;
   if(e.attackKind==='rush')e.x=clamp(e.x+e.dir*600*dt,340,1460);
   const reach=e.attackKind==='airStrike'?140:100;
   if(e.attackKind!=='double'&&!e.attackDid&&Math.abs(p.x-e.x)<reach&&Math.abs(p.y-e.y)<115){e.attackDid=true;this.hitPlayer(e.attackKind==='airStrike'?24:18,e.x,230,false,{heavy:e.attackKind==='airStrike'});}
   if(e.timer<=0){e.state='recover';e.timer=.65;e.cooldown=.75;}return;
  }
  if(e.state==='recover'&&e.timer>0)return;
  const dx=p.x-e.x,dy=p.y-e.y;
  if(e.cooldown<=0&&(Math.abs(dx)<175||e.attackCount%3===1)){
   const pattern=['rush','double','airStrike','strike'];e.attackKind=pattern[e.attackCount++%pattern.length];e.attackDir=e.dir;e.state='windup';e.timer=e.attackKind==='double'?.85:e.attackKind==='rush'?.5:.42;e.windupDuration=e.timer;this.emit('tell',{x:e.x,y:e.y-e.h-17,boss:true});
  }else{e.state='run';e.x=clamp(e.x+sign(dx)*Math.min(Math.abs(dx),190*dt),340,1460);e.y=clamp(e.y+sign(dy)*Math.min(Math.abs(dy),200*dt),210,WORLD.ground);e.grounded=e.y===WORLD.ground;}
 }
}
