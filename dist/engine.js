import {updateCoastalCreature,updateCoastalEncounters} from './coastal-creatures.js';
import {ARRIVAL,ARRIVAL_ID,ARRIVAL_SCENES,initArrival,updateArrival,tickArrivalScene} from './arrival-mission.js';
import {setReaction,tickReaction,impactPause} from './hit-reaction.js';
import {storyEncounters} from './encounter-design.js';
import {CHAPTERS,SCENES} from './saga.js';
import {isSaiyanChapter,saiyanMove,SAIYAN_BOSS_SCENES} from './saiyan-combat.js?v=16';
import {PLAYER_CHAIN,PLAYER_MOVES,canCancel,moveFrame,movePhase,rectsOverlap} from './combat-data.js?v=14';
import {CombatDirector} from './combat-ai.js?v=14';
export const WORLD = { width: 6240, ground: 462, gravity: 1600, maxHealth: 250 };
export const PLATFORMS = [
  {x:1370,y:384,w:180,h:54},{x:1620,y:290,w:215,h:64},{x:1910,y:355,w:180,h:54},
  {x:2580,y:365,w:150,h:50},{x:3170,y:381,w:170,h:54},{x:3400,y:310,w:175,h:60},
  {x:3590,y:240,w:200,h:66},{x:4640,y:369,w:170,h:52}
];
export const ENCOUNTERS=[
  {left:510,right:1270,trigger:565,ids:[0,1,2],title:'PÁTIO DOS VIGIAS'},
  {left:2220,right:3080,trigger:2270,ids:[3,4,5],title:'CERCO DO TEMPLO'},
  {left:3900,right:4530,trigger:3950,ids:[6,7,8],title:'ÚLTIMA GUARDA'},
  {left:5050,right:5890,trigger:5100,ids:[9],title:'GUARDIÃO DO VALE'}
];
export const FOREST={
  name:'FLORESTA CELESTE',bossName:'RAZEK · COMANDANTE SAIYAJIN',
  zones:['FRONTEIRA DA FLORESTA','COPAS CELESTES','RUÍNAS DA PATRULHA','ARENA DE RAZEK'],
  platforms:[{x:1380,y:384,w:180,h:55},{x:1590,y:306,w:160,h:55},{x:1800,y:240,w:240,h:64},{x:2110,y:350,w:120,h:48},{x:2670,y:360,w:165,h:50},{x:3150,y:380,w:160,h:50},{x:3350,y:306,w:150,h:55},{x:3560,y:240,w:230,h:60},{x:4760,y:370,w:190,h:50},{x:5000,y:310,w:150,h:50}],
  encounters:[{left:510,right:1280,trigger:565,ids:[0,1,2],title:'PATRULHA SAIYAJIN'},{left:2280,right:3080,trigger:2330,ids:[3,4,5,6],title:'CERCO DOS CONJURADORES'},{left:3940,right:4650,trigger:3990,ids:[7,8,9,10],title:'GUARDA DE ELITE'},{left:5220,right:5920,trigger:5270,ids:[11],title:'RAZEK · COMANDANTE SAIYAJIN'}],
  spawns:[[690,0,150],[910,1,125],[1170,0,185,2],[2410,1,140],[2600,0,165],[2820,1,145],[2980,0,205,4],[4050,0,185],[4210,1,155],[4390,0,190],[4530,1,180,6],[5630,2,1100,7]],
  orbs:[[350,430,1],[1910,202,3],[3670,202,5]]
};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const sign=n=>n<0?-1:1;
export const MOVES=PLAYER_CHAIN;
const LAUNCH=PLAYER_MOVES.launcher,AIR=PLAYER_MOVES.air,DIVE=PLAYER_MOVES.dive;

