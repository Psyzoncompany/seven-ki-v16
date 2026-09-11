export const RADITZ_ID=1201;
export const RADITZ_STEPS=[
 {actor:'goku',title:'Goku · ganhe uma abertura',detail:'Acerte golpes e Kamehameha. Defenda o chute e esquive da investida de Raditz.',hp:560,goal:160},
 {actor:'piccolo',title:'Piccolo · prepare o Makankosappo',detail:'Segure CARGA / Ctrl por 4 s no total. Goku abre brechas; solte para defender quando Raditz avançar.',hp:400,goal:4},
 {actor:'gohan',title:'Gohan · liberte seu poder',detail:'Segure CARGA / Ctrl. Com a energia cheia, GOLPE ou ESQUIVA lança a cabeçada contra Raditz.',hp:320,goal:1.2},
 {actor:'goku',title:'Goku · a última chance',detail:'Enfraqueça Raditz. Depois se aproxime e segure DEFESA para imobilizá-lo.',hp:210,goal:150}
];
export const RADITZ_MISSION={id:RADITZ_ID,number:'2.1',available:true,mission:true,battle:true,chapter:1,saga:'saiyan',name:'Raditz · batalha em equipe',bossName:'RADITZ',boss:'raditz',bossRow:0,biome:'EPISÓDIO 2 · BATALHA EM EQUIPE',width:1800,pos:[88,36],crop:[88,36],location:'Terra · Vale da cápsula',detail:'Una Goku e Piccolo, prepare o Makankosappo e libere o poder de Gohan. A última abertura exige o sacrifício de Goku.',enemy:'Raditz · Goku · Piccolo · Gohan',zones:RADITZ_STEPS.map(s=>s.title),platforms:[],hazards:[],spawns:[],orbs:[],encounters:[]};
const KEY='sevenki-raditz-battle-v1';
export function cleanRaditz(raw={}){return {version:1,checkpoint:Number.isInteger(raw?.checkpoint)?Math.max(0,Math.min(3,raw.checkpoint)):0,time:Number.isFinite(raw?.time)?Math.max(0,raw.time):0,completed:raw?.completed===true,bestTime:Number.isFinite(raw?.bestTime)&&raw.bestTime>0?raw.bestTime:null,otherWorldReady:raw?.completed===true};}
export function readRaditz(){try{return cleanRaditz(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return cleanRaditz();}}
export function saveRaditz(raw){const progress=cleanRaditz(raw);try{localStorage.setItem(KEY,JSON.stringify(progress));return {progress,saved:true};}catch{return {progress,saved:false};}}
export function checkpointRaditz(checkpoint,time){return saveRaditz({...readRaditz(),checkpoint,time});}
export function finishRaditz(time){const old=readRaditz();return saveRaditz({...old,completed:true,checkpoint:0,time:0,bestTime:old.bestTime?Math.min(old.bestTime,time):time});}
export const RADITZ_SCENES={
 intro:{duration:7,lines:[[0,'RADITZ','Vocês dois não têm chance contra mim.'],[2.5,'GOKU','Solte o Gohan!'],[4.5,'PICCOLO','Mantenha-o ocupado. Preciso de uma abertura.']]},
 opening:{duration:5,lines:[[0,'PICCOLO','Tenho uma técnica capaz de atravessar aquela armadura.'],[2.5,'GOKU','Eu seguro ele. Prepare o ataque!']]},
 firstBeam:{duration:7,lines:[[0,'PICCOLO','Makankosappo!'],[2.5,'RADITZ','Quase... mas você precisa acertar primeiro!'],[5,'GOHAN','Pare de machucar meu pai!']]},
 intervention:{duration:6,lines:[[0,'GOHAN','Deixe meu pai em paz!'],[2,'RADITZ','Como uma criança pode ter esse poder?!'],[4,'GOKU','Gohan! Piccolo, esta é nossa chance!']]},
 finale:{duration:23,lines:[[0,'GOKU','Agora, Piccolo! Eu não vou soltar!'],[4,'PICCOLO','Você vai ser atingido também!'],[6,'GOKU','É o único jeito. Faça isso!'],[9,'PICCOLO','MAKANKOSAPPO!'],[14,'RADITZ','Outros dois Saiyajins ouviram tudo pelo rastreador...'],[17,'RADITZ','Eles chegarão em um ano. São muito mais fortes...'],[20,'NARRADOR','Goku e Raditz morreram. O caminho de Goku continua no Outro Mundo.']]}
};
