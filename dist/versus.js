import {freezaPose} from './freeza-animation.js';
import {GameEngine,WORLD} from './engine.js?v=16';
import {AI_PROFILES} from './combat-data.js?v=14';
import {heroMotionFrame} from './hero-animation.js';

const fighter=(id,name,atlas,row,style,special='beam',extra={})=>({id,name,atlas,row,style,special,height:125,speed:266,power:1,...extra});
// Only characters with an existing combat atlas belong in this roster.
export const VERSUS_FIGHTERS=[
 fighter('goku','Goku','goku',0,'Equilibrado','beam',{full:true,height:105,technique:'Kamehameha'}),
 fighter('kaioken','Goku · Kaioken','kaioken',0,'Pressão veloz','beam',{full:true,height:105,speed:290,power:1.08,technique:'Kamehameha'}),
 fighter('raditz','Raditz','saiyanBosses',0,'Rápido e evasivo','volley',{ai:'raditz',speed:345,power:.9,technique:'Double Sunday'}),
 fighter('nappa','Nappa','saiyanBosses',1,'Pesado e resistente','burst',{ai:'nappa',speed:160,power:1.15,technique:'Explosão de KI'}),
 fighter('vegeta','Vegeta','saiyanBosses',2,'Fintas e contra-ataques','beam',{ai:'vegeta',technique:'Galick Ho'}),
 fighter('oozaru','Vegeta · Oozaru','sagaEnemies',3,'Gigante de curto alcance','burst',{ai:'nappa',height:180,speed:150,power:1.2,technique:'Onda destrutiva'}),
 fighter('saibaman','Saibaman','sagaEnemies',4,'Pequeno e ágil','volley',{height:85,speed:310,power:.9,technique:'Rajada ácida'}),
 fighter('soldier','Soldado de Freeza','namekVillains',0,'Combate à distância','volley',{profile:'gunner',height:105,technique:'Disparo duplo'}),
 fighter('dodoria','Dodoria','namekVillains',1,'Força bruta','burst',{ai:'dodoria',profile:'brawler',speed:205,power:1.12,technique:'Explosão de energia'}),
 fighter('zarbon','Zarbon','namekVillains',2,'Mobilidade aérea','volley',{ai:'zarbon',profile:'elite',speed:295,technique:'Rajada elegante'}),
 fighter('recoome','Recoome','namekVillains',3,'Golpes pesados','beam',{profile:'brawler',speed:210,power:1.13,technique:'Recoome Eraser Gun'}),
 fighter('ginyu','Capitão Ginyu','namekVillains',4,'Pressão técnica','beam',{ai:'ginyu',profile:'elite',technique:'Canhão de energia'}),
 fighter('freeza','Freeza','freeza',0,'Precisão e alcance','beam',{frames:24,ai:'freeza',profile:'boss',speed:295,technique:'Raio mortal'}),
 fighter('assault','Saiyajin assaltante','saiyans',0,'Ataque frontal','burst',{height:105,profile:'brawler',technique:'Impacto de KI'}),
 fighter('gunner','Saiyajin artilheira','saiyans',1,'Controle de distância','volley',{height:105,profile:'gunner',technique:'Disparo duplo'}),
 fighter('razek','Razek','saiyans',2,'Comandante agressivo','beam',{profile:'boss',technique:'Canhão Saiyajin'}),
 fighter('kai','Kai','base',0,'Equilibrado','beam',{full:true,height:105,technique:'Raio de KI'}),
 fighter('solar','Kai · Solar','solar',0,'Poder explosivo','burst',{full:true,height:105,power:1.08,technique:'Explosão solar'}),
 fighter('watcher','Vigia do vale','originalEnemies',0,'Combate corpo a corpo','burst',{profile:'brawler',height:105,technique:'Impacto de KI'}),
 fighter('caster','Artilheiro do vale','originalEnemies',1,'Rajadas de longe','volley',{profile:'gunner',height:105,technique:'Disparo duplo'}),
 fighter('guardian','Guardião do vale','originalEnemies',2,'Defesa e força','burst',{profile:'boss',height:145,speed:210,power:1.1,technique:'Onda do vale'})
];
export const versusFighter=id=>VERSUS_FIGHTERS.find(f=>f.id===id);
export const versusPose=(fighter,actor)=>{
 if(fighter.id==='freeza')return freezaPose(actor);
 if(fighter.full)return heroMotionFrame(actor);
 if(actor.finishing)return 4;
 if(actor.hp<=0)return 5;
 if(actor.stun>0)return 4;
 if(actor.attack)return actor.attack.t<actor.attack.move.active?2:actor.attack.t<=actor.attack.move.end?3:0;
 if(['windup','feint','charge'].includes(actor.state)||actor.state==='special'&&actor.stateTime<.26)return 2;
 if(['attack','blast','special','counter'].includes(actor.state))return 3;
 return Math.abs(actor.vx)>35||!actor.grounded?1:0;
};

