import {ARRIVAL,readArrival} from './arrival-mission.js';
import {readEpisodes,cleanEpisodes} from './episode-campaign.js';
import {CampaignEngine} from './episode-engine.js';

export const JOURNEY={...ARRIVAL,name:'A chegada de Raditz',number:'1',journey:true,biome:'EPISÓDIO 1 · MISSÃO CONTÍNUA',bossName:'A CHEGADA DE RADITZ',detail:'Da costa à cápsula de Raditz: ajude o fazendeiro, socorra um menino na encosta, forme a aliança com Piccolo e prepare o resgate de Gohan. Uma missão contínua com checkpoints.',enemy:'Goku · Piccolo · Gohan · moradores da Terra',zones:['COSTA E FAZENDEIRO','ALIANÇA E RESGATE NA ENCOSTA','GOHAN NO CATIVEIRO','APROXIMAÇÃO DE RADITZ']};
const KEY='sevenki-raditz-journey-v1';
const ids=[1101,1102,1103];
export function cleanJourney(raw={}){return {version:1,segment:ids.includes(raw?.segment)?raw.segment:1101,checkpoint:Number.isInteger(raw?.checkpoint)?Math.max(0,Math.min(3,raw.checkpoint)):0,time:Number.isFinite(raw?.time)?Math.max(0,raw.time):0,completed:raw?.completed===true,bestTime:Number.isFinite(raw?.bestTime)&&raw.bestTime>0?raw.bestTime:null};}
export function readJourney(){
 try{const saved=localStorage.getItem(KEY);if(saved)return cleanJourney(JSON.parse(saved));}catch{}
 const arrival=readArrival(),p=readEpisodes().missions;
 if(p[1103].completed)return cleanJourney({completed:true});
 const segment=arrival.completed?(p[1102].completed?1103:1102):1101,r=segment===1101?arrival:p[segment];
 return cleanJourney({segment,checkpoint:r.checkpoint,time:(arrival.completed?arrival.bestTime||0:0)+(segment===1103?p[1102].bestTime||0:0)+(r.time||0)});
}
export function saveJourney(raw){const progress=cleanJourney(raw);try{localStorage.setItem(KEY,JSON.stringify(progress));return {progress,saved:true};}catch{return {progress,saved:false};}}
export function finishJourney(time){const old=readJourney();return saveJourney({...old,completed:true,segment:1101,checkpoint:0,time:0,bestTime:old.bestTime?Math.min(old.bestTime,time):time});}

export class JourneyEngine extends CampaignEngine{
 reset(...args){this.journey=null;this.nextSegment=null;super.reset(...args);}
 start(id=1101,build={}){
  if(id!==1101)return false;
  const save=cleanJourney(build.journey||readJourney()),state={...save,completed:false};
  if(save.completed){state.segment=1101;state.checkpoint=0;state.time=0;}
  this.loadSegment(state.segment,state.checkpoint,state.time,build);return true;
 }
 loadSegment(segment,checkpoint,time,build={}){
  this.nextSegment=null;
  const episodes=cleanEpisodes();episodes.missions[1102].checkpoint=segment===1102?checkpoint:0;episodes.missions[1103].checkpoint=segment===1103?checkpoint:0;
  super.reset(segment,{...build,skills:[],episodes,arrivalCheckpoint:{checkpoint:segment===1101?checkpoint:0,time,completed:false}});
  this.journey={segment,checkpoint};this.time=time;this.mode='playing';this.finished=false;
  if(!checkpoint)this.openScene('intro');
  this.emit('characterChanged',{character:this.p.character||'goku'});
  this.emit('journeyCheckpoint',{segment,checkpoint,time});
 }
 emit(type,data={}){
  if(this.journey){
   if(type==='arrivalCheckpoint'||type==='episodeCheckpoint'){
    this.journey.checkpoint=data.checkpoint;
    super.emit('journeyCheckpoint',{segment:this.stageId,checkpoint:data.checkpoint,time:this.time});
   }
   if(type==='victory'&&this.stageId!==1103){this.nextSegment=this.stageId+1;this.mode='transition';this.finished=false;return;}
  }
  super.emit(type,data);
 }
 step(dt,input={}){
  if(this.nextSegment){const next=this.nextSegment,time=this.time;this.loadSegment(next,0,time);return;}
  super.step(dt,input);
 }
 get progress(){return this.journey?(this.finished?1:(ids.indexOf(this.stageId)*4+(this.episode?.step??this.arrival?.step??0))/12):super.progress;}
}
