import {RaditzCampaignEngine} from './raditz-battle.js';
import {GameEngine,WORLD,clamp} from './engine.js';
import {CONTINUATION,cleanContinuation,readContinuation,continuationUnlocked} from './continuation-data.js';
export class ContinuationEngine extends RaditzCampaignEngine{
 reset(...args){this.continuation=null;super.reset(...args);}
 start(id=1101,build={}){
  const mission=CONTINUATION.find(m=>m.id===id);if(!mission)return super.start(id,build);
  const progress=cleanContinuation(build.continuation||readContinuation());if(!continuationUnlocked(id,progress,build.raditz))return false;
  this.reset(102,build);this.neutralPlayer=structuredClone(this.p);this.enemyTemplate=structuredClone(this.boss);
  this.story=this.level=mission;this.stageId=id;this.arrival=this.episode=this.journey=this.battle=null;
  this.platforms=[];this.hazards=[];this.rocks=[];this.orbs=[];this.seenScenes.add('assist');
  const record=progress.missions[id];this.time=record.completed?0:record.time;
  this.continuation={step:0,elapsed:0,score:0,damage:0,sceneTime:0,ending:false,completed:false,scenePaused:false};
  this.setContinuationStep(record.completed?0:record.checkpoint);return true;
 }
 get saiyanCombat(){return !!this.continuation||super.saiyanCombat;}
 get progress(){return this.continuation?this.finished?1:this.continuation.step/this.story.steps.length:super.progress;}
 get objective(){return this.story.steps[this.continuation.step];}
 setContinuationStep(index){
  const q=this.continuation,s=this.story.steps[index];Object.assign(q,{step:index,elapsed:0,score:0,damage:0,sceneTime:0,safeX:180,mark:0});
  const hp=s.actor==='gohan'?210:s.actor==='kuririn'?230:260;
  this.p={...structuredClone(this.neutralPlayer),character:s.actor,x:180,y:WORLD.ground,hp,ki:100,w:s.actor==='gohan'?28:36,h:s.actor==='gohan'?60:78};this.maxHp=hp;
  this.skills=new Set(this.stageId===1401&&index>=3?['kaioken','genki']:[]);this.mode='playing';this.finished=false;this.bossDefeated=false;this.zone=index;
  this.shots=[];this.inputBuffer={};this.freeze=0;this.combo=0;this.comboTime=0;
  const count=['fight'].includes(s.kind)?2:s.foe?1:0;
  this.enemies=Array.from({length:count},(_,i)=>({...structuredClone(this.enemyTemplate),id:i,type:0,storyBoss:null,spriteRow:4,name:s.foe==='oni'?['GOZ','MEZ'][i]:s.foe.toUpperCase(),local:s.foe,x:850+i*210,home:850+i*210,y:WORLD.ground,hp:s.foe==='nappa'?900:s.foe==='training'||s.foe==='gregory'?999:100,maxHp:s.foe==='nappa'?900:100,w:48,h:90,orb:0,state:'idle',cooldown:1.2+i*.6,attackCount:0}));
  for(const e of this.enemies)e.maxHp=e.hp;
  this.encounters=[];this.activeEncounter=null;this.bossAwake=true;
  this.emit('characterChanged',{character:s.actor});this.emit('continuationCheckpoint',{id:this.stageId,checkpoint:index,time:this.time});
  this.tell([s.intro]);
 }
 tell(lines,ending=false){this.continuation.sceneTime=0;this.continuation.scenePaused=false;this.continuation.ending=ending;this.dialogue={lines:lines.map(([speaker,text])=>({speaker,text})),index:0,after:'playing'};this.mode='dialogue';this.shots=[];this.inputBuffer={};this.p.attack=null;this.p.queued=null;this.p.vx=this.p.vy=0;this.emit('dialogue');}
 advanceDialogue(skip=false){
  if(!this.continuation)return super.advanceDialogue(skip);if(!this.dialogue)return;
  if(!skip&&++this.dialogue.index<this.dialogue.lines.length){this.emit('dialogue');return;}
  this.dialogue=null;this.emit('dialogueEnd');this.inputBuffer={};this.p.invincible=1;this.mode='playing';
  if(this.continuation.ending&&!this.continuation.completed){this.continuation.completed=true;this.finished=true;this.mode='won';this.emit('continuationVictory',{id:this.stageId,time:this.time});}
 }
 step(dt,input={}){
  if(!this.continuation)return super.step(dt,input);
  if(this.dialogue){if(!this.continuation.scenePaused){this.visualTime+=Math.min(dt,1/30);this.continuation.sceneTime+=Math.min(dt,1/30);if(this.continuation.ending){const index=Math.floor(this.continuation.sceneTime/5);if(index>=this.dialogue.lines.length)this.advanceDialogue(true);else if(index>this.dialogue.index){this.dialogue.index=index;this.emit('dialogue');}}}return;}
  if(this.mode!=='playing')return;
  this.continuation.elapsed+=Math.min(dt,1/30);super.step(dt,input);
 }
 updateEncounters(){if(!this.continuation)return super.updateEncounters();}
 updateHazards(dt){if(!this.continuation)return super.updateHazards(dt);}
 updatePlayer(dt,input){
  if(!this.continuation)return super.updatePlayer(dt,input);
  const q=this.continuation,s=this.objective,p=this.p,oldX=p.x;
  if(s.kind==='genki'&&input.charge&&input.pressed?.special)input={...input,ultimate:true};
  GameEngine.prototype.updatePlayer.call(this,dt,input);if(this.mode!=='playing')return;
  p.x=clamp(p.x,70,1730);
  if(this.stageId===1401){const speed=s.kind==='gravity'?.48+q.score*.12:.85;p.x=oldX+(p.x-oldX)*speed;}
  if(this.stageId===1301&&s.kind==='route'){
   for(const x of [600,1230])if(p.x>x&&p.x<x+120&&p.y>430){p.x=q.safeX;p.y=WORLD.ground;p.vx=p.vy=0;p.flying=false;p.ki=Math.max(25,p.ki);this.emit('toast',{text:'De volta ao marco. Use SUBIR para atravessar a fenda.'});}
   if(p.x>820&&q.safeX<800)q.safeX=820;
  }
  if(s.kind==='gravity'&&Math.abs(p.x-[520,1120,1600][q.score])<65)q.score++;
  q.bubblesX=900+Math.sin(q.elapsed*.8)*470;
  if(s.kind==='catch'){if(Math.abs(p.x-q.bubblesX)<75&&p.guarding&&p.grounded)q.score+=dt;else q.score=Math.max(0,q.score-dt*.25);}
  if(s.kind==='protect'&&q.damage>=60&&Math.abs(p.x-1320)<85&&p.guarding&&p.grounded)q.score+=dt;
 }
 hitEnemy(e,damage,knock,dir,options={}){
  if(!this.continuation)return super.hitEnemy(e,damage,knock,dir,options);
  if(this.mode!=='playing')return false;const s=this.objective,q=this.continuation;
  if(s.kind==='precision'&&q.elapsed%2.6<1.7)return false;
  const before=e.hp,persistent=['nappa','gregory','training'].includes(e.local);
  const result=GameEngine.prototype.hitEnemy.call(this,e,persistent?Math.min(damage,Math.max(0,e.hp-1)):damage,knock,dir,options);
  const dealt=before-e.hp;q.damage+=dealt;
  if(dealt>0&&s.kind==='precision'){q.score++;e.invincible=.9;}
  if(dealt>0&&s.kind==='kaioken'&&this.p.form)q.score+=dealt;
  if(dealt>0&&s.kind==='genki'&&this.p.state==='genki')q.score=1;
  return result;
 }
 fireGenki(){super.fireGenki();}
 fireBeam(){
  if(!this.continuation||this.p.character==='goku')return super.fireBeam();
  const p=this.p;this.emit(p.character==='piccolo'?'makankosappo':'beam',{x:p.x,y:p.y-45,dir:p.dir});
  for(const e of this.enemies)if(e.hp>0&&(e.x-p.x)*p.dir>0&&Math.abs(e.y-p.y)<100)this.hitEnemy(e,p.character==='kuririn'?75:65,180,p.dir,{beam:true});
 }
 updateEnemy(e,dt){
  if(!this.continuation)return super.updateEnemy(e,dt);if(e.hp<=0){e.dead+=dt;return;}
  const q=this.continuation,p=this.p;e.anim+=dt;e.invincible=Math.max(0,e.invincible-dt);e.flash=Math.max(0,e.flash-dt);
  if(this.stageId===1301&&Math.abs(e.x-p.x)>420&&e.state==='idle')return;
  if(e.local==='training'||e.local==='gregory'){e.state='idle';e.stun=0;e.vx=e.vy=0;e.y=WORLD.ground;if(e.local==='gregory'&&q.elapsed%2.6<1.7)e.x=950+Math.sin(q.elapsed*3)*320;return;}
  if(e.stun>0){e.stun=Math.max(0,e.stun-dt);e.state='hurt';e.x=clamp(e.x+e.vx*dt,90,1700);e.vx*=Math.exp(-8*dt);e.y=Math.min(WORLD.ground,e.y+170*dt);return;}
  if(this.objective.kind==='protect'&&q.damage>=60){e.state='windup';e.timer=1;return;}
  e.timer-=dt;
  if(e.state==='windup'){if(e.timer<=0){e.state='attack';e.timer=.25;e.attackDid=false;}return;}
  if(e.state==='attack'){
   if(!e.attackDid){e.attackDid=true;const range=e.attackKind==='burst'?220:110;if(Math.abs(e.x-p.x)<range&&Math.abs(e.y-p.y)<115)this.hitPlayer(e.local==='nappa'?22:12,e.x,170,false,{heavy:e.local==='nappa'});}
   if(e.timer<=0){e.state='recover';e.timer=e.local==='nappa'?1:.65;}return;
  }
  if(e.state==='recover'&&e.timer>0)return;
  const dx=p.x-e.x;e.dir=dx<0?-1:1;
  if(Math.abs(dx)<(e.local==='nappa'?170:95)){e.state='windup';e.attackKind=e.attackCount++%3===2?'burst':'strike';e.timer=e.local==='nappa'?.85:.6;e.windupDuration=e.timer;}
  else{e.state='run';e.x=clamp(e.x+e.dir*Math.min(Math.abs(dx),dt*(e.local==='nappa'?140:185)),90,1700);e.y+=Math.sign(p.y-e.y)*Math.min(Math.abs(p.y-e.y),dt*160);}
 }
 updateProgress(){
  if(!this.continuation)return super.updateProgress();if(this.mode!=='playing')return;
  const s=this.objective,q=this.continuation,dead=this.enemies.filter(e=>e.hp<=0).length;
  const done=s.kind==='route'?this.p.x>=s.goal&&dead===this.enemies.length:s.kind==='fight'?dead>=s.goal:s.kind==='damage'?q.damage>=s.goal:s.kind==='survive'?q.elapsed>=s.goal&&q.damage>=60:q.score>=s.goal;
  if(!done)return;
  if(q.step+1<this.story.steps.length){this.setContinuationStep(q.step+1);return;}
  const lines=this.stageId===1301?[['GOKU','Cheguei! Agora preciso saltar até aquele pequeno planeta.'],['SENHOR KAIOH','Bem-vindo. Seu verdadeiro treinamento começa aqui.']]:this.stageId===1401?[['SENHOR KAIOH','Você aprendeu o Kaioken e a Genki Dama. Use esse poder com cuidado.'],['GOKU','Meus amigos precisam de mim. Vou voltar o mais rápido que puder!']]:[['PICCOLO','Gohan... você foi o único que me tratou como um amigo.'],['GOHAN','Senhor Piccolo!'],['KURIRIN','Aquela energia... Goku!'],['GOKU','Gohan, Kuririn, afastem-se. Eu cuido disso agora.']];
  this.tell(lines,true);
 }
}
