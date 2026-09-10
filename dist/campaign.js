export const STAGES=[
 {id:1,name:'Vale dos Ecos',biome:'VALE INICIAL',detail:'Atravesse as quatro arenas, reúna as 7 esferas e derrote o Guardião do Vale.',enemy:'Vigias, conjuradores e guardião',available:true,pos:[12,76],crop:[8,85]},
 {id:2,name:'Floresta Celeste',biome:'FLORESTA',detail:'Enfrente a patrulha saiyajin entre as copas e ruínas. Reúna 7 esferas e vença o comandante Razek.',enemy:'Assaltantes, artilheiras e Razek',available:true,pos:[33,66],crop:[25,70]},
 {id:3,name:'Deserto Escarlate',biome:'DESERTO',detail:'Uma nova região entre penhascos e ruínas. Esta fase ainda está em desenvolvimento.',enemy:'Em preparação',pos:[54,76],crop:[48,65]},
 {id:4,name:'Cavernas',biome:'CAVERNAS AZUIS',detail:'O caminho segue para as profundezas. Esta fase ainda está em desenvolvimento.',enemy:'Em preparação',pos:[75,55],crop:[70,60]},
 {id:5,name:'Ruínas do KI',biome:'TEMPLOS ANTIGOS',detail:'A jornada continua pelos templos suspensos. Esta fase ainda está em desenvolvimento.',enemy:'Em preparação',pos:[25,33],crop:[35,38]},
 {id:6,name:'Céu Partido',biome:'ILHAS CELESTES',detail:'Os picos acima das nuvens aguardam. Esta fase ainda está em desenvolvimento.',enemy:'Em preparação',pos:[49,22],crop:[55,20]},
 {id:7,name:'Fortaleza Sombria',biome:'FORTALEZA',detail:'O destino final da jornada. Esta fase ainda está em desenvolvimento.',enemy:'Em preparação',pos:[77,16],crop:[90,15]}
];
const KEY='sevenki-campaign-v1';
export function readProgress(){try{return cleanProgress(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return cleanProgress({});}}
function cleanRecord(r){return {completed:r?.completed===true,bestTime:Number.isFinite(r?.bestTime)&&r.bestTime>0?r.bestTime:null,bestCombo:Number.isFinite(r?.bestCombo)?Math.max(0,Math.floor(r.bestCombo)):0};}
export function cleanProgress(raw){const r=raw&&typeof raw==='object'?raw:{};const stages={1:cleanRecord(r.stages?.[1]||r),2:cleanRecord(r.stages?.[2])};if(!stages[1].completed)stages[2]=cleanRecord(null);return {stages,bestCombo:Math.max(stages[1].bestCombo,stages[2].bestCombo)};}
export function stageRecord(progress,id){return progress.stages[id]||cleanRecord(null);}
export function isUnlocked(progress,id){return id===1||id===2&&stageRecord(progress,1).completed;}
export function recordVictory(progress,time,combo,stageId=1){
 const current=cleanProgress(progress);if(![1,2].includes(stageId)||!isUnlocked(current,stageId))return {progress:current,saved:false};
 const old=stageRecord(current,stageId);current.stages[stageId]={completed:true,bestTime:old.bestTime?Math.min(old.bestTime,time):time,bestCombo:Math.max(old.bestCombo,combo)};
 const next=cleanProgress(current);let saved=true;try{localStorage.setItem(KEY,JSON.stringify(next));}catch{saved=false;}return {progress:next,saved};
}