export class VersusEngine extends GameEngine{
 reset(...args){this.versus=null;super.reset(...args);}
 startFinish(winner){
  if(this.versus.winner)return;
  this.versus.winner=winner;this.versus.finish={elapsed:0,duration:1.65,scale:.16};this.mode='playing';this.freeze=0;
  this.versus.score[winner]++;this.versus.matchOver=this.versus.score[winner]===2;
  const loser=winner==='player'?this.boss:this.p;loser.finishing=true;loser.vy=Math.min(loser.vy,-160);loser.grounded=false;
  this.shots=[];this.events=this.events.filter(e=>e.type!=='gameover');this.emit('versusFinish',{winner});
 }
 step(dt,input={}){
  const finish=this.versus?.finish;
  if(!finish)return super.step(dt,input);
  if(this.mode!=='playing')return;
  const slow=dt*finish.scale;finish.elapsed+=dt;this.visualTime+=slow;
  for(const actor of [this.p,this.boss]){
   actor.anim=(actor.anim||0)+slow;actor.stateTime=(actor.stateTime||0)+slow;
   actor.flash=Math.max(0,(actor.flash||0)-slow);
   if(actor.attack)actor.attack.t=Math.min(actor.attack.move.duration,actor.attack.t+slow);
   if(actor.finishing){actor.vy+=WORLD.gravity*slow;actor.x=Math.max(this.activeEncounter.left+30,Math.min(this.activeEncounter.right-30,actor.x+actor.vx*slow));actor.y=Math.min(WORLD.ground,actor.y+actor.vy*slow);actor.vx*=Math.exp(-2*slow);}
  }
  if(finish.elapsed>=finish.duration){
   if(this.versus.matchOver){this.finished=true;this.mode=this.versus.winner==='player'?'won':'dead';this.emit('versusEnd',{winner:this.versus.winner});}
   else if(finish.elapsed>=finish.duration+1.5){const {player,opponent,arena,score,round}=this.versus;const width=this.activeEncounter.right-this.activeEncounter.left;this.startVersus(player.id,opponent.id,arena);this.versus.score=score;this.versus.round=round+1;this.fitVersusArena(width+100);this.emit('roundStart',{round:this.versus.round});}
  }
 }
 startVersus(playerId='goku',opponentId='vegeta',arena='valley'){
  const player=versusFighter(playerId),opponent=versusFighter(opponentId);
  if(!player||!opponent)throw new Error('Personagem VERSUS inválido.');
  this.reset(101);
  this.versus={player,opponent,arena:arena==='namek'?'namek':'valley',winner:null,score:{player:0,cpu:0},round:1,matchOver:false};
  this.story={chapter:1,saga:arena==='namek'?'freeza':'saiyan',bossName:opponent.name};
  this.skills=new Set();this.maxHp=300;
  this.level={name:'VERSUS',bossName:opponent.name,zones:['VERSUS','VERSUS','VERSUS','VERSUS']};
  this.platforms=[];this.hazards=[];this.orbs=[];this.shots=[];this.events=[];
  const cpu=this.boss;
  Object.assign(cpu,{id:0,x:1100,home:1100,y:WORLD.ground,hp:300,maxHp:300,orb:0,storyBoss:opponent.ai||null,name:opponent.name,spriteRow:opponent.row,versusFighter:opponent,aggression:1,cooldown:.7,w:opponent.height>150?110:55,h:opponent.height,phase:1});
  this.enemies=[cpu];this.combatAI.ensure(cpu).profile=AI_PROFILES[opponent.ai]||AI_PROFILES[opponent.profile]||AI_PROFILES.brawler;
  this.encounters=[{left:510,right:1390,trigger:510,ids:[0],title:'VERSUS',active:true,cleared:false}];
  this.activeEncounter=this.encounters[0];this.bossAwake=true;
  Object.assign(this.p,{x:790,y:WORLD.ground,hp:300,ki:60,w:player.height>150?100:36,h:player.height>150?155:78});
  this.mode='playing';this.emit('versusStart');
 }
  openScene(key){return this.versus?false:super.openScene(key);}
  fitVersusArena(viewWidth){
    if(!this.versus)return;
    const arena=this.activeEncounter,oldWidth=arena.right-arena.left,width=Math.max(320,Math.min(880,viewWidth-100));
    if(Math.abs(width-oldWidth)<1)return;
    const fit=(actor,padding)=>{const ratio=(actor.x-arena.left)/oldWidth;actor.x=Math.max(arena.left+padding,Math.min(arena.left+width-padding,arena.left+ratio*width));};
    fit(this.p,22);fit(this.boss,32);arena.right=arena.left+width;
  }
 updateStoryBoss(e){return this.versus?false:super.updateStoryBoss(e);}
 updateEncounters(){if(!this.versus)super.updateEncounters();}
 updateProgress(){if(!this.versus)super.updateProgress();}
 updateHazards(dt){if(!this.versus)super.updateHazards(dt);}
 updatePlayer(dt,input){
  if(!this.versus)return super.updatePlayer(dt,input);
  // Forms are roster choices; story unlocks and transformation scenes do not apply.
  const clean={...input,pressed:{...input.pressed,transform:false},ultimate:false};
  const before=this.p.x;super.updatePlayer(dt,clean);
  if(this.versus.player.id==='freeza'&&this.p.state==='special'&&!this.p.specialFired)this.p.specialVariant=(this.p.freezaSpecialCount||0)%2?'deathBall':'deathBeam';
  if(this.p.state==='run')this.p.x=Math.max(this.activeEncounter.left+22,Math.min(this.activeEncounter.right-22,before+(this.p.x-before)*this.versus.player.speed/266));
 }
  updateEnemy(e,dt){
    if(!this.versus)return super.updateEnemy(e,dt);
    if(e.state==='windup'&&e.attackKind==='volley')e.attackKind='versusSpecial';
  const before=e.x;super.updateEnemy(e,dt);
  if(e.state==='run'&&!['raditz','nappa'].includes(e.storyBoss))e.x=Math.max(this.activeEncounter.left+32,Math.min(this.activeEncounter.right-32,before+(e.x-before)*this.versus.opponent.speed/245));
 }
 hitEnemy(e,damage,knock,dir,options={}){
  if(this.versus?.winner)return false;
  const hit=super.hitEnemy(e,this.versus?damage*this.versus.player.power:damage,knock,dir,options);
  if(this.versus&&hit&&e.hp<=0)this.startFinish('player');
  return hit;
 }
 hitPlayer(damage,...args){
  if(this.versus?.winner)return false;
  if(this.versus){damage*=this.versus.opponent.power;if(['nappa','oozaru'].includes(this.versus.player.id))damage*=.78;}
  const hit=super.hitPlayer(damage,...args);
  if(this.versus&&this.p.hp<=0)this.startFinish('cpu');
  return hit;
 }
 fireBeam(){
  if(!this.versus)return super.fireBeam();
  this.fireVersusSpecial(this.p,this.versus.player,'player');
 }
 fireStoryBoss(e){
  if(!this.versus)return super.fireStoryBoss(e);
  if(e.storyBoss==='freeza')return super.fireStoryBoss(e);
  this.fireVersusSpecial(e,this.versus.opponent,'enemy');e.state='recover';e.timer=.85;e.vx=0;
 }
 fireVersusSpecial(actor,fighter,owner){
  if(fighter.id==='freeza'){actor.specialVariant=(actor.freezaSpecialCount||0)%2?'deathBall':'deathBeam';actor.freezaSpecialCount=(actor.freezaSpecialCount||0)+1;if(actor.specialVariant==='deathBall'){this.shots.push({x:actor.x+actor.dir*38,y:actor.y-58,vx:actor.dir*300,vy:0,r:28,damage:120,owner,life:2.8,trail:[]});this.emit('blast',{x:actor.x,y:actor.y-58});return;}}
  const player=owner==='player',targets=player?this.enemies:[this.p],dir=actor.dir;
  if(fighter.special==='volley'){
   for(const vy of [-28,28])this.shots.push({x:actor.x+dir*48,y:actor.y-48,vx:dir*520,vy,r:12,damage:player?44:24,owner,life:1.6,trail:[]});
   this.emit(player?'blast':'enemyBlast',{x:actor.x,y:actor.y-48});return;
  }
  const burst=fighter.special==='burst';
  this.emit(burst?'solarBurst':player?'beam':'enemyBeam',{x:actor.x,y:actor.y-48,dir});
  for(const target of targets){const dx=(target.x-actor.x)*dir,dy=Math.abs(target.y-actor.y);
   if(burst?Math.hypot(dx,dy)<225:dx>-35&&dx<800&&dy<95){
    if(player)this.hitEnemy(target,burst?95:115,burst?420:580,Math.sign(target.x-actor.x)||dir,{beam:true,finisher:true});
    else this.hitPlayer(burst?34:42,actor.x,400,false,{heavy:true});
   }
  }
 }
}