export class GameEngine {
  constructor(){this.seed=773;this.combatAI=new CombatDirector('normal');this.reset();}
  random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
  reset(stageId=1,build={}){
    this.arrival=null;this.story=CHAPTERS.find(c=>c.id===stageId)||(stageId===ARRIVAL_ID?ARRIVAL:null);this.stageId=this.story?stageId:stageId===2?2:1;this.skills=new Set(build.skills||[]);this.kaiokenLevel=build.form===4&&this.skills.has('kaioken4')?4:build.form===3&&this.skills.has('kaioken3')?3:2;if(this.story?.chapter===2)this.kaiokenLevel=2;this.dialogue=null;this.seenScenes=new Set();this.hazards=(this.story?.hazards||[]).map(h=>({...h}));this.hazardCooldown=0;this.maxHp=WORLD.maxHealth+(this.story&&this.skills.has('vigor')?40:0);this.level=this.stageId===2?FOREST:{name:"VALE DOS ECOS",bossName:"GUARDIÃO DO VALE",zones:["O CAMINHO COMEÇA","TRILHA DOS VIGIAS","ESCADARIA CELESTE","SANTUÁRIO DO GUARDIÃO"]};if(this.story)this.level=this.story;this.platforms=this.story?this.story.platforms:this.stageId===2?FOREST.platforms:PLATFORMS;
    this.seed=773;this.mode='intro';this.time=0;this.visualTime=0;this.freeze=0;this.combatAI.reset();
    this.events=[];this.shots=[];this.rings=[];this.orbs=[];this.enemies=[];this.zone=0;this.inputBuffer={};
    this.combo=0;this.comboTime=0;this.maxCombo=0;this.kills=0;this.damageTaken=0;this.parries=0;this.specials=0;this.perfects=0;this.airHits=0;
    this.encounters=(this.story?(this.story.encounters||storyEncounters(this.story)):this.stageId===2?FOREST.encounters:ENCOUNTERS).map(e=>({...e,active:false,cleared:false}));this.activeEncounter=null;
    this.rocks=this.encounters.flatMap((a,i)=>[.25,.78].map((f,j)=>({x:a.left+(a.right-a.left)*f,y:WORLD.ground,w:28+(i+j)%3*6,h:36+(i+j)%3*9,broken:false})));this.craters=[];
    this.toastCooldown=0;this.checkpoint=150;this.bossAwake=false;this.bossDefeated=false;this.finished=false;
    this.p={x:180,y:WORLD.ground,vx:0,vy:0,w:36,h:78,dir:1,hp:this.maxHp,ki:60,
      grounded:true,jumps:0,coyote:.1,jumpBuffer:0,state:'idle',stateTime:0,attack:null,
      invincible:0,stun:0,dashTimer:0,dashCooldown:0,blastCooldown:0,specialCooldown:0,
      form:false,formTime:0,formFatigue:0,formCooldown:0,chargeTime:0,chargeLock:0,guardTime:0,comboStep:0,lastAttack:-10,charging:false,guarding:false,
      anim:0,steps:0,wasGrounded:true,queued:null,recovery:0,airChain:0,airFloat:0,diving:false,lastMove:'',perfectFlash:0,vanishCooldown:0,chainTarget:null,chainWindow:0,
      stamina:100,guardMeter:100,airRecovery:0,wallBounces:0,groundBounces:0,lastHitstun:0,flying:false,flightGrace:0,counterCooldown:0,counterWindow:0,hurtRecoveryAnim:0,incomingCombo:0,incomingComboTime:0,guardHeld:false,parryCooldown:0,escapeCooldown:0};
    const spawns=this.story?this.story.spawns:this.stageId===2?FOREST.spawns:[
      [690,0,110],[960,0,140],[1170,0,180,2],[2430,1,135],[2700,0,180],
      [2930,0,200,4],[4050,0,190],[4260,1,150],[4430,0,230,6],[5540,2,900,7]
    ];
    spawns.forEach((s,i)=>this.enemies.push({id:i,x:s[0],home:s[0],y:WORLD.ground,vx:0,vy:0,
      storyBoss:s[1]===2?this.story?.boss:null,spriteRow:this.story?(s[4]??(s[1]===2?(this.story.bossRow??this.story.chapter-1):(this.story.troopRow??4))):null,saiyan:this.stageId===2||!!this.story,name:this.stageId===2?['SAIYAJIN ASSALTANTE','SAIYAJIN ARTILHEIRA','RAZEK'][s[1]]:'',type:s[1],hp:s[2],maxHp:s[2],orb:s[3]||0,w:s[1]===2?88:40,h:s[1]===2?124:82,
      dir:-1,state:'idle',timer:.4+i*.12,cooldown:.8,stun:0,flash:0,dead:0,invincible:0,
      grounded:true,attackDid:false,aggression:0,phase:1,moveCycle:0,shotCount:0,
	      defenseCooldown:1.4,guard:100,observed:0,flank:0,launchTime:0,airFloat:0,slam:false,attackKind:'strike',attackCount:0,reaction:0,aimX:0,aimY:0,windupDuration:.6,hitstun:0,blockstun:0}));
    (this.story?this.story.orbs:this.stageId===2?FOREST.orbs:[[350,430,1],[1730,252,3],[3690,202,5]]).forEach(o=>this.orbs.push({x:o[0],y:o[1],id:o[2],got:false,t:0}));
    if(stageId===ARRIVAL_ID)initArrival(this,build.arrivalCheckpoint);
  }
  emit(type,data={}){this.events.push({type,...data});}
  start(stageId=1,build={}){this.reset(stageId,build);this.mode='playing';if(this.story){if(this.enemies.length)this.enemies.at(-1).name=this.story.bossName;if(this.encounters.length)this.encounters.at(-1).title=this.story.bossName;if(!this.arrival||!this.arrival.step)this.openScene('intro');}this.emit('zone',{title:this.level.name,subtitle:this.story?'Reúna as 7 esferas e alcance '+this.story.bossName+'.':this.stageId===2?'Reúna 7 esferas. Vença a patrulha e o comandante Razek.':'Encontre as 7 esferas. Derrote o guardião.'});this.emit('toast',{text:'WASD: mover / voar · E: subir · ←: golpes · Ctrl: KI',mobile:'GOLPE para combinar · ELEVAR lança o alvo · QUEDA finaliza no ar.'});}
  get collected(){return this.orbs.filter(o=>o.got).length;}
  get saiyanCombat(){return !!this.arrival||isSaiyanChapter(this.stageId);}
  canJuggleEnemy(e){return e.type!==2||this.saiyanCombat&&!(e.storyBoss==='vegeta'&&e.phase===2);}
  enemyCeiling(e){return this.saiyanCombat?(e.storyBoss==='vegeta'&&e.phase===2?255:174):86;}
  get boss(){return this.enemies[this.enemies.length-1]||{id:-1,hp:0,maxHp:1,storyBoss:null,phase:1};}
  get progress(){if(this.arrival)return this.finished?1:this.arrival.step/4;return clamp((this.p.x-150)/(WORLD.width-400),0,1);}
  pause(){if(this.mode==='playing'){this.mode='paused';this.emit('paused');}}
  resume(){if(this.mode==='paused')this.mode='playing';}
  tip(text){if(this.toastCooldown<=0){this.emit('toast',{text});this.toastCooldown=1.5;}}
  step(dt,input={}){
    dt=Math.min(dt,1/30);this.visualTime+=dt;
    if(this.arrival)tickArrivalScene(this,dt);
    if(this.mode!=='playing')return;
    this.time+=dt;
    if(this.freeze>0){Object.assign(this.inputBuffer,input.pressed||{});this.freeze-=dt;return;}
    input={...input,pressed:{...this.inputBuffer,...input.pressed}};this.inputBuffer={};
    this.toastCooldown-=dt;this.combatAI.observe(this,dt);
    this.comboTime-=dt;if(this.comboTime<=0)this.combo=0;
    this.updateEncounters();if(this.mode!=='playing')return;this.updatePlayer(dt,input);
    if(this.mode!=='playing')return;
    for(const e of this.enemies){this.updateEnemy(e,dt);if(this.mode!=='playing')return;}
    this.updateHazards(dt);if(this.mode!=='playing')return;
    this.updateShots(dt);
    this.updateOrbs(dt);
    if(this.arrival)updateArrival(this,dt,input);else this.updateProgress();
  }
  updatePlayer(dt,input){
    const p=this.p,pressed=input.pressed||{};
    p.anim+=dt;p.stateTime+=dt;tickReaction(p,dt);p.riposteWindow=Math.max(0,(p.riposteWindow||0)-dt);
    p.formCooldown=Math.max(0,p.formCooldown-dt);p.chargeLock=Math.max(0,p.chargeLock-dt);
    if(!input.charge||p.stun>0||p.form||p.chargeLock>0)p.chargeTime=0;
    if(!p.form)p.formFatigue=Math.max(0,p.formFatigue-dt*5);
    this.craters=this.craters.filter(c=>this.time-c.born<3);
    const previousStun=p.stun;
    const guardEdge=!!input.guard&&!p.guardHeld;p.guardHeld=!!input.guard;
    p.parryCooldown=Math.max(0,p.parryCooldown-dt);p.escapeCooldown=Math.max(0,p.escapeCooldown-dt);
    if(this.saiyanCombat&&guardEdge)p.guardTime=p.parryCooldown>0?1:0;
    ['invincible','stun','dashCooldown','blastCooldown','specialCooldown','jumpBuffer','recovery','perfectFlash','vanishCooldown','chainWindow','airFloat','airRecovery','flightGrace','counterCooldown','counterWindow','hurtRecoveryAnim','incomingComboTime'].forEach(k=>p[k]=Math.max(0,p[k]-dt));
    if(previousStun>0&&p.stun<=0){p.invincible=Math.max(p.invincible,.16);p.counterWindow=Math.max(p.counterWindow,.2);p.hurtRecoveryAnim=.24;this.emit('hurtRecover',{x:p.x,y:p.y-42});}
    if(p.incomingComboTime<=0)p.incomingCombo=0;
    p.stamina=clamp(p.stamina+dt*(p.guarding?5:22),0,100);p.guardMeter=clamp(p.guardMeter+dt*(p.guarding?0:16),0,100);
    const branch=this.saiyanCombat&&pressed.blast&&!input.charge&&p.attack;
    const technique=branch&&input.up||pressed.launcher||pressed.technique&&p.grounded||pressed.attack&&input.up;
    const slam=branch&&input.down&&!p.grounded||pressed.slam||pressed.technique&&!p.grounded||pressed.attack&&input.down&&!p.grounded;
    const spin=branch&&!technique&&!slam;
    const branchKind=p.attack?.step===0?'pressure':'spin';
    if(branch){input={...input,blast:false};pressed.blast=false;}
    if(p.attack&&(pressed.attack||technique||slam||spin)){
      const a=p.attack,perfect=a.t>=a.move.end-.045&&a.t<=a.move.end+.095;
      p.queued={kind:slam?'slam':technique?'launch':spin?branchKind:'normal',perfect};
    }
    if(p.attack&&pressed.special&&p.attack.connected&&p.specialCooldown<=0&&p.ki>=(this.story&&this.skills.has('kame')?32:40)&&canCancel(p.attack,'special')){p.attack=null;p.queued=null;p.recovery=0;}
    if(this.story&&this.skills.has('ki')&&!this.activeEncounter&&!p.form&&!p.attack)p.ki=clamp(p.ki+dt*5,0,100);
    if(p.form){p.formFatigue=Math.min(100,p.formFatigue+dt*(p.attack?11:6));p.formTime-=dt;p.ki=Math.max(0,p.ki-dt*(this.story?4+this.kaiokenLevel*.8+p.formFatigue*.05:4.3));if(this.story&&this.kaiokenLevel>2)p.hp=Math.max(1,p.hp-dt*(this.kaiokenLevel===4?5:2));if(p.formTime<=0||p.ki<=0){p.form=false;p.formTime=0;p.formCooldown=3;this.emit('formEnd');this.tip(this.story?'Kaioken encerrado. Recupere seu fôlego.':'Ascensão encerrada. Acerte golpes para recuperar KI.');}}
    if(pressed.jump)p.jumpBuffer=.14;
    if(p.grounded)p.coyote=.1;else p.coyote-=dt;
    const move=(input.right?1:0)-(input.left?1:0);
    if(pressed.lockOn){const targets=this.enemies.filter(e=>e.hp>0&&(!this.activeEncounter||this.activeEncounter.ids.includes(e.id))).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));const old=targets.findIndex(e=>e.id===p.lockTarget);p.lockTarget=targets[(old+1)%targets.length]?.id;}
    const locked=this.enemies.find(e=>e.id===p.lockTarget&&e.hp>0);
    if(locked&&!p.attack&&!move)p.dir=sign(locked.x-p.x);
    if(input.flightMode&&p.stun<=0&&(input.up||input.ascend)&&!input.charge&&p.grounded){p.grounded=false;p.y-=8;p.vy=-180;p.flying=true;p.jumpBuffer=0;}
    if(p.dragonRush&&(!input.dragonDash||p.ki<=0||input.attack||pressed.special||input.guard)){p.dragonRush=false;p.dashTimer=0;}
    if(input.dragonDash&&!input.attack&&p.stun<=0&&p.ki>0&&!['special','genki','transform'].includes(p.state)){
      const target=locked||this.enemies.filter(e=>e.hp>0&&(!this.activeEncounter||this.activeEncounter.ids.includes(e.id))).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
      if(target){const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);if(d>65){p.dragonRush=true;p.attack=null;p.queued=null;p.recovery=0;p.flying=true;p.grounded=false;p.dashTimer=.08;p.vx=dx/d*850;p.vy=dy/d*850;p.dir=sign(dx);p.ki=Math.max(0,p.ki-dt*24);}else{p.dragonRush=false;p.dashTimer=0;}}
    }
    if(pressed.attack&&p.dashTimer>0){p.shortDodging=false;p.dashTimer=0;p.dragonRush=false;p.recovery=0;}

    if(input.guard&&pressed.dash&&p.stun<=0){this.shortDodge(move);pressed.dash=false;pressed.vanish=false;}
    if(this.saiyanCombat&&input.guard&&pressed.vanish){this.defensiveVanish();pressed.vanish=false;}
    if(pressed.vanish&&p.stun<=0&&!['special','genki','transform'].includes(p.state))this.vanishStrike();
    if(!p.charging)p.chargeTime=0;p.charging=false;p.guarding=false;
    if(p.stun>0&&(this.saiyanCombat?guardEdge||pressed.dash&&p.grounded:input.guard||pressed.dash&&p.y>WORLD.ground-30)&&p.counterCooldown<=0&&p.stamina>=14&&p.stateTime>=.055&&(!this.saiyanCombat||p.ki>=25&&p.escapeCooldown<=0)){if(this.saiyanCombat){p.ki-=25;p.escapeCooldown=2;}p.stamina-=14;p.stun=0;p.counterCooldown=.45;p.invincible=.1;p.hurtRecoveryAnim=.18;p.guarding=true;p.guardTime=.24;p.state='guard';pressed.dash=false;this.emit('guardRecovery',{x:p.x,y:p.y-45});}
    else if(p.stun>0&&pressed.attack&&p.counterWindow>0&&p.counterCooldown<=0&&p.stamina>=30&&(!this.saiyanCombat||p.ki>=30&&p.escapeCooldown<=0)){
      if(this.saiyanCombat){p.ki-=30;p.escapeCooldown=2;}
      p.stamina-=30;p.stun=0;p.counterCooldown=1.35;p.counterWindow=0;p.invincible=.32;p.state='counter';p.stateTime=0;p.hurtRecoveryAnim=0;this.freeze=.045;this.emit('counterBurst',{x:p.x,y:p.y-45,dir:p.dir});
      for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<135&&Math.abs(e.y-p.y)<115){e.stun=Math.max(e.stun,.42);e.state='hurt';e.timer=e.stun;e.vx=sign(e.x-p.x)*240;e.combat&&(e.combat.comboQueue=[]);}
    }
    if(p.stun>0&& !p.grounded&&(pressed.dash||pressed.jump)&&p.airRecovery<=0&&p.stamina>=28&&(!this.saiyanCombat||p.ki>=25&&p.escapeCooldown<=0)){
      if(this.saiyanCombat){p.ki-=25;p.escapeCooldown=2;}
      p.stamina-=28;p.stun=0;p.airRecovery=1.2;p.invincible=.3;p.state='dash';p.dashTimer=.16;p.vx=-p.dir*430;p.vy=-175;pressed.dash=false;pressed.jump=false;this.emit('airRecover',{x:p.x,y:p.y-40});
    }
    if(p.stun>0){p.state='hurt';p.vx*=Math.pow(.12,dt);}
    else if(p.state==='genki'&&p.stateTime<1.25){p.vx=0;p.vy=0;if(p.stateTime>=1.1&&!p.specialFired){p.specialFired=true;this.fireGenki();}}
    else if(p.state==='transform' && p.stateTime<.85){p.vx*=Math.pow(.001,dt);p.invincible=.18;}
    else if(p.state==='special' && p.stateTime<.85){
      p.vx*=Math.pow(.001,dt);p.vy=0;
      if(p.stateTime>=.26&&!p.specialFired){p.specialFired=true;this.fireBeam();}
    }
    else {
	      if(['special','transform','genki','counter'].includes(p.state)&&p.stateTime>.2)p.state='idle';
      if(pressed.transform&&p.form&&this.story){p.form=false;p.formTime=0;p.formCooldown=3;this.emit('formEnd');}
      else if(pressed.transform && !p.form){
        if(this.story&&(this.story.chapter===1||!this.skills.has('kaioken')))this.tip('Kaioken disponível após o treinamento com o Senhor Kaio.');
        else if(p.formCooldown>0)this.tip('Kaioken em recuperação.');
        else if(p.ki>=(this.story?60:99.5)){if(this.story)p.ki-=15;p.form=true;p.formTime=this.story?(this.kaiokenLevel===4?8:this.kaiokenLevel===3?10:12):16;p.state='transform';p.stateTime=0;p.attack=null;p.queued=null;p.dashTimer=0;p.diving=false;p.airFloat=0;p.invincible=1.2;this.freeze=.08;this.emit('transform',{x:p.x,y:p.y-45});}
        else this.tip(this.story?'Kaioken precisa de 60 KI.':'Transformação precisa de 100 KI. Acerte ou segure Ctrl para carregar.');
      } else if(pressed.special && p.specialCooldown<=0&&(!this.saiyanCombat||!p.attack)){
        const genki=this.story&&(input.flightMode?input.ultimate:input.charge)&&this.skills.has('genki')&&this.story.chapter>1;const cost=genki?80:this.story?(this.skills.has('kame')?32:40):p.form?28:40;
        if(genki&&p.ki>=cost){p.ki-=cost;p.state='genki';p.stateTime=0;p.attack=null;p.queued=null;p.dashTimer=0;p.diving=false;p.specialFired=false;p.specialCooldown=3;this.emit('genkiCharge',{x:p.x,y:p.y-110});}
        else if(!genki&&p.ki>=cost){p.ki-=cost;p.state='special';p.stateTime=0;p.attack=null;p.queued=null;p.dashTimer=0;p.diving=false;p.airFloat=0;p.specialFired=false;p.specialCooldown=1.3;p.invincible=this.saiyanCombat?0:.6;this.specials++;this.emit('specialCharge',{x:p.x,y:p.y-45});}
        else this.tip(genki?'Genki Dama precisa de 80 KI.':'Energia insuficiente. Segure CARGA para recuperar KI.');
      } else if(pressed.dash&&p.chainWindow>0&&p.vanishCooldown<=0&&p.ki>=15&&this.vanishStrike()) {
      // Aerial pursuit consumes the dash edge and keeps the new attack active.
	      } else if(pressed.dash&&p.dashCooldown<=0&&p.stamina>=16){
	        p.stamina-=16;
        p.shortDodging=false;p.state='dash';p.stateTime=0;p.dashTimer=.19;p.dashCooldown=this.story&&this.skills.has('guard')?.48:.65;p.invincible=.26;p.attack=null;p.queued=null;p.diving=false;
        if(move)p.dir=sign(move);p.vx=p.dir*(p.form?900:790);p.vy*=.25;this.emit('dash',{x:p.x,y:p.y-35,dir:p.dir});
      } else if(p.dragonRush){p.state='dash';p.dashTimer=.08;} else if(p.dashTimer>0&&(!input.guard||p.shortDodging)){p.dashTimer-=dt;p.state='dash';p.vx=p.shortDodging?p.dodgeDirection*310:p.dir*(p.form?900:790);p.vy*=.8;if(p.dashTimer<=0){p.shortDodging=false;p.vx*=.3;}}
      else{
	        if(input.guard&&!(p.riposteWindow>0&&pressed.attack)&&p.guardMeter>0&&(this.saiyanCombat||!p.attack||p.attack.connected||p.attack.t>p.attack.move.end)){p.attack=null;p.queued=null;p.dashTimer=0;p.guarding=true;p.guardTime+=dt;p.state='guard';p.vx=move*60;if(move)p.dir=sign(move);}
        else if(input.charge&&!input.dragonDash&&!input.attack&&!input.blast&&!p.attack){
          p.charging=!p.form&&p.chargeLock<=0;p.state=p.charging?'charge':'idle';p.vx=0;p.vy=0;
          if(p.charging){p.chargeTime+=dt;if(p.chargeTime>.3)p.ki=clamp(p.ki+(this.story&&this.skills.has('ki')?40:30)*dt,0,100);}
          if(p.ki>=100&&p.kiReady!==true){p.kiReady=true;this.emit('ready');this.tip('100 KI · Aperte T para despertar!');}
        } else {
          p.guardTime=0;
	          const flyingInput=!p.grounded&&(input.flightMode||input.up||input.down)&&p.stamina>0;if(flyingInput){p.flying=true;p.flightGrace=.22;}else if(p.flightGrace<=0)p.flying=false;
	          const speed=(p.form?(this.story?300+this.kaiokenLevel*8:306):266)*(p.attack?.68:1)*(p.flying?1.18:1);
	          const target=move*speed;
	          p.vx+=(target-p.vx)*Math.min(1,dt*(p.grounded?20:9));
	          if(p.flying&&!p.attack){const targetVy=input.up||input.ascend?-285:input.down?285:0;p.vy+=(targetVy-p.vy)*Math.min(1,dt*12);p.stamina=Math.max(0,p.stamina-dt*(input.up||input.down?10:4));p.airFloat=.16;}
          if(move&&!p.attack)p.dir=sign(move);
          if(!p.attack&&p.recovery<=0&&(input.attack||pressed.attack||technique||slam))this.beginAttack(slam?'slam':technique?'launch':'normal');
          if((pressed.blast||input.blast)&&p.blastCooldown<=0&&!p.attack){
            if(p.ki>=(p.form?7:12)){p.ki-=p.form?7:12;p.blastCooldown=.38;p.state='blast';p.stateTime=0;this.fireBlast();}
            else if(pressed.blast)this.tip('Sem KI. Acerte golpes ou segure Ctrl para carregar.');
          }
          if(!p.attack&&!(p.state==='blast'&&p.stateTime<.22))p.state=Math.abs(p.vx)>35?'run':'idle';
        }
        if(p.jumpBuffer>0&&!p.charging&&(p.coyote>0||p.jumps<2)){
          p.jumps=p.coyote>0?1:p.jumps+1;p.vy=p.jumps===1?-558:-500;p.grounded=false;p.coyote=0;p.jumpBuffer=0;
          p.state=p.attack?'attack':'jump';this.emit('jump',{x:p.x,y:p.y,second:p.jumps===2});
        }
        if(pressed.jumpRelease&&p.vy< -180)p.vy*=.57;
      }
    }
    if(!p.guarding)p.guardTime=0;
    if(p.attack){
      p.attack.t+=dt;const a=p.attack,m=a.move;p.state='attack';
      if(a.t>=m.active&&a.t<=m.end){
        for(const e of this.enemies){
          if(e.hp<=0||a.hit.has(e.id))continue;
	          const hitbox=this.playerAttackBox(),hurtbox=this.enemyHurtbox(e);
	          if(rectsOverlap(hitbox,hurtbox)){
            a.hit.add(e.id);const hit=this.hitEnemy(e,m.damage*(this.story&&this.skills.has('combo')?1.15:1)*(p.form?(this.story?1.25+this.kaiokenLevel*.18:1.4):1)*(a.perfect?1.25:1),m.knock,p.dir,{finisher:this.saiyanCombat?!!m.finisher:p.grounded&&a.step>=2,launch:a.kind==='launch'||!this.saiyanCombat&&p.form&&a.step===3,slam:a.kind==='slam',aerial:!p.grounded,perfect:a.perfect,style:m.effect,hitstunFrames:this.saiyanCombat?m.hitstunFrames:undefined});
            if(hit&&e.combat?.justBroke){a.connected=false;p.airChain=0;p.airFloat=0;continue;}
            if(hit){a.connected=true;p.chainTarget=e.id;if(a.step>=2)p.chainWindow=1.1;if(this.saiyanCombat)this.emit('saiyanImpact',{x:e.x-p.dir*e.w*.3,y:e.y-e.h*.55,dir:p.dir,style:m.effect,heavy:!!m.finisher});}
            if(hit&&a.kind==='launch'&&this.canJuggleEnemy(e)){p.vy=-510;p.grounded=false;p.jumps=1;p.airChain=0;p.chainTarget=e.id;p.chainWindow=1.4;this.emit('launcher',{x:e.x,y:e.y-45});}
            else if(hit&&a.kind==='slam'){p.vy=700;p.diving=true;}
            else if(hit&&!p.grounded&&this.canJuggleEnemy(e)){if(!a.aerialCounted){p.airChain++;this.airHits++;a.aerialCounted=true;}p.chainTarget=e.id;p.chainWindow=1.1;if(p.airChain>=4){e.vy=750;e.slam=true;e.launchTime=0;e.stun=.6;p.vy=-100;p.airFloat=0;e.airFloat=0;p.chainWindow=0;this.emit('aerialFinish',{x:e.x,y:e.y-40});}else{p.vy=-110;e.vy=-110;p.airFloat=.52;e.airFloat=.52;e.launchTime=.62;}}
          }
        }
      }
	      if(a.t>=m.duration||p.queued&&a.connected&&canCancel(a,p.queued.kind==='normal'?(p.grounded?'light':'air'): 'air')){const queued=p.queued;p.attack=null;p.queued=null;p.state='idle';p.recovery=queued?0:.045;if(queued)this.beginAttack(queued.kind,queued.perfect);}
    }
    const prevY=p.y,prevX=p.x;
	    if(!['special','genki','charge'].includes(p.state)&&!p.dragonRush)p.vy+=WORLD.gravity*dt*(p.flying&&!p.diving&&p.stun<=0?(input.flightMode?0:.06):p.airFloat>0&&!p.diving&&p.stun<=0?.3:1);
    const ceiling=this.saiyanCombat?174:82;
    p.x=clamp(p.x+p.vx*dt,this.saiyanCombat?96:40,WORLD.width-(this.saiyanCombat?96:90));if(this.activeEncounter)p.x=clamp(p.x,this.activeEncounter.left+22,this.activeEncounter.right-22);p.y=Math.max(ceiling,p.y+p.vy*dt);if(p.y===ceiling&&p.vy<0)p.vy=0;
    p.wasGrounded=p.grounded;p.grounded=false;
    // Sweep the horizontal movement so dashes cannot tunnel through rubble.
    if(this.arrival||this.episode)for(const r of this.rocks){
      if(r.broken)continue;
      const half=p.w*.4,left=r.x-r.w,right=r.x+r.w,top=r.y-r.h;
      if(prevY>top+1&&prevY-p.h<r.y){
        if(prevX+half<=left&&p.x+half>left){p.x=left-half;p.vx=0;}
        else if(prevX-half>=right&&p.x-half<right){p.x=right+half;p.vx=0;}
        else if(p.x+half>left&&p.x-half<right){p.x=prevX<r.x?left-half:right+half;p.vx=0;}
      }
    }
    if(p.vy>=0){
      let landing=WORLD.ground;
      if(this.arrival||this.episode)for(const r of this.rocks)if(!r.broken&&p.x+p.w*.4>r.x-r.w&&p.x-p.w*.4<r.x+r.w&&prevY<=r.y-r.h+1&&p.y>=r.y-r.h)landing=Math.min(landing,r.y-r.h);
      for(const platform of this.platforms){if(p.x+p.w*.4>platform.x&&p.x-p.w*.4<platform.x+platform.w&&prevY<=platform.y+5&&p.y>=platform.y)landing=Math.min(landing,platform.y);}
	      if(p.y>=landing){p.y=landing;p.vy=0;p.grounded=true;p.flying=false;p.flightGrace=0;p.jumps=0;p.airChain=0;p.airFloat=0;if(!p.wasGrounded)this.emit('land',{x:p.x,y:p.y});if(p.diving){p.diving=false;this.emit('groundFinish',{x:p.x,y:p.y});for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<120&&Math.abs(e.y-p.y)<70)this.hitEnemy(e,p.form?30:18,240,sign(e.x-p.x),{finisher:true,slam:true});}}
    }
    if(!p.grounded&&!p.attack&&!['special','genki','transform','dash','hurt','blast','charge'].includes(p.state))p.state=p.vy<0?'jump':'fall';
    if(p.grounded&&Math.abs(p.vx)>100&&!p.attack){p.steps+=Math.abs(p.vx)*dt;if(p.steps>65){p.steps=0;this.emit('step',{x:p.x,y:p.y});}}
    if(p.ki<99)p.kiReady=false;
  }
  playerHurtbox(){const p=this.p;return{x:p.x-p.w*.42,y:p.y-p.h,w:p.w*.84,h:p.h};}
  enemyHurtbox(e){return{x:e.x-e.w*.42,y:e.y-e.h,w:e.w*.84,h:e.h};}
  playerAttackBox(){const p=this.p,a=p.attack,m=a?.move||PLAYER_MOVES.light1;return{x:p.dir>0?p.x-18:p.x-m.reach-18,y:p.y-p.h*.82,w:m.reach+36,h:p.grounded?p.h*.72:p.h*.9};}
  getDebugSnapshot(){return{player:{state:this.p.state,phase:movePhase(this.p.attack),frame:moveFrame(this.p.attack),hurtbox:this.playerHurtbox(),hitbox:this.p.attack?this.playerAttackBox():null,stamina:this.p.stamina,guard:this.p.guardMeter},enemies:this.enemies.filter(e=>e.hp>0).map(e=>({id:e.id,state:e.state,intent:e.combat?.intent||'idle',distance:Math.round(Math.abs(e.x-this.p.x)),hp:e.hp,ki:e.combat?.ki||0,stamina:e.combat?.stamina||0,guard:e.combat?.guardMeter||e.guard,hurtbox:this.enemyHurtbox(e)}))};}
  beginAttack(kind='normal',perfect=false){
    const p=this.p;if(p.riposteWindow>0){perfect=true;p.riposteWindow=0;p.guarding=false;}if(kind==='slam'&&p.grounded)kind='launch';
    let step=this.time-p.lastAttack<.95?(p.comboStep+1)%(this.saiyanCombat?5:p.form?4:3):0;
    const aerial=!p.grounded;
    const move=this.saiyanCombat?saiyanMove(kind,step,aerial):kind==='launch'?LAUNCH:kind==='slam'?DIVE:aerial?(step%2?PLAYER_MOVES.airFollow:AIR):MOVES[step];
    if(this.saiyanCombat&&move.kiCost){if(p.ki<move.kiCost){this.tip('ELEVAR precisa de 14 KI.');return false;}p.ki-=move.kiCost;}
    p.comboStep=step;p.lastAttack=this.time;p.lastMove=kind;p.attack={step,t:0,hit:new Set(),kind,move,perfect};p.state='attack';p.stateTime=0;
    if(perfect){this.perfects++;p.ki=clamp(p.ki+4,0,100);p.perfectFlash=.45;this.emit('perfect',{x:p.x,y:p.y-90});}
    if(kind==='slam'){p.vy=620;p.diving=true;}
    const target=this.enemies.filter(e=>e.hp>0&&Math.abs(e.x-p.x)<155&&Math.abs(e.y-p.y)<115).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(target)p.dir=sign(target.x-p.x);
    p.vx+=p.dir*(step>=2?155:85);
    for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<230)e.observed++;
    this.emit('swing',{step,x:p.x,y:p.y-45,dir:p.dir,kind,style:this.saiyanCombat?move.effect:null});
  }
  shortDodge(direction=0){
    const p=this.p;
    if(p.stun>0||p.dashCooldown>0||p.stamina<16||['special','genki','transform'].includes(p.state))return false;
    p.stamina-=16;p.attack=null;p.queued=null;p.diving=false;p.dragonRush=false;p.guarding=false;
    p.shortDodging=true;p.dodgeDirection=direction||-p.dir;p.dashTimer=.14;p.dashCooldown=.42;p.invincible=.1;
    p.state='dash';p.stateTime=0;p.vx=p.dodgeDirection*310;p.vy*=.25;
    this.emit('dodge',{x:p.x,y:p.y-40,dir:p.dodgeDirection});return true;
  }
  defensiveVanish(){
    const p=this.p;
    const threat=this.enemies.find(e=>e.hp>0&&e.state==='windup'&&e.timer>0&&e.timer<=.14&&Math.abs(e.x-p.x)<190&&Math.abs(e.y-p.y)<125);
    const shot=this.shots.find(s=>s.owner==='enemy'&&Math.abs(s.y-(p.y-45))<55&&(p.x-s.x)*s.vx>0&&Math.abs(s.x-p.x)/Math.abs(s.vx)<=.14);
    if(p.stun>0||p.ki<20||p.vanishCooldown>0||p.escapeCooldown>0||['special','genki','transform'].includes(p.state))return false;
    p.ki-=20;p.vanishCooldown=1.4;
    if(!threat&&!shot){p.recovery=.2;this.tip('Teleporte cedo demais · -20 KI');return false;}
    const fromX=p.x,fromY=p.y,source=threat?.x??shot.x;
    const arena=this.activeEncounter;p.x=clamp(p.x+sign(p.x-source)*135,arena?arena.left+25:96,arena?arena.right-25:WORLD.width-96);
    p.invincible=.22;p.attack=null;p.queued=null;p.dashTimer=0;p.vx=0;p.vy=0;p.state='idle';p.stateTime=0;p.recovery=.12;
    this.emit('vanish',{fromX,fromY,x:p.x,y:p.y-40});return true;
  }
  vanishStrike(){
    const p=this.p;if(p.ki<15||p.vanishCooldown>0){if(p.ki<15)this.tip('Perseguição precisa de 15 KI.');return false;}
    const candidates=this.enemies.filter(e=>e.hp>0&&Math.abs(e.x-p.x)<390&&Math.abs(e.y-p.y)<290&&(!this.activeEncounter||this.activeEncounter.ids.includes(e.id)));
    const target=candidates.find(e=>e.id===p.chainTarget)||candidates.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(!target)return false;
    const fromX=p.x,fromY=p.y;p.ki-=15;p.vanishCooldown=1.1;p.invincible=.22;p.attack=null;p.queued=null;p.dashTimer=0;p.diving=false;
    p.x=clamp(target.x-p.dir*56,this.activeEncounter?this.activeEncounter.left+25:40,this.activeEncounter?this.activeEncounter.right-25:WORLD.width-90);
    p.y=clamp(target.y,this.saiyanCombat?174:85,WORLD.ground);p.dir=sign(target.x-p.x);p.vx=0;p.vy=target.grounded?0:clamp(target.vy,-500,100);p.airFloat=target.airFloat||0;p.grounded=target.grounded;p.jumps=p.grounded?0:1;p.recovery=0;p.chainWindow=0;
    this.beginAttack('normal');p.attack.perfect=true;this.emit('vanish',{fromX,fromY,x:p.x,y:p.y-40});this.freeze=.04;return true;
  }
  fireBlast(){
    const p=this.p;this.shots.push({x:p.x+p.dir*48,y:p.y-48,vx:p.dir*630,vy:0,r:p.form?12:8,damage:p.form?33:25,owner:'player',life:1.4,trail:[],gold:p.form});
    this.emit('blast',{x:p.x+p.dir*48,y:p.y-48,gold:p.form});
  }
  fireBeam(){
    const p=this.p;
    if(p.form&&!this.story){
      this.emit('solarBurst',{x:p.x,y:p.y-48});this.freeze=.1;
      for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-p.x,(e.y-e.h*.5)-(p.y-48))<300)this.hitEnemy(e,160,460,sign(e.x-p.x),{beam:true,finisher:true,launch:e.type!==2});
      for(const d of [-1,1])this.shots.push({x:p.x+d*48,y:p.y-40,vx:d*690,vy:0,r:16,damage:50,owner:'player',life:.8,trail:[],gold:true});
      this.shots=this.shots.filter(s=>s.owner==='player'||Math.abs(s.x-p.x)>350);return;
    }
    this.emit('beam',{x:p.x+p.dir*37,y:p.y-46,dir:p.dir,gold:false,kaioken:!!this.story&&p.form});this.freeze=.065;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const dx=(e.x-p.x)*p.dir,dy=Math.abs(e.y-e.h*.48-(p.y-46));
      if(dx>-45&&dx<800&&dy<e.h*.55+25)this.hitEnemy(e,(this.skills.has('kame')&&this.story?144:115)*(p.form?(this.story?1.25+this.kaiokenLevel*.18:1.4):1),580,p.dir,{beam:true,finisher:true});
    }
    this.shots=this.shots.filter(s=>s.owner==='player'||Math.sign(s.x-p.x)!==p.dir);
  }
  hitEnemy(e,damage,knock,dir,options={}){
    if(e.hp<=0)return false;
    this.combatAI.ensure(e).justBroke=false;
    if(e.invincible>0&&!options.beam)return false;
    if(e.state==='evade'&&e.timer>.08&&!options.beam)return false;
    const frontal=(this.p.x-e.x)*e.dir> -15;
    if(e.state==='guard'&&frontal&&!options.launch&&!options.slam&&!options.beam){
      const combat=this.combatAI.ensure(e);combat.guardMeter-=options.finisher||options.perfect?65:24;e.guard=combat.guardMeter;
      if(combat.guardMeter>0){e.flash=.07;e.blockstun=(options.finisher?16:10)/60;e.timer=Math.max(e.timer,e.blockstun);e.vx=dir*30;this.emit('enemyGuard',{x:e.x-e.dir*30,y:e.y-45});return false;}
      e.state='hurt';e.stun=.85;e.timer=.85;e.defenseCooldown=3;this.emit('guardBreak',{x:e.x,y:e.y-60});damage*=1.2;
    }
    damage=Math.round(damage*Math.max(.55,1-Math.max(0,this.combo-5)*.035)*(this.saiyanCombat&&e.storyBoss==='nappa'?.78:1));
    if(e.storyBoss&&!this.versus){let gate=0;if(e.storyBoss==='vegeta')gate=e.phase===1?.65:e.phase===2?.28:0;else if(e.storyBoss==='zarbon')gate=!this.seenScenes.has('transform')?.55:!this.seenScenes.has('assist')?.35:0;else if(e.storyBoss==='freeza')gate=!this.seenScenes.has('transform')?.68:!this.seenScenes.has('assist')?.32:0;else gate=!this.seenScenes.has('assist')?.45:0;if(gate)damage=Math.min(damage,Math.max(0,e.hp-(Math.floor(e.maxHp*gate)-1)));if(damage<=0)return false;}
    e.hp=Math.max(0,e.hp-damage);e.flash=.065;const contactKind=setReaction(e,options,dir);
    if(options.finisher&&e.grounded&&!options.launch)this.groundImpact(e.x,e.y);
    const boss=e.type===2;
    e.vx=dir*knock*(boss?(this.saiyanCombat&&this.canJuggleEnemy(e)?(e.storyBoss==='nappa'?.65:1):.2):1);
    const scaling=Math.max(.55,1-Math.max(0,this.combo-4)*.045),baseHitstun=(options.hitstunFrames??(options.launch?32:options.slam?30:options.finisher?27:18))/60;
    if(!boss||e.state!=='windup'||options.beam||this.saiyanCombat&&(e.storyBoss!=='nappa'||options.finisher||options.launch)){e.stun=Math.max(e.stun,baseHitstun*scaling);e.hitstun=e.stun;e.state='hurt';e.timer=e.stun;}
    if(options.launch&&this.canJuggleEnemy(e)){e.vy=-595;e.grounded=false;e.launchTime=.9;e.stun=.72;e.state='juggle';e.wallBounces=0;e.groundBounces=0;}
    else if(options.slam&&this.canJuggleEnemy(e)){e.vy=780;e.slam=true;e.launchTime=0;e.stun=.6;e.grounded=false;}
    else if(options.finisher&&!boss){e.vy=-215;e.grounded=false;}
    this.combo++;this.comboTime=2.2;this.maxCombo=Math.max(this.maxCombo,this.combo);
    this.p.ki=clamp(this.p.ki+(options.beam?0:options.finisher?10:this.story&&this.skills.has('combo')?8:6),0,100);
    this.freeze=Math.max(this.freeze,options.beam?.065:options.perfect?Math.max(.045,impactPause(contactKind)):impactPause(contactKind));
    this.emit('hit',{x:e.x-dir*e.w*.3,y:e.y-e.h*.55,damage:Math.round(damage),heavy:!!options.finisher,dir,gold:this.p.form,perfect:options.perfect});
    if(e.hp<=0){
      e.state='dead';e.dead=.65;e.stun=0;e.vx=dir*180;this.kills++;
      this.p.ki=clamp(this.p.ki+8,0,100);this.p.hp=Math.min(this.maxHp,this.p.hp+(boss?45:7));
      this.emit('defeat',{x:e.x,y:e.y-e.h*.4,boss});
      if(e.orb)this.orbs.push({x:e.x,y:WORLD.ground-32,id:e.orb,got:false,t:0});
      if(boss){this.bossDefeated=true;if(this.story)this.emit('toast',{text:this.story.bossName+' VENCIDO · Reúna as esferas e siga até a saída.'});else this.emit('zone',{title:this.stageId===2?'RAZEK DERROTADO':'GUARDIÃO DERROTADO',subtitle:this.collected<6?'Reúna as esferas que faltam.':'A última esfera é sua. Siga até o portal.'});}
    }else this.registerEnemyPressure(e,options);
    return true;
  }
  registerEnemyPressure(e,options={}){
    if(e.creature)return false;
    const c=this.combatAI.ensure(e);c.pressureHits=c.pressureTime>0?c.pressureHits+1:1;c.pressureTime=1.2;
    const repeated=this.combatAI.sameAttackCount>=2||!this.p.grounded&&this.p.lastMove==='normal';
    const veteran=e.type===2||e.maxHp>=180||!!e.storyBoss,threshold=this.saiyanCombat?(e.storyBoss==='nappa'?7:6):repeated?(veteran?2:3):(veteran?5:7);
    if(this.saiyanCombat&&c.ki<30)return false;
    if(options.beam||options.finisher||options.slam||c.breakerCooldown>0||c.stamina<35||c.pressureHits<threshold)return false;
    if(this.saiyanCombat)c.ki-=30;
    c.justBroke=true;c.pressureHits=0;c.pressureTime=0;c.breakerCooldown=veteran?1.8:2.7;c.stamina-=35;c.comboQueue=[];e.stun=0;e.hitstun=0;e.launchTime=0;e.airFloat=0;e.slam=false;
    this.combo=0;this.comboTime=0;this.p.chainWindow=0;this.p.queued=null;
    const arena=this.encounters.find(a=>a.ids.includes(e.id));
    if(this.saiyanCombat&&e.storyBoss==='nappa'){e.state='windup';e.attackKind='counter';e.vx=0;this.p.vx=sign(this.p.x-e.x)*260;e.timer=.4;}
    else{this.enemyVanish(e,arena,'counter');e.timer=veteran?.14:.19;}
    e.windupDuration=e.timer;e.invincible=Math.max(e.invincible,.3);
    if(e.type===2)c.comboQueue=['finisher'];
    this.emit('enemyBreaker',{x:e.x,y:e.y-e.h*.55,boss:e.type===2,repeated});return true;
  }
  hitPlayer(damage,sourceX,knock=220,unblockable=false,options={}){
    const p=this.p;if(p.invincible>0||p.hp<=0)return false;
    const dir=sign(p.x-sourceX);
    if(p.guarding&&!unblockable&&(sourceX-p.x)*p.dir> -15){
      if(p.guardTime<(this.saiyanCombat?(this.skills.has('guard')?.15:.12):(this.story&&this.skills.has('guard')?.29:.2))&&(!this.saiyanCombat||p.parryCooldown<=0)){
        if(this.saiyanCombat)p.parryCooldown=.45;
        this.parries++;p.ki=clamp(p.ki+16,0,100);p.invincible=.22;p.riposteWindow=.45;this.freeze=.055;
        this.emit('parry',{x:p.x+p.dir*30,y:p.y-45});this.tip('APARO PERFEITO · +16 KI');
        const attacker=this.enemies.find(e=>e.hp>0&&Math.abs(e.x-sourceX)<10);if(attacker){attacker.stun=.55;attacker.state='hurt';attacker.timer=.55;attacker.combat&&(attacker.combat.comboQueue=[]);}
      }else{p.guardMeter=Math.max(0,p.guardMeter-(options.heavy?42:22));p.hp=Math.max(1,p.hp-Math.ceil(damage*.12));p.vx=dir*70;p.invincible=.12;if(p.guardMeter<=0){p.stun=.8;p.guarding=false;p.state='hurt';this.emit('playerGuardBreak',{x:p.x,y:p.y-48});}else this.emit('guard',{x:p.x+p.dir*28,y:p.y-43});}
      return false;
    }
    if(options.combo){p.incomingCombo=p.incomingComboTime>0?p.incomingCombo+1:1;p.incomingComboTime=1.15;damage=Math.round(damage*Math.max(.55,1-(p.incomingCombo-1)*.16));}
    if(p.charging){p.ki=Math.max(0,p.ki-8);p.charging=false;p.chargeTime=0;p.chargeLock=.6;this.emit('chargeBreak',{x:p.x,y:p.y-45});}
    p.hp=Math.max(0,p.hp-damage);this.damageTaken+=damage;p.vx=dir*knock;p.vy=-145;
    p.stun=(options.hitstunFrames||18)/60;p.lastHitstun=p.stun;p.counterWindow=.22;p.invincible=options.combo?.075:.24;p.state='hurt';p.stateTime=0;p.attack=null;p.queued=null;p.dashTimer=0;p.diving=false;this.combo=0;
    if(options.launch){p.vy=-520;p.grounded=false;}else if(options.slam){p.vy=690;p.grounded=false;}
    const contactKind=setReaction(p,options,dir);this.freeze=Math.max(this.freeze,impactPause(contactKind));this.emit('playerHit',{x:p.x,y:p.y-45,dir,heavy:!!options.heavy});
    if(options.counter)this.emit('counterHit',{x:p.x,y:p.y-50});
    if(p.hp<=0){this.mode='dead';this.emit('gameover');}
    return true;
  }
  enemyVanish(e,arena,kind='counter'){
    const p=this.p,c=this.combatAI.ensure(e),fromX=e.x,fromY=e.y;
    e.x=clamp(p.x-p.dir*58,arena?arena.left+35:60,arena?arena.right-35:WORLD.width-120);e.y=clamp(p.y,88,WORLD.ground);e.vx=0;e.vy=p.vy*.35;e.grounded=p.grounded;e.invincible=.2;c.flight=!p.grounded;c.flightGrace=.7;e.dir=sign(p.x-e.x);e.state='windup';e.attackKind=kind;e.timer=.1;e.windupDuration=.1;e.defenseCooldown=.65;c.cancelCooldown=.7;
    this.emit('enemyVanish',{fromX,fromY,x:e.x,y:e.y-45});
  }
  queueEnemyCombo(e,boss,air=false){
    const c=this.combatAI.ensure(e);c.comboHits=0;c.flight=air;c.flightGrace=air?.9:0;
    e.attackKind=air?'airStrike':'strike';c.comboQueue=air?['finisher']:(boss?['strike','launcher','airStrike','finisher']:['launcher','finisher']);
    if(e.storyBoss==='freeza'){e.attackKind='launcher';c.comboQueue=['airStrike','finisher'];}
    if(this.saiyanCombat&&e.storyBoss&&e.storyBoss!=='freeza'){c.comboQueue=e.storyBoss==='nappa'?['finisher']:e.storyBoss==='raditz'?['strike']:['strike','launcher','airStrike','finisher'];}
    e.state='windup';e.timer=this.saiyanCombat&&e.storyBoss==='nappa'?.48:this.saiyanCombat&&e.storyBoss==='raditz'?.14:air?.11:boss?.2:.24;e.windupDuration=e.timer;e.attackDid=false;this.emit('tell',{x:e.x,y:e.y-e.h-17,boss,combo:true});
  }
  enemyMelee(e,boss){
    const p=this.p,c=this.combatAI.ensure(e),kind=e.attackKind,air=['airStrike','finisher'].includes(kind)||c.flight;
    if(air){e.x+=sign(p.x-e.x)*Math.min(54,Math.abs(p.x-e.x)*.55);e.y+=clamp(p.y-e.y,-42,42);e.dir=sign(p.x-e.x);}
    const dist=Math.abs(p.x-e.x),vertical=Math.abs(p.y-e.y),reach=kind==='finisher'?145:kind==='launcher'?132:air?138:122;
    const options={style:kind==='airStrike'?'kick':'jab',hitstunFrames:kind==='counter'?24:kind==='launcher'?22:kind==='finisher'?25:15,launch:kind==='launcher',slam:kind==='finisher',heavy:['counter','launcher','finisher'].includes(kind),combo:true};
    const landed=(p.x-e.x)*e.dir>-28&&dist<reach&&vertical<(air?125:98)&&this.hitPlayer(((boss?21:e.maxHp>=160?18:14)+(kind==='finisher'?7:0))*(this.saiyanCombat&&e.storyBoss==='nappa'?1.45:this.saiyanCombat&&e.storyBoss==='raditz'?.8:1),e.x,kind==='finisher'?380:kind==='launcher'?285:230,false,{...options,counter:kind==='counter'});
    e.attackDid=!!landed;if(landed){c.comboHits++;if(kind==='launcher'){e.vy=-500;e.grounded=false;c.flight=true;c.flightGrace=1;p.flying=true;p.flightGrace=.45;}else if(kind==='airStrike'){e.vy=-70;p.vy=-85;p.flying=true;p.flightGrace=.25;}else if(kind==='finisher'){c.flight=false;c.flightGrace=0;}}
    this.emit('enemySwing',{x:e.x+e.dir*50,y:e.y-45,dir:e.dir,kind});return landed;
  }
  updateEnemy(e,dt){
    if(e.creature){updateCoastalCreature(this,e,dt);return;}
    tickReaction(e,dt);e.moveCycle+=dt;e.flash=Math.max(0,e.flash-dt);e.invincible=Math.max(0,e.invincible-dt);e.cooldown-=dt;e.timer-=dt;e.defenseCooldown-=dt;e.launchTime=Math.max(0,e.launchTime-dt);e.airFloat=Math.max(0,e.airFloat-dt);
    if(e.hp<=0){e.dead=Math.max(0,e.dead-dt);const previousX=e.x;e.x+=e.vx*dt;if(e.dead>0)this.breakRocks({...e,stun:1},previousX);e.vx*=Math.pow(.02,dt);return;}
    if(e.storyBoss&&this.updateStoryBoss(e))return;
    const beforeX=e.x;
    const p=this.p,dx=p.x-e.x,dist=Math.abs(dx),vertical=Math.abs(p.y-e.y),boss=e.type===2;
    const arena=this.encounters.find(a=>a.ids.includes(e.id));
    if(arena&&!arena.active&&!arena.cleared&&e.hp===e.maxHp){e.state='idle';e.vx=0;return;}
    const intent=this.combatAI.decide(this,e,dt),combat=this.combatAI.ensure(e),reactive=this.combatAI.reactiveCancel(this,e);
    if(reactive==='vanish')this.enemyVanish(e,arena,'counter');
    else if(reactive){e.state='guard';e.timer=reactive==='counterGuard'?.24:.42;e.vx=0;e.vy*=.35;e.guard=combat.guardMeter;e.defenseCooldown=.55;this.emit('enemyDefend',{x:e.x,y:e.y-e.h-10,cancel:true});}
    if(e.stun>0||e.launchTime>0){e.stun=Math.max(0,e.stun-dt);e.state=e.launchTime>0?'juggle':'hurt';e.x+=e.vx*dt;e.vx*=Math.pow(.02,dt);}
    else if(e.state==='guard'){
      e.dir=sign(dx);e.vx=0;
      if(e.timer<=0){if(dist<155&&vertical<125){e.state='windup';e.attackKind='counter';e.timer=.12;e.windupDuration=.12;this.emit('tell',{x:e.x,y:e.y-e.h-18,counter:true});}else if(combat.flight){e.state='flight';e.timer=.2;}else{e.state='retreat';e.timer=.28;e.vx=-e.dir*190;}e.defenseCooldown=.7;}
    }
    else if(e.state==='evade'||e.state==='retreat'){
      e.x+=e.vx*dt;if(combat.flight)e.y+=e.vy*dt;
      if(e.timer<=0){e.state=combat.flight?'flight':'recover';e.timer=.18;e.vx=0;}
    }
    else if(e.state==='feint'){
      e.vx=0;
      if(e.timer<=0){e.state='guard';e.timer=.24;e.guard=combat.guardMeter;this.emit('enemyDefend',{x:e.x,y:e.y-e.h-10});}
    }
    else if(e.state==='windup'){
      e.vx=0;
      if(e.timer<=0){
        e.state='attack';e.timer=boss?.26:.2;e.attackDid=false;
        if((e.storyBoss||this.versus)&&['double','eruption','galick','versusSpecial'].includes(e.attackKind)){this.fireStoryBoss(e);}
        else if(e.saiyan&&e.attackKind==='rush'){
          e.timer=boss?.38:.28;e.attackDid=false;e.vx=e.dir*(boss?540:440);this.emit('enemyEvade',{x:e.x,y:e.y-35});
        }else if(e.type===1||e.saiyan&&e.attackKind==='volley'){
          const targetY=e.aimY,sy=e.y-54,spread=e.saiyan?(boss?.14:.09):0;
          const angle=Math.atan2(targetY-sy,e.aimX-e.x);const n=boss?(e.phase===2?5:3):e.saiyan?2:1;
          for(let i=0;i<n;i++)this.shots.push({x:e.x+e.dir*36,y:sy,vx:Math.cos(angle+spread*(i-(n-1)/2))*300,vy:Math.sin(angle+spread*(i-(n-1)/2))*300,r:boss?12:9,damage:e.saiyan?14:17,owner:'enemy',life:2.6,trail:[]});
          this.emit('enemyBlast',{x:e.x,y:sy});
        }else if(boss&&['sweep','slam'].includes(e.attackKind)){
          if(e.attackKind==='sweep'){
            e.x+=e.dir*80;this.emit('enemySwing',{x:e.x+e.dir*60,y:e.y-70,dir:e.dir});
            if(Math.abs(p.x-e.x)<158&&vertical<105)this.hitPlayer(27,e.x,400);
          }else{
            this.emit('slam',{x:e.x+e.dir*55,y:WORLD.ground});
            if(dist<147&&vertical<110)this.hitPlayer(e.phase===2?32:27,e.x,420);
            for(const d of [-1,1])this.shots.push({x:e.x+d*75,y:WORLD.ground-13,vx:d*(e.phase===2?340:260),vy:0,r:14,damage:20,owner:'enemy',life:1.7,trail:[],wave:true});
          }
          this.freeze=.055;
        }else this.enemyMelee(e,boss);
      }
    }
    else if(e.state==='attack'){
      if(e.saiyan&&e.attackKind==='rush'){e.x+=e.vx*dt;const reach=boss?110:82;if(!e.attackDid&&(p.x-e.x)*e.dir>-25&&Math.abs(p.x-e.x)<reach&&vertical<105){e.attackDid=this.hitPlayer(boss?26:18,e.x,330,false,{hitstunFrames:22});this.emit('enemySwing',{x:e.x+e.dir*40,y:e.y-45,dir:e.dir});}}
      if(e.timer<=0){if(this.saiyanCombat&&e.storyBoss==='raditz'&&e.attackDid&&!combat.comboQueue.length&&combat.stamina>=12){combat.stamina-=12;e.state='retreat';e.timer=.26;e.vx=-e.dir*420;e.cooldown=.55;return;}const next=e.attackDid?combat.comboQueue.shift():null;if(next){e.attackKind=next;e.state='windup';e.timer=this.saiyanCombat&&e.storyBoss==='nappa'?.3:next==='airStrike'?.08:next==='finisher'?.11:.12;e.windupDuration=e.timer;e.attackDid=false;e.invincible=.045;if(['airStrike','finisher'].includes(next)){combat.flight=true;combat.flightGrace=.8;}this.emit('enemyComboCancel',{x:e.x,y:e.y-45,kind:next});}else{combat.comboQueue=[];e.state=combat.flight&&combat.flightGrace>0?'flight':'recover';e.vx=0;e.timer=this.saiyanCombat&&e.storyBoss==='nappa'?.65:this.saiyanCombat&&e.storyBoss==='raditz'?.2:boss?.3:.24;}}
    }
    else if(e.state==='recover'){
      if(e.timer<=0){e.state=combat.flight?'flight':'chase';e.cooldown=boss?.12:.18+this.random()*.18;}
    }
    else if(e.state==='flight'&&(!intent||intent==='airChase')){
      combat.flight=true;combat.flightGrace=.5;e.grounded=false;e.dir=sign(dx);const targetY=clamp(p.y+(e.id%2?24:-18),92,WORLD.ground-36),targetVx=clamp(dx*4.8,-(e.storyBoss==='nappa'?205:boss?470:390),e.storyBoss==='nappa'?205:boss?470:390),targetVy=clamp((targetY-e.y)*5.4,e.storyBoss==='nappa'?-220:-390,e.storyBoss==='nappa'?220:390);
      e.vx+=(targetVx-e.vx)*Math.min(1,dt*10);e.vy+=(targetVy-e.vy)*Math.min(1,dt*12);e.x+=e.vx*dt;
      if(dist<150&&vertical<115&&e.cooldown<=0)this.queueEnemyCombo(e,boss,true);
      else if(p.grounded&&e.y>WORLD.ground-48){combat.flight=false;combat.flightGrace=0;e.state='walk';}
    }
    else {
      if(dist<(boss?650:480)||e.aggression>0){
        e.aggression=1;e.dir=sign(dx);
        if(boss&&!this.bossAwake&&!this.story){this.bossAwake=true;this.emit('bossAwake');this.emit('zone',{title:this.level.bossName,subtitle:'Leia a postura, defenda e use recuperação aérea para escapar de combos.'});}
        if(boss&&!this.story&&e.hp<e.maxHp*.45&&e.phase===1){e.phase=2;this.emit('enrage',{x:e.x,y:e.y-60});}
        if(intent==='feint'&&e.cooldown<=0){e.state='feint';e.timer=.18;e.windupDuration=.18;e.vx=0;combat.feintCooldown=3;this.emit('tell',{x:e.x,y:e.y-e.h-17,boss:true});}
        else if(intent==='counter'&&e.cooldown<=0){e.state='windup';e.attackKind='counter';e.timer=.12;e.windupDuration=.12;combat.comboQueue=['strike'];combat.stamina-=18;combat.punishCooldown=1.15;e.vx=0;this.emit('tell',{x:e.x,y:e.y-e.h-18,counter:true});}
        else if(intent==='guard'&&e.defenseCooldown<=0){e.state='guard';e.timer=.3+(boss?.12:.06);e.vx=0;e.vy*=.3;e.guard=combat.guardMeter;e.defenseCooldown=.55;this.emit('enemyDefend',{x:e.x,y:e.y-e.h-10});}
        else if(intent==='evade'&&e.defenseCooldown<=0){e.state='evade';e.timer=.2;e.vx=-e.dir*(boss?470:370);e.vy=combat.flight?-e.vy*.2-90:e.vy;e.defenseCooldown=.5;combat.stamina-=24;this.emit('enemyEvade',{x:e.x,y:e.y-35});}
        else if(intent==='vanish'&&e.defenseCooldown<=0&&combat.ki>=18){combat.ki-=18;this.enemyVanish(e,arena,this.combatAI.airSpam?'launcher':'counter');}
        else if(intent==='airChase'){combat.flight=true;combat.flightGrace=.7;e.state='flight';e.grounded=false;e.invincible=Math.max(e.invincible,.1);const targetY=clamp(p.y+(e.id%2?22:-16),92,WORLD.ground-36);e.vx=e.dir*(e.storyBoss==='nappa'?200:boss?440:360);e.vy=clamp((targetY-e.y)*5,-360,360);this.emit('enemyAirDash',{x:e.x,y:e.y-45,dir:e.dir});}
        else if(intent==='airCombo'&&e.cooldown<=0)this.queueEnemyCombo(e,boss,true);
        else if(intent==='retreat'||intent==='space'){e.state='retreat';e.timer=.18;e.vx=-e.dir*(boss?170:125);}
        else if(intent==='projectile'){e.attackKind=e.storyBoss?(['raditz','zarbon'].includes(e.storyBoss)?'double':['nappa','dodoria'].includes(e.storyBoss)?'eruption':['vegeta','ginyu','freeza'].includes(e.storyBoss)?'galick':'volley'):'volley';e.state='windup';e.timer=e.storyBoss==='freeza'?(e.attackCount++%2===0?(e.attackKind='galick',.5):(e.attackKind='double',1.05)):e.attackKind==='galick'?1.05:.62;e.windupDuration=e.timer;e.aimX=p.x+clamp(p.vx*.16,-45,45);e.aimY=p.y-42;e.vx=0;this.combatAI.ensure(e).ki-=18;this.emit('tell',{x:e.x,y:e.y-e.h-17,boss});}
        else if((intent==='attack'||intent==='combo')&&e.cooldown<=0&&vertical<125){e.attackCount++;if(intent==='combo')this.queueEnemyCombo(e,boss,false);else{e.attackKind=e.saiyan&&dist>135?'rush':boss&&dist>175?'sweep':'strike';if(e.storyBoss&&e.attackCount%4===0)e.attackKind=['raditz','zarbon'].includes(e.storyBoss)?'double':['nappa','dodoria'].includes(e.storyBoss)?'eruption':'galick';combat.comboQueue=[];e.state='windup';e.timer=this.saiyanCombat&&e.storyBoss==='nappa'?.48:this.saiyanCombat&&e.storyBoss==='raditz'?.14:boss?.25:.28;e.windupDuration=e.timer;e.aimX=p.x;e.aimY=p.y-42;e.vx=0;this.emit('tell',{x:e.x,y:e.y-e.h-17,boss});}}
        else if(intent==='charge'){e.state='idle';e.vx=0;this.emit('enemyCharge',{x:e.x,y:e.y-48});}
        else{e.state='run';e.vx=e.dir*(this.saiyanCombat&&e.storyBoss==='nappa'?135:this.saiyanCombat&&e.storyBoss==='raditz'?345:boss?245:e.type===1?180:225);}
      }else{e.state='idle';e.vx=Math.sin(e.moveCycle*.8)*15;if(Math.abs(e.x-e.home)>60)e.vx=sign(e.home-e.x)*20;}
      e.x+=e.vx*dt;
    }
    this.breakRocks(e,beforeX);
    const minX=arena?arena.left+32:90,maxX=arena?arena.right-32:WORLD.width-150,nextX=clamp(e.x,minX,maxX);
    if(nextX!==e.x&&Math.abs(e.vx)>220&&!e.grounded&&(e.wallBounces||0)<1){e.vx*=-.55;e.vy=-180;e.wallBounces=(e.wallBounces||0)+1;e.stun=Math.max(e.stun,.34);this.emit('wallImpact',{x:nextX,y:e.y-45});}e.x=nextX;
    const oldY=e.y,flying=combat.flight&&!e.slam&&e.stun<=0;e.vy+=WORLD.gravity*dt*(flying?.035:e.airFloat>0&&!e.slam?.3:1);e.y=Math.max(this.enemyCeiling(e),e.y+e.vy*dt);if(this.saiyanCombat&&e.y===this.enemyCeiling(e)&&e.vy<0)e.vy=0;e.grounded=false;
    let landing=WORLD.ground;
    if(e.vy>=0){
      if(!boss)for(const platform of this.platforms){if(e.x>platform.x&&e.x<platform.x+platform.w&&oldY<=platform.y+4&&e.y>=platform.y)landing=Math.min(landing,platform.y);}
	      if(e.y>=landing){const impact=e.vy;if(impact>690||e.slam)this.groundImpact(e.x,landing);else if(impact>220)this.emit('land',{x:e.x,y:landing});e.y=landing;e.vy=0;e.grounded=true;combat.flight=false;if((e.slam||impact>690)&&(e.groundBounces||0)<1&&!boss){e.slam=false;e.groundBounces=(e.groundBounces||0)+1;e.vy=-260;e.grounded=false;e.stun=.42;this.emit('groundBounce',{x:e.x,y:e.y});}else if(e.slam){e.slam=false;e.stun=.65;this.emit('groundFinish',{x:e.x,y:e.y});}}
    }
    // Separation prevents a crowd from occupying one unreadable attack point.
    if(['walk','run','flight'].includes(e.state))for(const other of this.enemies){if(other.id<e.id&&other.hp>0&&other.type!==2&&Math.abs(e.y-other.y)<35&&Math.abs(e.x-other.x)<38)e.x+=sign(e.x-other.x)*30*dt;}
  }
  openScene(key){
    const lines=this.arrival?ARRIVAL_SCENES[key]:(this.saiyanCombat?SAIYAN_BOSS_SCENES:SCENES)[this.stageId]?.[key];
    if(this.seenScenes.has(key))return false;
    if(!lines?.length){if(this.saiyanCombat)this.seenScenes.add(key);return false;}
    this.seenScenes.add(key);this.dialogue={lines,index:0,key,after:this.mode};this.mode='dialogue';this.inputBuffer={};this.p.attack=null;this.p.queued=null;this.p.vx=0;this.emit('dialogue');return true;
  }
  advanceDialogue(skip=false){
    if(!this.dialogue)return;const d=this.dialogue;
    if(!skip&&++d.index<d.lines.length){this.emit('dialogue');return;}
    this.mode=d.after;this.dialogue=null;this.inputBuffer={};this.p.invincible=Math.max(this.p.invincible,.5);this.emit('dialogueEnd');if(this.mode==='won'){this.finished=true;this.emit('victory');}
  }
  updateStoryBoss(e){
    if(e.hp<=0)return false;
    if(e.storyBoss==='vegeta'){
      if(e.phase===1&&e.hp<e.maxHp*.65){e.phase=2;e.spriteRow=3;e.w=120;e.h=182;e.state='recover';e.timer=1.3;e.vx=0;this.shots=[];this.emit('enrage',{x:e.x,y:e.y-75});this.openScene('ape');return true;}
      if(e.phase===2&&e.hp<e.maxHp*.28){e.phase=3;e.spriteRow=2;e.w=72;e.h=110;e.stun=2;e.state='hurt';e.vx=0;this.shots=[];this.p.ki=clamp(this.p.ki+40,0,100);this.openScene('assist');return true;}
    }else if(e.storyBoss==='zarbon'&&e.hp<e.maxHp*.55&&!this.seenScenes.has('transform')){e.phase=2;e.stun=1.4;e.state='hurt';this.shots=[];this.emit('enrage',{x:e.x,y:e.y-65});this.openScene('transform');return true;}
    else if(e.storyBoss==='freeza'){
      if(e.hp<e.maxHp*.68&&!this.seenScenes.has('transform')){e.phase=2;e.stun=1.6;e.state='hurt';this.shots=[];this.emit('enrage',{x:e.x,y:e.y-65});this.openScene('transform');return true;}
      if(e.hp<e.maxHp*.32&&!this.seenScenes.has('assist')){e.phase=3;e.stun=1.8;e.state='hurt';this.shots=[];this.p.ki=100;this.openScene('assist');return true;}
    }else if(e.hp<e.maxHp*.45&&!this.seenScenes.has('assist')){e.stun=2;e.state='hurt';this.p.ki=clamp(this.p.ki+25,0,100);this.shots=[];this.openScene('assist');return true;}
    return false;
  }
  fireStoryBoss(e){
    const dir=e.dir;
    if(e.storyBoss==='freeza'){
      const ball=e.attackKind==='double',sx=e.x+dir*38,sy=e.y-(ball?115:58),angle=Math.atan2(e.aimY-sy,e.aimX-sx);
      this.shots.push({x:sx,y:sy,vx:Math.cos(angle)*(ball?270:760),vy:Math.sin(angle)*(ball?270:760),r:ball?28:6,damage:ball?46:30,owner:'enemy',life:2.8,trail:[]});
      this.emit('enemyBlast',{x:sx,y:sy});e.state='recover';e.timer=ball?1.2:.65;e.vx=0;return;
    }
    if(e.attackKind==='double'){
      for(const vy of [-65,65])this.shots.push({x:e.x+dir*45,y:e.y-54,vx:dir*400,vy,r:12,damage:21,owner:'enemy',life:2,trail:[]});this.emit('enemyBlast',{x:e.x,y:e.y-54});
    }else if(e.attackKind==='eruption'){
      for(const dx of [-105,0,105])this.hazards.push({type:'eruption',x:clamp(e.aimX+dx,512,5860)-27,w:54,born:this.time,ttl:1.5});this.emit('toast',{text:'ERUPÇÃO · Saia das marcas no chão!'});
    }else{
      this.emit('enemyBeam',{x:e.x+dir*35,y:e.y-58,dir});
      if((this.p.x-e.x)*dir>0&&Math.abs(this.p.x-e.x)<750&&Math.abs(this.p.y-40-(e.y-58))<44)this.hitPlayer(42,e.x,500,true);
    }
    e.state='recover';e.timer=1.15;e.vx=0;
  }
  fireGenki(){
    this.emit('genki',{x:this.p.x,y:this.p.y-105});this.freeze=.12;
    for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-this.p.x)<720)this.hitEnemy(e,250,450,sign(e.x-this.p.x),{beam:true,finisher:true});
    this.shots=this.shots.filter(s=>s.owner==='player');
  }
  hazardState(h){
    if(h.type==='lava'||h.type==='acid')return 'active';
    const t=h.type==='eruption'?this.time-h.born:(this.time+(h.offset||0))%(h.period||3.5);
    return t<.85?'warning':t<1.5?'active':'idle';
  }
  updateHazards(dt){
    if(!this.story)return;this.hazardCooldown=Math.max(0,this.hazardCooldown-dt);this.hazards=this.hazards.filter(h=>!h.ttl||this.time-h.born<h.ttl);
    const p=this.p;for(const h of this.hazards){
      const height=h.type==='rocks'?130:['eruption','geyser'].includes(h.type)?115:24;
      if(this.hazardCooldown>0||this.hazardState(h)!=='active'||p.x+p.w*.35<h.x||p.x-p.w*.35>h.x+h.w||p.y<WORLD.ground-height||p.y-p.h>WORLD.ground)continue;
      if(this.hitPlayer(['lava','acid'].includes(h.type)?22:16,h.x+h.w/2,100,true)){
        this.hazardCooldown=1.2;this.emit('hazardHit',{x:p.x,y:p.y,type:h.type});
        if(['lava','acid'].includes(h.type)){p.x=h.x-32;p.y=WORLD.ground-15;p.vy=-180;p.grounded=false;}
      }
    }
  }
  updateShots(dt){
    for(const s of this.shots){
      s.life-=dt;const oldX=s.x,oldY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.trail.push({x:s.x,y:s.y});if(s.trail.length>7)s.trail.shift();
      if(s.owner==='player'){
        for(const e of this.enemies){
          if(e.hp<=0)continue;
          const crossed=Math.min(oldX,s.x)-s.r<e.x+e.w/2&&Math.max(oldX,s.x)+s.r>e.x-e.w/2;
          if(crossed&&s.y>e.y-e.h-s.r&&s.y<e.y+s.r){this.hitEnemy(e,s.damage,160,sign(s.vx),{});s.life=0;break;}
        }
      }else{
        const p=this.p,crossed=Math.min(oldX,s.x)-s.r<p.x+p.w/2&&Math.max(oldX,s.x)+s.r>p.x-p.w/2;
        if(crossed&&Math.max(oldY,s.y)>p.y-p.h-s.r&&Math.min(oldY,s.y)<p.y+s.r){this.hitPlayer(s.damage,s.x-sign(s.vx)*30,220);s.life=0;}
      }
      if(s.y>WORLD.ground+20)s.life=0;
    }
    this.shots=this.shots.filter(s=>s.life>0&&s.x>0&&s.x<WORLD.width);
  }
  updateOrbs(dt){
    const p=this.p;
    for(const o of this.orbs){
      if(o.got)continue;o.t+=dt;
      const dx=p.x-o.x,dy=p.y-38-o.y,dist=Math.hypot(dx,dy);
      if(dist<58){o.x+=dx*dt*5;o.y+=dy*dt*5;}
      if(dist<35){o.got=true;p.ki=clamp(p.ki+18,0,100);p.hp=Math.min(this.maxHp,p.hp+(this.story&&this.skills.has('vigor')?26:20));this.emit('orb',{x:o.x,y:o.y,id:o.id,total:this.collected});this.emit('toast',{text:`ESFERA ${this.collected} / 7 · +${this.story&&this.skills.has('vigor')?26:20} VIDA · +18 KI`});}
    }
  }
  updateProgress(){
    if(this.arrival)return;
    const p=this.p;
    const zone=p.x>4950?3:p.x>3100?2:p.x>1340?1:0;
    if(zone!==this.zone){this.zone=zone;if(zone>0&&zone<3){this.emit('zoneSmall',{zone});this.checkpoint=p.x;}}
    if(this.story&&p.x>1400&&!this.seenScenes.has('mid')){this.openScene('mid');return;}
    if(p.x>6060&&!this.finished){
      if(this.collected===7&&this.bossDefeated){this.finished=true;this.mode='won';if(this.story)this.openScene('outro');else this.emit('victory');}
      else if(!this.bossDefeated)this.tip('Derrote o guardião para abrir o portal.');
      else this.tip(`Faltam ${7-this.collected} esferas. Volte pelo caminho para encontrá-las.`);
    }
  }
  breakRocks(e,previousX){
    if(!(e.stun>0||e.launchTime>0)||Math.abs(e.vx)<240)return;
    for(const r of this.rocks)if(!r.broken&&e.y>=r.y-r.h&&e.y-e.h<r.y&&Math.min(previousX,e.x)-e.w/2<r.x+r.w&&Math.max(previousX,e.x)+e.w/2>r.x-r.w){r.broken=true;e.vx*=.8;this.emit('rockBreak',{x:r.x,y:r.y-16});}
  }
  groundImpact(x,y){this.craters.push({x,y,born:this.time});if(this.craters.length>8)this.craters.shift();this.emit('terrainImpact',{x,y});}
  updateEncounters(){
    if(this.arrival){updateCoastalEncounters(this);return;}
    for(const a of this.encounters){
      const living=this.enemies.some(e=>a.ids.includes(e.id)&&e.hp>0);
      if(!a.cleared&&!living){a.cleared=true;a.active=false;if(this.activeEncounter===a)this.activeEncounter=null;this.emit('arenaClear',{x:(a.left+a.right)/2,y:WORLD.ground,title:a.title});}
      if(!a.cleared&&!a.active&&!this.activeEncounter&&this.p.x>=a.trigger&&this.p.x<a.right){a.active=true;this.activeEncounter=a;if(a.kind==='pursuit')for(const id of a.ids){const enemy=this.enemies[id];if(enemy?.hp>0){enemy.y=230+(id%3)*35;enemy.grounded=false;enemy.state='flight';const c=this.combatAI.ensure(enemy);c.flight=true;c.flightGrace=2;}}this.emit('arenaStart',{title:a.title});if(this.story&&a.ids.includes(this.boss.id)){this.bossAwake=true;this.openScene('boss');}}
    }
  }
}
