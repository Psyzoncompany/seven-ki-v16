import {VersusEngine} from './versus.js';
import {WORLD,clamp} from './engine.js';
import {createCoastalCreatures} from './coastal-creatures.js';
import {episodeById,EPISODE_ACTORS,EPISODE_SCENES,campaignUnlocked,readEpisodes} from './episode-campaign.js';

// Public campaign entry point. Legacy engines remain available to Versus and old saves.
export class CampaignEngine extends VersusEngine{
 reset(id=1101,build={}){
  this.episode=null;const mission=episodeById(id);
  super.reset(mission?1101:id,build);
  if(!mission)return;
  this.arrival=null;this.story=this.level=mission;this.stageId=id;this.platforms=mission.platforms;this.skills=new Set();
  const record=(build.episodes||readEpisodes()).missions[id],index=record.completed?0:record.checkpoint;
  this.episode={step:index,hold:0,elapsed:0,sceneTime:0,burst:false,tremor:0};
  this.neutralPlayer=structuredClone(this.p);this.time=index?record.time:0;
  this.rocks=[];
  this.enemies=createCoastalCreatures(0);const xs=id===1102?[1000,2420,2530]:[840,970];
  this.enemies=this.enemies.slice(0,xs.length).map((e,i)=>({...e,x:xs[i],home:xs[i],hp:index>(i===0||id===1103?0:2)?0:60+i*12,maxHp:60+i*12,missionStep:i===0||id===1103?0:2}));
  this.encounters=(id===1102?[{left:750,right:1200,ids:[0],missionStep:0},{left:2290,right:2670,ids:[1,2],missionStep:2}]:[{left:700,right:1120,ids:[0,1],missionStep:0}]).map(a=>({...a,cleared:index>a.missionStep,active:false}));
  if(id===1102){this.enemies.push({...createCoastalCreatures(0)[1],id:3,x:1810,home:1810,missionStep:1,hp:index>1?0:58,maxHp:58});this.encounters.push({left:1700,right:2110,ids:[3],missionStep:1,cleared:index>1,active:false});}
  this.orbs=[];this.activeEncounter=null;this.hazards=mission.hazards.map(h=>({...h}));
  this.switchActor(mission.objectives[index].actor,mission.objectives[index].checkpoint,false);
 }
 start(id=1101,build={}){
  if(!campaignUnlocked(id,build.episodes,build.arrivalCheckpoint,build.legacy))return false;
  if(!episodeById(id)){super.start(id,build);return true;}
  this.reset(id,build);this.mode='playing';if(!this.episode.step)this.openScene('intro');return true;
 }
 get saiyanCombat(){return !!this.episode||super.saiyanCombat;}
 get progress(){return this.episode?(this.finished?1:this.episode.step/this.story.objectives.length):super.progress;}
 switchActor(id,position,announce=true){
  const actor=EPISODE_ACTORS[id];this.maxHp=actor.hp;
  this.p={...structuredClone(this.neutralPlayer),character:id,x:position[0],y:position[1],w:actor.w,h:actor.h,hp:actor.hp,ki:id==='gohan'?0:60};
  this.p.grounded=position[1]===462;this.checkpoint=position[0];this.shots=[];this.inputBuffer={};this.freeze=0;this.combo=0;this.comboTime=0;this.combatAI.reset();
  for(const enemy of this.enemies){enemy.vx=0;enemy.state='idle';enemy.timer=0;enemy.cooldown=.8;}
  if(announce)this.emit('characterChanged',{character:id});
 }
 openScene(key){
  if(!this.episode)return super.openScene(key);
  if(this.seenScenes.has(key))return false;const lines=EPISODE_SCENES[this.stageId][key];if(!lines)return false;
  this.seenScenes.add(key);this.dialogue={lines,index:0,key,after:this.mode};this.mode='dialogue';this.episode.sceneTime=0;this.shots=[];this.inputBuffer={};this.p.attack=null;this.p.queued=null;this.p.vx=this.p.vy=0;this.emit('dialogue');return true;
 }
 step(dt,input={}){
  if(this.episode){
   this.episode.dt=Math.min(dt,1/30);
   if(this.mode==='dialogue'){this.episode.sceneTime+=dt;if(this.episode.sceneTime>=5.5){this.episode.sceneTime=0;this.advanceDialogue();}}
  }
  return super.step(dt,input);
 }
 updatePlayer(dt,input){
  if(!this.episode)return super.updatePlayer(dt,input);
  const p=this.p,child=p.character==='gohan',before=p.x;
  const clean=child?{left:input.left,right:input.right,guard:input.guard,pressed:{}}:{...input,transform:false,ultimate:false,pressed:{...input.pressed,transform:false}};
  super.updatePlayer(dt,clean);
  if(p.state==='run')p.x=before+(p.x-before)*EPISODE_ACTORS[p.character].speed/266;
  p.x=clamp(p.x,child?2620:96,child?2920:this.story.width-100);
  if(child){p.ki=0;p.burstTime=Math.max(0,(p.burstTime||0)-dt);}
 }
 beginAttack(...args){
  if(this.episode&&this.p.character==='gohan')return false;
  const result=super.beginAttack(...args);
  if(this.episode&&this.p.character==='piccolo'&&this.p.attack){const a=this.p.attack;a.move={...a.move,reach:a.move.reach+26,damage:Math.round(a.move.damage*.94),effect:a.kind==='normal'?'jab':a.move.effect};}
  return result;
 }
 fireBlast(){
  if(this.episode&&this.p.character==='gohan')return;
  super.fireBlast();if(this.episode&&this.p.character==='piccolo'){const shot=this.shots.at(-1);shot.r=6;shot.vx=this.p.dir*760;shot.damage=28;shot.gold=true;}
 }
 fireBeam(){
  if(!this.episode||this.p.character==='goku')return super.fireBeam();
  if(this.p.character==='gohan')return;
  const p=this.p;this.emit('makankosappo',{x:p.x+p.dir*40,y:p.y-57,dir:p.dir});this.freeze=.05;
  for(const e of this.enemies)if(e.hp>0&&(e.x-p.x)*p.dir>0&&(e.x-p.x)*p.dir<900&&Math.abs(e.y-e.h*.5-(p.y-57))<42)this.hitEnemy(e,130,380,p.dir,{beam:true,finisher:true});
  for(const r of this.rocks)if(!r.broken&&(r.x-p.x)*p.dir>0&&Math.abs(r.x-p.x)<900&&p.y-57>r.y-r.h&&p.y-57<r.y){r.broken=true;this.emit('rockBreak',{x:r.x,y:r.y-20});}
 }
 updateEncounters(){
  if(!this.episode)return super.updateEncounters();
  for(const a of this.encounters){a.cleared=this.enemies.filter(e=>a.ids.includes(e.id)).every(e=>e.hp<=0);a.active=!a.cleared&&a.missionStep===this.episode.step&&this.p.x>a.left-120&&this.p.x<a.right+120;}
 }
 updateHazards(dt){if(this.episode&&this.p.character==='gohan')return;super.updateHazards(dt);}
 updateProgress(){
  if(!this.episode)return super.updateProgress();
  const m=this.episode,p=this.p,t=this.story.objectives[m.step],dt=m.dt||1/60;
  this.zone=m.step;
  if(t.captive){
   m.elapsed+=dt;const shelter=p.x>=2790&&p.x<=2910;
   m.hold=shelter&&p.guarding?m.hold+dt:m.hold;
   if(m.hold>=3&&!m.burst){m.burst=true;p.burstTime=1.2;this.emit('gohanPulse',{x:p.x,y:p.y-30});}
   const tremor=Math.floor(m.elapsed/2.5);
   if(tremor>m.tremor){m.tremor=tremor;if(!shelter||!p.guarding)this.hitPlayer(12,p.x+80,0,false);}
   if(this.mode!=='playing'||m.hold<6)return;
  }else{
   if(t.fight!==undefined&&!this.encounters[t.fight].cleared)return;
   if(Math.abs(p.x-t.x)>105||Math.abs(p.y-t.y)>90)return;
  }
  if(m.step===this.story.objectives.length-1){this.mode='won';this.openScene('outro');return;}
  m.step++;m.hold=m.elapsed=m.tremor=0;m.burst=false;
  const next=this.story.objectives[m.step];this.switchActor(next.actor,next.checkpoint);
  this.emit('episodeCheckpoint',{id:this.stageId,checkpoint:m.step,time:this.time});this.openScene('checkpoint'+m.step);
 }
}
