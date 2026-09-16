import {RADITZ_MISSION} from './raditz-data.js';
import {ARRIVAL,readArrival} from './arrival-mission.js';
import {readSaga} from './saga.js';

const step=(x,y,actor,title,detail,checkpoint,extra={})=>({x,y,actor,title,detail,checkpoint,...extra});
const common={chapter:1,saga:'saiyan',mission:true,episode:true,available:true,width:3460,encounters:[],spawns:[],orbs:[]};
export const EPISODES=[
 {...common,id:1102,number:'1.2',name:'Uma aliança improvável',bossName:'UMA ALIANÇA IMPROVÁVEL',biome:'EPISÓDIO 1 · FASE 1.2',pos:[38,44],crop:[38,44],location:'Terra · Passagem das montanhas',enemy:'Piccolo · Goku aliado · criaturas da montanha',detail:'Goku precisa de ajuda para encontrar Gohan. Jogue com Piccolo, abra a rota nas montanhas e pratique golpes de alcance e o Makankosappo.',zones:['ALIANÇA COM GOKU','PRECISÃO DE KI','PASSAGEM ESTREITA','ROTA DE RADITZ'],
  platforms:[{x:480,y:382,w:180,h:70},{x:1510,y:350,w:250,h:110},{x:1940,y:320,w:240,h:110},{x:2770,y:368,w:190,h:90}],hazards:[{x:1370,w:100,type:'rocks',period:4.3,offset:.8}],
  objectives:[step(1130,462,'piccolo','Siga pelas montanhas','Afaste o sauro com golpes de alcance: ← / X. Defesa: → / B.',[180,462],{fight:0}),step(1970,320,'piccolo','Ajude o menino na encosta','Um menino pede socorro! Afaste o raptor e aproxime-se dele na plataforma elevada.',[1250,462],{fight:2,boy:true}),step(2610,462,'piccolo','Atravesse o desfiladeiro','Duas criaturas guardam o corredor. Alterne defesa, golpes e KI.',[2200,462],{fight:1}),step(3220,462,'piccolo','Localize a rota até Raditz','Alcance o mirante. Goku acompanha você até a entrada do vale.',[2750,462])]},
 {...common,id:1103,number:'1.3',name:'O resgate de Gohan',bossName:'O RESGATE DE GOHAN',biome:'EPISÓDIO 1 · FASE 1.3',pos:[66,62],crop:[66,62],location:'Terra · Vale da cápsula',enemy:'Goku e Piccolo · Gohan em cativeiro · Raditz à distância',detail:'Abra uma aproximação segura com Goku e Piccolo. Em um trecho curto, ajude Gohan a se proteger no cativeiro. Prepare o confronto; a luta com Raditz será a próxima fase.',zones:['APROXIMAÇÃO ROCHOSA','ABERTURA DE PICCOLO','GOHAN NO CATIVEIRO','PRONTOS PARA O CONFRONTO'],
  platforms:[{x:490,y:380,w:210,h:82},{x:1400,y:360,w:180,h:95},{x:1710,y:320,w:230,h:120},{x:2240,y:378,w:210,h:84}],hazards:[{x:1240,w:100,type:'rocks',period:4.4,offset:1}],
  objectives:[step(1090,462,'goku','Abra uma aproximação segura','Afaste as criaturas antes de se aproximar da cápsula de Raditz.',[180,462],{fight:0}),step(1900,320,'piccolo','Prepare o ponto de apoio','Alcance o mirante para observar a cápsula e encontrar uma aproximação segura.',[1380,462]),step(2850,462,'gohan','Gohan: procure abrigo','A / D ou analógico para mover. Fique na área azul e segure → / B para se proteger dos tremores.',[2660,462],{captive:true}),step(3220,462,'goku','Prepare a intervenção','Goku sentiu a energia de Gohan. Encontre Piccolo diante do local do confronto.',[2990,462])]},
];
export const NEXT_BATTLE=RADITZ_MISSION;
export const CAMPAIGN_STAGES=[ARRIVAL,...EPISODES,NEXT_BATTLE];
export const episodeById=id=>EPISODES.find(m=>m.id===id);
const KEY='sevenki-episode-one-v1';
export function cleanEpisodes(raw={}){
 const missions={};for(const m of EPISODES){const r=raw?.missions?.[m.id]||{};missions[m.id]={completed:r.completed===true,checkpoint:Number.isInteger(r.checkpoint)?Math.max(0,Math.min(m.objectives.length-1,r.checkpoint)):0,time:Number.isFinite(r.time)?Math.max(0,r.time):0,bestTime:Number.isFinite(r.bestTime)&&r.bestTime>0?r.bestTime:null};}
 return {version:1,missions};
}
export function readEpisodes(){try{return cleanEpisodes(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return cleanEpisodes();}}
export function saveEpisodes(raw){const progress=cleanEpisodes(raw);try{localStorage.setItem(KEY,JSON.stringify(progress));return {progress,saved:true};}catch{return {progress,saved:false};}}
export function campaignUnlocked(id,progress=readEpisodes(),arrival=readArrival(),legacy=readSaga()){
 if(id===1101)return true;
 if(!episodeById(id))return false;
 // Old accomplishments remain untouched; veterans may replay every new opening mission.
 if(legacy.chapters?.[101]?.completed)return true;
 if(id===1102)return arrival.completed;
 return arrival.completed&&progress.missions[1102].completed;
}
export function saveEpisodeCheckpoint(id,checkpoint,time){const p=readEpisodes();p.missions[id]={...p.missions[id],checkpoint,time};return saveEpisodes(p);}
export function completeEpisode(id,time){const p=readEpisodes(),old=p.missions[id];if(!old)return {progress:p,saved:false};p.missions[id]={completed:true,checkpoint:0,time:0,bestTime:old.bestTime?Math.min(old.bestTime,time):time};return saveEpisodes(p);}
export const EPISODE_ACTORS={goku:{id:'goku',name:'GOKU',height:105,w:36,h:78,hp:250,speed:266,technique:'KAMEHAMEHA'},piccolo:{id:'piccolo',name:'PICCOLO',height:116,w:38,h:88,hp:230,speed:248,technique:'MAKANKOSAPPO'},gohan:{id:'gohan',name:'GOHAN',height:64,w:25,h:49,hp:90,speed:115,technique:'PODER INSTÁVEL'}};
const line=(speaker,text)=>({speaker,text});
export const EPISODE_SCENES={
 1102:{intro:[line('PICCOLO','Eu também enfrentei esse sujeito. Sozinho, nenhum de nós vai conseguir.'),line('GOKU','Ele levou o Gohan. Você consegue sentir para onde foi?'),line('PICCOLO','Pelas montanhas. Eu sigo na frente. Não confunda isso com amizade.')],checkpoint1:[line('MENINO','Socorro! Eu subi aqui quando o bicho apareceu. Não consigo voltar!'),line('PICCOLO','Fique na encosta. Vou afastá-lo.')],checkpoint2:[line('MENINO','Obrigado! Agora posso voltar para casa!'),line('GOKU','Siga pela trilha livre. Nós vamos continuar pelo vale.')],checkpoint3:[line('PICCOLO','A energia está do outro lado. Agora sabemos por onde chegar.')],outro:[line('GOKU','Gohan, estamos chegando.'),line('PICCOLO','Vamos preparar a aproximação. Não ataque Raditz sem um plano.')]},
 1103:{intro:[line('GOKU','A cápsula está perto. Vou afastar essas criaturas para você conseguir passar.'),line('PICCOLO','Depois eu observo a encosta. Não deixe que ele perceba a aproximação.')],checkpoint1:[line('PICCOLO','Fique atrás de mim. Vou observar a cápsula pelo mirante.')],checkpoint2:[line('GOHAN','Pai... está tudo tremendo! Eu quero sair daqui!'),line('NARRADOR','Dentro da cápsula, Gohan ainda não sabe lutar. Ajude-o a procurar abrigo e se proteger.')],checkpoint3:[line('GOKU','Você sentiu isso? Aquela energia veio do Gohan!'),line('PICCOLO','Foi só um instante. Vamos preparar a abertura antes que Raditz reaja.')],outro:[line('GOKU','Achamos o lugar. Agora vamos trazer meu filho de volta.'),line('PICCOLO','Você o mantém ocupado. Eu preparo o Makankosappo.'),line('NARRADOR','A jornada até Raditz está concluída. O confronto continua na próxima missão, em desenvolvimento.')]}
};
export function episodePose(p){
 if(p.character==='gohan')return p.hp<=0?5:p.stun>0?3:p.burstTime>0?4:p.guarding?2:Math.abs(p.vx)>15?1:0;
 if(p.hp<=0)return 14;if(p.stun>0)return 13;if(p.guarding)return 8;
 if(p.state==='special'||p.charging||p.state==='blast')return p.specialFired?3:1;
 if(p.attack)return p.attack.kind==='slam'?11:p.attack.kind==='launch'?10:p.attack.step%2?7:3;
 return !p.grounded?12:Math.abs(p.vx)>25?1:0;
}
