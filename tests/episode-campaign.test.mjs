import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignEngine} from '../dist/episode-engine.js';
import {cleanEpisodes,campaignUnlocked,saveEpisodeCheckpoint,completeEpisode,readEpisodes,EPISODES} from '../dist/episode-campaign.js';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const legacy={chapters:{101:{completed:true}}};
const start=(id,checkpoint=0)=>{const episodes=cleanEpisodes();episodes.missions[id].checkpoint=checkpoint;const g=new CampaignEngine();assert(g.start(id,{legacy,episodes}));g.advanceDialogue(true);g.events=[];return g;};
const close=g=>{g.advanceDialogue(true);while(g.freeze>0)g.step(1/60,{});};
const target=g=>{const t=g.story.objectives[g.episode.step];Object.assign(g.p,{x:t.x,y:t.y,vx:0,vy:0});g.step(1/60,{});close(g);};
function fight(g){
 const a=g.encounters.find(a=>a.missionStep===g.episode.step);g.p.x=a.left+100;g.updateEncounters();
 for(const id of a.ids){const enemy=g.enemies.find(e=>e.id===id);
  for(let i=0;i<900&&enemy.hp>0;i++){if(i%24===0)Object.assign(g.p,{x:enemy.x-55,y:enemy.y,vx:0,vy:0});g.step(1/60,{attack:true,pressed:i%18===0?{attack:true}:{}});}
  assert(enemy.hp<=0,'real attacks defeat the preparation creature');
 }
 close(g);g.updateEncounters();target(g);
}
test('campaign disables old fights and Freeza even for veteran saves; Versus keeps its roster',()=>{
 const g=new CampaignEngine();for(const id of [1,2,101,102,103,201,202,203,204,1201])assert.equal(g.start(id,{legacy}),false);
 assert.equal(g.start(1102),false);assert(g.start(1101));g.startVersus('freeza','vegeta','namek');assert.equal(g.versus.player.id,'freeza');assert.equal(g.episode,null);assert.equal(g.mode,'playing');
});
test('new players progress in order and legacy accomplishments are preserved',()=>{
 const p=cleanEpisodes(),arrival={completed:false},old={chapters:{}};assert(!campaignUnlocked(1102,p,arrival,old));arrival.completed=true;assert(campaignUnlocked(1102,p,arrival,old));assert(!campaignUnlocked(1103,p,arrival,old));p.missions[1102].completed=true;assert(campaignUnlocked(1103,p,arrival,old));
 const snapshot=JSON.stringify(legacy);assert(campaignUnlocked(1103,cleanEpisodes(),{completed:false},legacy));assert.equal(JSON.stringify(legacy),snapshot);
});
test('mountain segment rescues the boy through actual attacks without rock gates',()=>{
 const g=start(1102);assert.equal(g.p.character,'piccolo');assert.equal(g.rocks.length,0);fight(g);assert.equal(g.episode.step,1);target(g);assert.equal(g.episode.step,1,'approaching the boy alone does not dismiss the threat');fight(g);assert.equal(g.episode.step,2);fight(g);assert.equal(g.episode.step,3);target(g);assert.equal(g.mode,'won');assert.equal(g.events.filter(e=>e.type==='victory').length,1);
});
test('1.3 switches Goku to Piccolo to confined Gohan and back before ending',()=>{
 const g=start(1103);assert.equal(g.p.character,'goku');fight(g);assert.equal(g.p.character,'piccolo');assert.equal(g.rocks.length,0);target(g);assert.equal(g.p.character,'gohan');
 Object.assign(g.p,{x:2900,y:462});for(let i=0;i<20;i++)g.step(1/60,{right:true,flightMode:true,up:true,attack:true,blast:true,charge:true,special:true,pressed:{attack:true,transform:true,ascend:true}});
 assert(g.p.x<=2920);assert.equal(g.p.y,462);assert.equal(g.p.attack,null);assert.equal(g.shots.length,0);assert.equal(g.p.ki,0);assert(!g.p.form);
 g.p.x=2850;for(let i=0;i<400&&g.p.character==='gohan';i++)g.step(1/60,{guard:true});close(g);
 assert.equal(g.p.character,'goku');assert.equal(g.episode.step,3);assert(g.events.some(e=>e.type==='gohanPulse'));target(g);assert.equal(g.mode,'won');
});
test('all checkpoints reconstruct actor, terrain and previous encounters without temporary state',()=>{
 for(const mission of EPISODES)for(let i=0;i<mission.objectives.length;i++){
  const g=start(mission.id,i);assert.equal(g.p.character,mission.objectives[i].actor);assert.deepEqual([g.p.x,g.p.y],mission.objectives[i].checkpoint);assert.equal(g.rocks.length,0);
  assert(!g.p.attack);assert(!g.p.guarding);assert(!g.p.form);assert(!g.shots.length);
  g.pause();const x=g.p.x;g.step(.1,{right:true});assert.equal(g.p.x,x);g.resume();assert.equal(g.mode,'playing');
 }
});
test('checkpoint persists separately, completion is idempotent and old saves stay intact',()=>{
 storage.set('sevenki-saiyan-story-v1','legacy sentinel');saveEpisodeCheckpoint(1102,2,54);assert.equal(readEpisodes().missions[1102].checkpoint,2);
 completeEpisode(1102,90);completeEpisode(1102,120);assert.equal(readEpisodes().missions[1102].bestTime,90);assert.equal(storage.get('sevenki-saiyan-story-v1'),'legacy sentinel');
});
test('watching or skipping episode ending yields the same single completion',()=>{
 for(const skip of [false,true]){const g=start(1103,3);const t=g.story.objectives[3];g.p.x=t.x;g.step(1/60,{});assert.equal(g.mode,'dialogue');
  if(skip)g.advanceDialogue(true);else for(let i=0;i<1100&&g.mode==='dialogue';i++)g.step(1/60,{});
  g.advanceDialogue(true);assert.equal(g.mode,'won');assert.equal(g.events.filter(e=>e.type==='victory').length,1);
 }
});
