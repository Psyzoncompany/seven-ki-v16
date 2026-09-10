import {createCoastalCreatures} from './coastal-creatures.js';
// Episode 1.1 is independent of the original boss chapters and their saves.
export const ARRIVAL_ID=1101;
export const ARRIVAL={id:ARRIVAL_ID,chapter:1,saga:'saiyan',mission:true,name:'Um poder desconhecido',bossName:'UM PODER DESCONHECIDO',biome:'EPISÓDIO 1 · FASE 1.1',available:true,pos:[12,60],crop:[15,60],detail:'Uma luz corta o céu da costa. Investigue o impacto, ajude um morador e descubra quem chegou à Terra. Uma abertura com exploração e história, antes da luta contra Raditz.',enemy:'Goku · investigação · destroços · ameaça desconhecida',zones:['A COSTA EM SILÊNCIO','RASTRO DO IMPACTO','UMA CÁPSULA VAZIA','VOLTE PARA GOHAN'],width:3460,encounters:[],spawns:[],orbs:[],platforms:[{x:430,y:392,w:140,h:50},{x:620,y:332,w:130,h:60},{x:770,y:270,w:220,h:78},{x:2020,y:374,w:180,h:62},{x:2270,y:290,w:210,h:76},{x:2570,y:356,w:170,h:60}],hazards:[]};
export const ARRIVAL_OBJECTIVES=[
 {x:880,y:270,title:'Siga o rastro no céu',detail:'Siga pela costa ou voe sobre o mirante. Não precisa parar.',action:'OBSERVAR',checkpoint:[180,462]},
 {x:1790,y:462,title:'Libere o fazendeiro',detail:'Quebre as duas pedras ao redor dele com ← ou KI em ↑.',action:'CONVERSAR',checkpoint:[1020,462]},
 {x:3000,y:462,title:'Investigue a cápsula',detail:'Cruze a encosta. Evite as marcas de queda de pedras.',action:'EXAMINAR',checkpoint:[1840,462]},
 {x:350,y:462,title:'Volte para Gohan',detail:'Aquela presença está na costa. Volte à Casa do Kame!',action:'ENCONTRAR GOHAN',checkpoint:[2800,462]}
];
const line=(speaker,text)=>({speaker,text});
export const ARRIVAL_SCENES={
 intro:[line('GOHAN','Pai, você viu aquela luz? Ela caiu atrás das montanhas!'),line('GOKU','Eu senti... uma força estranha. Fique aqui na Casa do Kame. Vou descobrir o que aconteceu.')],
 lookout:[line('GOKU','Não foi uma estrela cadente. Tem fumaça depois da encosta... e alguém está pedindo ajuda!'),line('GOKU','O impacto assustou os animais da costa. Preciso afastá-los para chegar até aquele morador.')],
 farmer:[line('MORADOR','Obrigado! O impacto derrubou essas pedras. Vi um homem sair de uma bola de metal... ele tinha uma cauda!'),line('MORADOR','Mais duas criaturas fugiram para a encosta. Cuidado com o menor: ele é rápido!'),line('GOKU','Uma cauda? Vou olhar a cápsula. Vá para um lugar seguro.')],
 capsule:[line('GOKU','Está vazia. Quem veio aqui já foi embora.'),line('GOKU','Espere... aquela força mudou de direção. Está perto do Gohan!')],
 abduction:[line('RADITZ','Enfim encontrei você, Kakarotto. Sou Raditz, seu irmão. Vejo que esqueceu por que veio à Terra.'),line('GOKU','Meu nome é Goku! Afaste-se do meu filho!'),line('GOHAN','Pai!'),line('RADITZ','Se quiser o garoto de volta, venha me procurar.'),line('GOKU','Gohan! Aguente firme... eu vou encontrar você.')]
};
const KEY='sevenki-arrival-1-1-v1';
export function cleanArrival(raw={}){return {version:1,checkpoint:Number.isInteger(raw?.checkpoint)?Math.max(0,Math.min(3,raw.checkpoint)):0,time:Number.isFinite(raw?.time)?Math.max(0,raw.time):0,completed:raw?.completed===true,bestTime:Number.isFinite(raw?.bestTime)&&raw.bestTime>0?raw.bestTime:null};}
export function readArrival(){try{return cleanArrival(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return cleanArrival();}}
export function saveArrival(raw){const progress=cleanArrival(raw);try{localStorage.setItem(KEY,JSON.stringify(progress));return {progress,saved:true};}catch{return {progress,saved:false};}}
export function initArrival(g,save={}){
 const data=cleanArrival(save),step=data.completed?0:data.checkpoint;
 g.arrival={step,scan:0,sceneTime:0,checkpoint:step,radio:[],radioTime:0,caption:step?'RETOMADO DO CHECKPOINT':'EPISÓDIO 1 · A CHEGADA DE RADITZ',captionTime:5};
 [g.p.x,g.p.y]=ARRIVAL_OBJECTIVES[step].checkpoint;g.checkpoint=g.p.x;g.time=step?data.time:0;
 g.rocks=[1700,1880].map((x,i)=>({id:'arrival-rock-'+i,variant:i,x,y:462,w:i?67:43,h:i?90:110,hp:2,broken:step>=2}));
 g.enemies=createCoastalCreatures(step);g.encounters=[{left:1010,right:1440,trigger:1090,ids:[0],title:'CRIATURA ASSUSTADA / DEFENDA E RESPONDA',missionStep:1},{left:2180,right:2850,trigger:2330,ids:[1,2],title:'ENCOSTA / DUAS CRIATURAS',missionStep:2}].map(a=>({...a,active:false,cleared:step>a.missionStep}));
 g.hazards=[{x:2150,w:90,type:'rocks',period:4.5,offset:0},{x:2510,w:100,type:'rocks',period:4.8,offset:1.3}];
}
export function arrivalTarget(g){return ARRIVAL_OBJECTIVES[g.arrival?.step||0];}
export function arrivalCanInteract(g){
 const m=g.arrival,t=arrivalTarget(g);if(!m||g.mode!=='playing')return false;
 // The lookout is a landmark, not a compulsory landing or hold-to-scan gate.
 if(m.step===0)return g.p.x>=t.x-100;
 if(m.step===1)return g.rocks.every(r=>r.broken);
 return Math.abs(g.p.x-t.x)<130&&Math.abs(g.p.y-t.y)<160;
}
function checkpoint(g,step,scene){
 g.arrival.step=step;g.arrival.checkpoint=step;g.arrival.scan=0;g.arrival.caption='CHECKPOINT SALVO';g.arrival.captionTime=3.5;g.checkpoint=ARRIVAL_OBJECTIVES[step].checkpoint[0];g.p.hp=g.maxHp;g.p.ki=Math.max(60,g.p.ki);g.emit('arrivalCheckpoint',{checkpoint:step,time:g.time});
 g.arrival.radio=[...ARRIVAL_SCENES[scene]];g.arrival.radioTime=6;
 if(step===2)g.arrival.farmerTime=6;
}
export function updateArrival(g,dt,input){
 const m=g.arrival,p=g.p;m.captionTime=Math.max(0,m.captionTime-dt);p.x=Math.max(96,Math.min(ARRIVAL.width-100,p.x));g.zone=m.step;
 if(m.radio.length){m.radioTime-=dt;if(m.radioTime<=0){m.radio.shift();m.radioTime=6;}}
 m.farmerTime=Math.max(0,(m.farmerTime||0)-dt);
 if(m.step===1){
  const a=p.attack,box=a&&a.t>=a.move.active&&a.t<=a.move.end?g.playerAttackBox():null;
  for(const r of g.rocks){if(r.broken)continue;
   let hit=false;
   if(box&&!a.hit.has(r.id)&&box.x<r.x+r.w&&box.x+box.w>r.x-r.w&&box.y<r.y&&box.y+box.h>r.y-r.h){a.hit.add(r.id);hit=true;}
   for(const s of g.shots)if(s.owner==='player'&&s.life>0&&Math.abs(s.x-r.x)<r.w+s.r&&s.y>r.y-r.h-s.r&&s.y<r.y+s.r){s.life=0;hit=true;}
   if(p.state==='special'&&p.specialFired&&!r.beamHit&&(r.x-p.x)*p.dir>0&&Math.abs(r.x-p.x)<800&&Math.abs(p.y-r.y)<70){r.beamHit=true;hit=true;r.hp=1;}
   if(hit){r.hp--;g.freeze=Math.max(g.freeze,.028);g.emit('hit',{x:r.x,y:r.y-r.h*.5,heavy:false});if(r.hp<=0){r.broken=true;g.emit('rockBreak',{x:r.x,y:r.y-25});}}
  }
 }
 const near=arrivalCanInteract(g);
 if(m.step===3&&near){
  p.x=280;p.y=462;p.vx=p.vy=0;p.grounded=true;p.state='idle';p.dir=1;m.sceneTime=0;g.mode='won';g.openScene('abduction');return;
 }
 if(!near)return;
 if(m.step===0)checkpoint(g,1,'lookout');else if(m.step===1)checkpoint(g,2,'farmer');else if(m.step===2)checkpoint(g,3,'capsule');
}
export function tickArrivalScene(g,dt){
 if(g.dialogue?.key!=='abduction')return;
 if(g.arrival.sceneIndex!==g.dialogue.index){g.arrival.sceneIndex=g.dialogue.index;g.arrival.sceneTime=g.dialogue.index*4.5;}
 g.arrival.sceneTime+=dt;
 // Dialogue remains readable; controls can advance or skip without changing rewards.
 if(g.arrival.sceneTime>=(g.dialogue.index+1)*4.5)g.advanceDialogue();
}
