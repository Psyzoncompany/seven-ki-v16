import {ARRIVAL,ARRIVAL_ID,readArrival,saveArrival} from './arrival-mission.js';
import {drawWorldGuidance,worldGuidance} from './world-guidance.js';
import {renderSagaScene} from './saga-map-view.js';
import {CampaignEngine} from './episode-engine.js';
import {RaditzCampaignEngine as JourneyEngine} from './raditz-battle.js';
import {readRaditz,checkpointRaditz,finishRaditz} from './raditz-data.js';
import {buildRaditzAtlas,mountRaditzUi,updateRaditzHud,drawRaditzWorld,drawRaditzScene,drawGohanRush} from './raditz-view.js';
import {JOURNEY,readJourney,saveJourney,finishJourney} from './journey.js';
import {CAMPAIGN_STAGES,episodeById,campaignUnlocked,readEpisodes,saveEpisodeCheckpoint,completeEpisode,EPISODE_ACTORS,episodePose} from './episode-campaign.js';
import {drawEpisodeWorld,updateEpisodeHud} from './episode-view.js';
import {drawArrivalBackground,drawArrivalTerrain,drawArrivalWorld,updateArrivalHud} from './arrival-view.js';
import {KEY_MAP,KeyboardInput} from './keyboard.js';
import {comboPose} from './combo-poses.js';
import {hitReaction} from './hit-reaction.js';
import {drawCombatEffect} from './combat-effects.js';
import {fighterTransition} from './fighter-transition.js';
import {impactFeedback,gridAtlas} from './impact-feedback.js';
import {effectDuration,effectProfile,drawWorldEffect,drawWorldHazard} from './world-animation.js';
import {freezaPose} from './freeza-animation.js';
import {CHAPTERS,SAIYAN_CHAPTERS,FREEZA_CHAPTERS,SKILLS,readSaga,sagaRecord,sagaUnlocked,finishSaga,buySkill,saveSaga} from './saga.js?v=13';
import {comboSpriteFrame} from './saiyan-combat.js?v=16';
import {findSpriteFrames} from './sprite-frames.js?v=16';
import {XboxInput} from './gamepad.js?v=15';
import {STAGES,readProgress,recordVictory,stageRecord,isUnlocked} from './campaign.js?v=8';
import {hydrateIcons} from './icons.js?v=8';
hydrateIcons();
const notes=document.getElementById('gameplay-notes');
notes.append(document.querySelector('.arrival-objective'),document.getElementById('arrival-radio'),document.getElementById('timing-cue'),document.getElementById('direction'));
// The play surface owns touch gestures; do not let Safari interpret them as zoom.
for(const type of ['gesturestart','gesturechange','gestureend','dblclick'])document.addEventListener(type,e=>{if(e.target.closest('#app'))e.preventDefault();},{passive:false});
document.addEventListener('touchmove',e=>{if(!e.target.closest('.controls-card,.layout-card,.skills-card,.versus-select,.world-map,#gameplay-notes'))e.preventDefault();},{passive:false});

import {WORLD, clamp} from './engine.js?v=16';
import {VersusEngine as GameEngine,VERSUS_FIGHTERS,versusFighter,versusPose} from './versus.js?v=18';
import {DuelCamera} from './duel-camera.js';
import {normalizeHeroAtlas,HeroAnimator,heroMotionFrame} from './hero-animation.js';
import {GameAudio} from './audio.js?v=12';
import {TouchLayout} from './touch-layout.js?v=8';
import {ParticlePool} from './vfx-pool.js?v=9';

const $=id=>document.getElementById(id);
mountRaditzUi(()=>engine,()=>clearInput());
const stage=$('stage'),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
let engine=new JourneyEngine();const sound=new GameAudio(),controller=new XboxInput();engine.reset(1101);
let controllerConnected=false,padMenuDirection='',padMenuNext=0,controllerNotice='';
const images={},atlases={},keys=new Set(),pointers=new Map(),pressed={};
const keyMap=KEY_MAP,keyboard=new KeyboardInput();
let W=960,H=540,cam=0,shake=0,flash=0,flashColor='#fff5d3',last=0,accumulator=0,cameraZoom=1,baseZoom=1,zoomImpulse=0,debugCombat=false;
let toastTime=0,zoneTime=0,hudTime=0,helpWasPlaying=false,loaded=false;
const particlePool=new ParticlePool(480);let particles=particlePool.items,effects=[],trails=[],ambient=[];
let landingPulse=0;
const duelCamera=new DuelCamera(),heroAnimator=new HeroAnimator();let renderTop=0,renderDelta=1/60;
let touchLayout;
let campaign=readProgress(),saga=readSaga(),campaignMode='story',storySaga='saiyan',selectedStage=101,selectedSkill='vigor',skillsWasPlaying=false,lastStoryReward=0,progressSaved=true;
const storyStages=()=>campaignMode==='legacy'?(storySaga==='freeza'?FREEZA_CHAPTERS:SAIYAN_CHAPTERS):[JOURNEY,CAMPAIGN_STAGES.at(-1)];
const mapStages=()=>storyStages();
const getStage=id=>storyStages().find(s=>s.id===id);
const unlocked=id=>campaignMode==='legacy'?CHAPTERS.some(c=>c.id===id&&c.available):id===1101||id===1201&&readJourney().completed;
const recordFor=id=>campaignMode==='legacy'?sagaRecord(saga,id):({... (id===1101?readJourney():readRaditz()),bestCombo:0,orbs:0});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
const enemyRects=[
  [12,0,253,286],[316,0,253,286],[610,4,250,285],[887,6,292,283],[1220,5,239,285],[1476,180,298,110],
  [19,302,223,277],[295,300,280,279],[603,299,278,282],[892,300,290,278],[1217,300,245,280],[1481,478,292,103],
  [0,584,291,303],[310,578,280,309],[607,556,277,331],[888,634,303,253],[1189,591,292,296],[1480,724,294,163]
];

function resize(){
  const r=stage.getBoundingClientRect();H=540;W=Math.max(350,Math.round(H*r.width/r.height));
  canvas.setAttribute('aria-label',engine.level.name+', jogo de plataforma e combate');canvas.width=Math.round(W);canvas.height=H;ctx.imageSmoothingEnabled=false;
  if(engine.versus)engine.fitVersusArena(W);
  cam=clamp(cam,0,Math.max(0,WORLD.width-W));
  ambient=Array.from({length:38},(_,i)=>({x:(i*131.7)%W,y:(i*79.3)%430,s:1+(i%3),v:8+(i%7)*2,t:i*1.7}));
}
new ResizeObserver(resize).observe(stage);resize();
for(let i=0;i<7;i++){const o=document.createElement('i');$('orb-slots').append(o);}

async function loadAssets(){
  try{
    await Promise.all(['valley','enemies','kai-motion-v2','kai-solar-v2','enemy-defense-v2','forest-v6','saiyans-v6','goku-v8','kaioken-v8','saga-enemies-v8','portraits-v8','namek-map-v13','namek-stage-v13','namek-villains-v13','saiyan-bosses-v21','freeza-v20','combat-world-v21','combo-roster-v22','arrival-coast-v23','arrival-props-v23','coastal-creatures-v23','arrival-rocks-v24','piccolo-v26','gohan-child-v26','village-boy-v27','raditz-finale-v28'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[name]=img;resolve();};img.onerror=()=>reject(new Error(name));img.src=`/assets/${name}.png`;})));
    atlases.base=buildAtlas(images['kai-motion-v2'],6,5);atlases.solar=buildAtlas(images['kai-solar-v2'],6,5);atlases.defense=buildAtlas(images['enemy-defense-v2'],6,3);atlases.saiyans=buildAtlas(images['saiyans-v6'],6,3);
    atlases.raditzFinale=buildRaditzAtlas(images['raditz-finale-v28']);
    atlases.comboRoster=buildAtlas(images['combo-roster-v22'],6,4);
    for(let row=0;row<4;row++){const height=row===0?105:125,base=atlases.comboRoster.frames[row*6+2].rect[3];for(let i=0;i<6;i++)atlases.comboRoster.frames[row*6+i].scale=height/base;}
    atlases.coastalCreatures=buildAtlas(images['coastal-creatures-v23'],6,2);
    atlases.arrivalProps=buildAtlas(images['arrival-props-v23'],3,2);
    atlases.arrivalRocks=buildAtlas(images['arrival-rocks-v24'],2,2);
    atlases.villageBoy=buildAtlas(images['village-boy-v27'],2,1);
    atlases.piccolo=buildAtlas(images['piccolo-v26'],4,3);atlases.gohan=buildAtlas(images['gohan-child-v26'],3,2);
    atlases.piccolo.scale=116/atlases.piccolo.frames[0].rect[3];atlases.gohan.scale=64/atlases.gohan.frames[0].rect[3];
    atlases.worldFX=gridAtlas(images['combat-world-v21']);
    atlases.freeza=buildAtlas(images['freeza-v20'],6,4);
    atlases.saiyanBosses=buildAtlas(images['saiyan-bosses-v21'],6,3);
    atlases.goku=buildAtlas(images['goku-v8'],6,5);atlases.kaioken=buildAtlas(images['kaioken-v8'],6,5);atlases.sagaEnemies=buildAtlas(images['saga-enemies-v8'],6,5);atlases.namekVillains=buildAtlas(images['namek-villains-v13'],6,6);
    normalizeHeroAtlas(atlases.goku);normalizeHeroAtlas(atlases.kaioken);
    const comboImage=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='/assets/goku-combos-v16.png';});
    atlases.saiyanCombos=buildAtlas(comboImage,6,4);
    atlases.originalEnemies={image:images.enemies,frames:enemyRects.map(rect=>({rect,anchor:.5}))};
    loaded=true;$('start').disabled=false;$('intro-versus').disabled=false;$('intro-legacy').disabled=false;$('start-text').textContent='MAPA DE FASES';drawPortrait();
  }catch{
    $('start-text').textContent='TENTAR CARREGAR NOVAMENTE';$('start').disabled=false;
    $('start').onclick=()=>{if(!loaded){$('start').disabled=true;loadAssets();}};
    showToast('Não foi possível carregar as imagens. Toque para tentar novamente.');
  }
}
loadAssets();

const fighterAtlases=new Map();
function fighterAtlas(fighter){
  if(fighterAtlases.has(fighter.id))return fighterAtlases.get(fighter.id);
  const source=atlases[fighter.atlas],frames=fighter.full||fighter.frames?source.frames:source.frames.slice(fighter.row*6,fighter.row*6+6);
  const atlas={image:source.image,frames,scale:fighter.height/frames[0].rect[3]};fighterAtlases.set(fighter.id,atlas);return atlas;
}
for(const side of ['player','cpu']){
  for(const f of VERSUS_FIGHTERS){const option=document.createElement('option');option.value=f.id;option.textContent=f.name;$('versus-'+side).append(option);}
  $('versus-'+side).value=side==='player'?'goku':'vegeta';$('versus-'+side).addEventListener('change',renderVersusSelection);
}
function renderVersusSelection(){
  if(!loaded)return;
  for(const side of ['player','cpu']){
    const fighter=versusFighter($('versus-'+side).value),atlas=fighterAtlas(fighter),canvas=$('versus-'+side+'-art'),c=canvas.getContext('2d');
    c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
    const [sx,sy,w,h]=atlas.frames[0].rect,scale=Math.min(260/w,200/h);c.save();c.translate(180,220);if(side==='cpu')c.scale(-1,1);c.drawImage(atlas.image,sx,sy,w,h,-w*scale/2,-h*scale,w*scale,h*scale);c.restore();
    $('versus-'+side+'-style').textContent=fighter.style;$('versus-'+side+'-special').textContent=fighter.technique+' · 40 KI';
  }
}
function openVersus(){
  if(!loaded)return;engine.pause();clearInput();sound.unlock();
  for(const id of ['intro','menu','world-map','controls-modal','dialogue-panel','skills-modal'])$(id).hidden=true;
  $('versus-select').hidden=false;renderVersusSelection();syncScreen();$('versus-player').focus({preventScroll:true});
}
function closeVersus(){
  $('versus-select').hidden=true;$('intro').hidden=false;engine.mode='intro';clearInput();syncScreen();$('intro-versus').focus({preventScroll:true});
}
function beginVersus(){
  duelCamera.reset();heroAnimator.reset();$('finish-title').hidden=true;
  if(!loaded)return;sound.unlock();clearInput();
  engine.startVersus($('versus-player').value,$('versus-cpu').value,$('versus-arena').value);
  particlePool.clear();particles=particlePool.items;effects=[];trails=[];cam=500;cameraZoom=1;baseZoom=1;zoomImpulse=0;flash=0;shake=0;
  for(const id of ['versus-select','intro','menu','world-map','controls-modal','skills-modal','dialogue-panel'])$(id).hidden=true;
  document.body.dataset.level='101';document.body.dataset.saga=engine.story.saga;document.body.classList.remove('transformed');
  drawPortrait();hudUpdate();resize();canvas.setAttribute('aria-label','VERSUS: '+engine.versus.player.name+' contra '+engine.versus.opponent.name);stage.focus({preventScroll:true});window.scrollTo(0,0);
}
$('intro-versus').addEventListener('click',openVersus);$('versus-back').addEventListener('click',closeVersus);$('versus-play').addEventListener('click',beginVersus);
$('versus-swap').addEventListener('click',()=>{const a=$('versus-player'),b=$('versus-cpu');[a.value,b.value]=[b.value,a.value];renderVersusSelection();});
$('versus-random').addEventListener('click',()=>{for(const side of ['player','cpu'])$('versus-'+side).value=VERSUS_FIGHTERS[Math.floor(Math.random()*VERSUS_FIGHTERS.length)].id;renderVersusSelection();});
const versusMenuButton=document.createElement('button');versusMenuButton.id='menu-versus';versusMenuButton.className='secondary-button';versusMenuButton.textContent='TROCAR PERSONAGENS';versusMenuButton.hidden=true;versusMenuButton.addEventListener('click',openVersus);$('restart').after(versusMenuButton);

function begin(stageId=engine.stageId){
  if([1102,1103].includes(stageId))stageId=1101;
  duelCamera.reset();heroAnimator.reset();$('finish-title').hidden=true;
  if(!getStage(stageId)?.available||!unlocked(stageId))return;
  if(!loaded)return;if(touch&&!document.body.classList.contains('immersive'))enterFullscreen();sound.unlock();clearInput();engine=campaignMode==='legacy'?new GameEngine():new JourneyEngine();engine.start(stageId,{...saga,arrivalCheckpoint:readArrival()});particlePool.clear();particles=particlePool.items;effects=[];trails=[];cam=0;cameraZoom=1;zoomImpulse=0;
  $('versus-select').hidden=true;$('world-map').hidden=true;$('intro').hidden=true;$('menu').hidden=true;$('controls-modal').hidden=true;$('pause').hidden=false;
  document.body.dataset.level=String(stageId);document.body.dataset.saga=engine.story?.saga||'saiyan';canvas.setAttribute('aria-label',engine.level.name+', jogo de plataforma e combate');document.body.classList.remove('transformed');stage.focus({preventScroll:true});window.scrollTo(0,0);hudUpdate();
  drawPortrait();
}
$('start').addEventListener('click',()=>{campaignMode='story';openMap();});
$('intro-legacy').addEventListener('click',()=>{campaignMode='legacy';storySaga='saiyan';openMap();});
$('map-saga').addEventListener('click',()=>{if(campaignMode!=='legacy')return;storySaga=storySaga==='saiyan'?'freeza':'saiyan';selectedStage=storyStages()[0].id;renderMap();});
$('map-back').addEventListener('click',closeMap);
$('map-play').addEventListener('click',()=>{if(getStage(selectedStage)?.available&&unlocked(selectedStage))begin(selectedStage);});
$('victory-map').addEventListener('click',openMap);
$('intro-controls').addEventListener('click',openControls);
$('menu-home').addEventListener('click',()=>{engine.pause();clearInput();$('menu').hidden=true;$('intro').hidden=false;syncScreen();});
$('restart').addEventListener('click',()=>engine.versus?beginVersus():begin(engine.stageId));
$('resume').addEventListener('click',()=>{engine.resume();$('menu').hidden=true;clearInput();sound.unlock();stage.focus({preventScroll:true});});
$('pause').addEventListener('click',togglePause);
$('sound').addEventListener('click',()=>{const on=sound.toggle();$('sound').setAttribute('aria-pressed',String(on));$('sound').setAttribute('aria-label',on?'Desativar som':'Ativar som');});
for(const id of ['help','more-controls','menu-controls'])$(id).addEventListener('click',openControls);
for(const id of ['close-controls','controls-done'])$(id).addEventListener('click',closeControls);
async function enterFullscreen(){
  document.body.classList.add('immersive');
  try{if(!document.fullscreenElement&&$('app').requestFullscreen)await $('app').requestFullscreen();}catch{}
  try{if(touch&&document.fullscreenElement&&screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{}
  syncFullscreen();
}
async function toggleFullscreen(){
  if(document.body.classList.contains('immersive')||document.fullscreenElement){
    try{if(document.fullscreenElement)await document.exitFullscreen();}catch{}
    document.body.classList.remove('immersive');
    try{screen.orientation?.unlock?.();}catch{}
    syncFullscreen();
  }else await enterFullscreen();
}
function syncFullscreen(){
  const active=!!document.fullscreenElement||document.body.classList.contains('immersive');
  $('fullscreen').setAttribute('aria-pressed',String(active));
  $('fullscreen').setAttribute('aria-label',active?'Sair da tela cheia':'Tela cheia');
  $('menu-fullscreen').textContent=active?'SAIR DA TELA CHEIA':'TELA CHEIA';
}
for(const id of ['fullscreen','intro-fullscreen','menu-fullscreen'])$(id).addEventListener('click',toggleFullscreen);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('immersive');syncFullscreen();});
function syncScreen(){
  const playing=engine.mode==='playing'&&$('world-map').hidden&&$('intro').hidden&&$('menu').hidden&&$('controls-modal').hidden&&!touchLayout?.editing&&$('skills-modal').hidden&&!engine.dialogue;
  document.body.dataset.screen=playing?'playing':!$('intro').hidden?'intro':'menu';
  document.body.classList.toggle('minimal-combat',engine.saiyanCombat);
  document.body.classList.toggle('versus-mode',!!engine.versus);
  const touchVisible=playing&&!document.body.classList.contains('using-controller');if($('touch-controls').hidden===touchVisible)$('touch-controls').hidden=!touchVisible;
  if($('pause').hidden===playing)$('pause').hidden=!playing;
  if(!playing&&touchLayout?.powers){touchLayout.powers=false;$('touch-controls').classList.remove('powers-open');$('touch-powers').setAttribute('aria-expanded','false');$('touch-powers').textContent='+ PODERES';clearInput();}
}
new MutationObserver(syncScreen).observe($('stage'),{subtree:true,attributes:true,attributeFilter:['hidden']});

function clearInput(){controller.suppress();keyboard.reset();keys.clear();pointers.clear();engine.inputBuffer={};engine.p.queued=null;Object.keys(pressed).forEach(k=>delete pressed[k]);document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('held'));}
function getInput(){
  const gamepad=pollController(),kb=keyboard.poll(keys),data={pressed:{...gamepad.pressed,...kb.pressed,...pressed}};
  for(const source of [gamepad,kb])for(const [action,value] of Object.entries(source))if(action!=='pressed'&&value)data[action]=true;
  for(const a of pointers.values())data[a]=true;
  Object.keys(pressed).forEach(k=>delete pressed[k]);
  if(kb.pressed.zoom){baseZoom=baseZoom===1?1.15:1;}
  return data;
}
window.addEventListener('keydown',e=>{
  document.body.classList.remove('using-controller');
  if(!$('versus-select').hidden&&$('controls-modal').hidden){
    if(e.code==='Escape'){e.preventDefault();closeVersus();}
    if(e.code==='Tab'){const items=[...$('versus-select').querySelectorAll('button,select')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    return;
  }
  if(engine.battle?.scene){if(['Escape','Enter','Space'].includes(e.code)){e.preventDefault();if(!e.repeat){if(e.code==='Escape')engine.finishBattleScene();else engine.battle.scenePaused?engine.resume():engine.pause();clearInput();}}return;}
  if(engine.dialogue){if(['Enter','ArrowDown','ArrowLeft','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat){engine.advanceDialogue(e.code==='Escape');clearInput();}}return;}
  if(!$('skills-modal').hidden){if(e.code==='Escape'){e.preventDefault();closeSkills();}return;}
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
  if(touchLayout?.editing){if(e.code==='Escape')touchLayout.close();return;}
  if(engine.mode!=='playing'&&e.target instanceof HTMLButtonElement&&['Space','Enter'].includes(e.code))return;
  if(keyMap[e.code]||['Escape','Enter','F3'].includes(e.code))e.preventDefault();
  if(e.code==='F3'&&!e.repeat){debugCombat=!debugCombat;showToast(debugCombat?'DEPURAÇÃO DE COMBATE ATIVA':'DEPURAÇÃO DE COMBATE DESATIVADA');return;}
  if(e.code==='Escape'){if(!$('world-map').hidden){closeMap();return;}if(!$('controls-modal').hidden)closeControls();else togglePause();return;}
  if(e.code==='Enter'&&!$('intro').hidden){openMap();return;}
  if(!$('world-map').hidden)return;
  const action=keyMap[e.code];if(action&&engine.mode==='playing'){if(!keys.has(e.code)){keys.add(e.code);keyboard.change(keys);}}
});
stage.addEventListener('pointerdown',()=>{document.body.classList.remove('using-controller');syncScreen();});
window.addEventListener('keyup',e=>{if(keys.delete(e.code))keyboard.change(keys);});
touchLayout=new TouchLayout($('touch-controls'),{clear:clearInput,pause:()=>{if(engine.mode==='playing')engine.pause();clearInput();helpWasPlaying=false;if(engine.mode==='paused')showMenu('paused');},onClose:()=>clearInput()});
for(const button of document.querySelectorAll('[data-action]')){
  button.addEventListener('pointerdown',e=>{document.body.classList.remove('using-controller');e.preventDefault();if(touchLayout.editing||engine.mode!=='playing')return;sound.unlock();button.setPointerCapture(e.pointerId);const action=button.dataset.action;pointers.set(e.pointerId,action);pressed[action]=true;button.classList.add('held');});
  const up=e=>{if(pointers.get(e.pointerId)==='jump')pressed.jumpRelease=true;pointers.delete(e.pointerId);button.classList.remove('held');};
  button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);button.addEventListener('contextmenu',e=>e.preventDefault());
}
window.addEventListener('blur',()=>{clearInput();if(engine.mode==='playing'){engine.pause();showMenu('paused');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(engine.mode==='playing'){engine.pause();showMenu('paused');}}last=0;accumulator=0;});
function togglePause(){if(engine.battle?.scene){engine.battle.scenePaused?engine.resume():engine.pause();return;}if(engine.dialogue||!$('skills-modal').hidden)return;if(!$('versus-select').hidden||!$('world-map').hidden||!$('intro').hidden||touchLayout?.editing)return;if(engine.mode==='playing'){engine.pause();clearInput();showMenu('paused');}else if(engine.mode==='paused'&&$('controls-modal').hidden){engine.resume();$('menu').hidden=true;}}
function openControls(){if(engine.dialogue||!$('skills-modal').hidden)return;setControlGuide(controllerConnected?'xbox':'keyboard');helpWasPlaying=engine.mode==='playing';if(helpWasPlaying)engine.pause();clearInput();$('controls-modal').hidden=false;}
function closeControls(){$('controls-modal').hidden=true;if(helpWasPlaying){engine.resume();$('menu').hidden=true;}helpWasPlaying=false;clearInput();}
function showMenu(mode){
  if(engine.battle){$('menu').hidden=false;$('resume').hidden=mode!=='paused';$('victory-map').hidden=mode!=='won';$('menu-skills').hidden=true;$('menu-versus').hidden=true;$('menu-controls').hidden=mode==='won';$('menu-eyebrow').textContent='ÉPISÓDIO 2 · RADITZ';$('menu-title').textContent=mode==='won'?'O SACRIFÍCIO DE GOKU':mode==='dead'?'TENTE ESTA ETAPA NOVAMENTE':'PAUSADO';$('menu-description').textContent=mode==='won'?'Gohan está salvo. Goku e Raditz morreram. Dois Saiyajins chegarão em um ano. Próximo episódio: o Outro Mundo.':'Retome a luta a partir da última troca de personagem.';$('restart').textContent=mode==='won'?'JOGAR NOVAMENTE':'RETOMAR CHECKPOINT';$('result-stats').textContent=mode==='won'?formatTime(engine.time)+' · Outro Mundo preparado':'ETAPA '+(engine.battle.step+1)+' DE 4';return;}

  if(engine.journey){$('menu').hidden=false;$('resume').hidden=mode!=='paused';$('victory-map').hidden=mode!=='won';$('menu-skills').hidden=true;$('menu-versus').hidden=true;$('menu-controls').hidden=mode==='won';$('menu-eyebrow').textContent='EPISÓDIO 1 · A CHEGADA DE RADITZ';$('menu-title').textContent=mode==='won'?'MISSÃO CONCLUÍDA':mode==='dead'?'RETOMAR CHECKPOINT':'PAUSADO';$('menu-description').textContent=mode==='won'?'A jornada até Raditz está concluída. A batalha em equipe será a próxima missão.':'Continue do último checkpoint da jornada.';$('restart').textContent=mode==='won'?'JOGAR NOVAMENTE':'RETOMAR CHECKPOINT';$('result-stats').textContent=mode==='won'?formatTime(engine.time)+' · Costa, montanhas e resgate':'';return;}
  if(engine.episode){$('menu').hidden=false;$('resume').hidden=mode!=='paused';$('victory-map').hidden=mode!=='won';$('menu-skills').hidden=true;$('menu-versus').hidden=true;$('menu-controls').hidden=mode==='won';$('menu-eyebrow').textContent=engine.story.biome;$('menu-title').textContent=mode==='won'?'FASE CONCLUÍDA':mode==='dead'?'RETOMAR CHECKPOINT':'PAUSADO';$('menu-description').textContent=mode==='won'?(engine.stageId===1102?'A fase 1.3 — O resgate de Gohan está disponível no mapa.':'A aproximação está pronta. A batalha com Raditz será a fase 2.1, em desenvolvimento.'):'Continue a partir do último objetivo salvo.';$('restart').textContent=mode==='won'?'JOGAR NOVAMENTE':'RETOMAR CHECKPOINT';$('result-stats').textContent=mode==='won'?formatTime(engine.time)+' · '+engine.story.objectives.length+' objetivos concluídos':'';return;}

  if(engine.versus){
    $('menu').hidden=false;$('resume').hidden=mode!=='paused';$('victory-map').hidden=true;$('menu-skills').hidden=true;$('menu-controls').hidden=false;$('menu-versus').hidden=false;
    $('menu-eyebrow').textContent='VERSUS · '+engine.versus.player.name+' × '+engine.versus.opponent.name;
    $('menu-title').textContent=mode==='paused'?'PAUSADO':mode==='won'?'VITÓRIA':'DERROTA';
    $('menu-description').textContent=mode==='paused'?'O duelo continua quando você estiver pronto.':(mode==='won'?engine.versus.player.name:engine.versus.opponent.name)+' venceu por nocaute.';
    $('restart').textContent='REVANCHE';$('result-stats').textContent=mode==='paused'?'':'TEMPO '+formatTime(engine.time)+' · MAIOR COMBO '+engine.maxCombo;return;
  }
  $('menu-versus').hidden=true;
  $('menu-skills').hidden=!engine.story;
  $('victory-map').hidden=mode!=='won';
  $('menu').hidden=false;$('resume').hidden=mode!=='paused';$('menu-controls').hidden=mode==='won';$('result-stats').textContent='';
  const labels={paused:['RESPIRE. DEPOIS, CONTINUE.','PAUSADO','Seu próximo golpe pode mudar a luta.'],dead:['CAIR TAMBÉM FAZ PARTE.','MAIS UMA VEZ?','Use a esquiva e observe a preparação dos inimigos.'],won:['7 ESFERAS. PODER COMPLETO.',engine.stageId===2?'FLORESTA CONQUISTADA':'VALE CONQUISTADO','Fase concluída. Veja seu progresso no mapa e tente superar seu melhor combo.']};
  if(engine.saiyanCombat){labels.paused=['','PAUSADO',''];labels.dead=['','DERROTADO',''];}
  if(engine.story&&mode==='won'){const final=engine.story.saga==='freeza'?engine.story.chapter===4:engine.story.chapter===3;labels.won=[`FASE ${engine.story.sagaNumber||1} · CAPÍTULO ${engine.story.chapter}`,engine.story.bossName+' VENCIDO',final?(engine.story.saga==='freeza'?'Saga Freeza concluída. Namekusei foi salvo.':'Saga Saiyajin concluída. Namekusei foi desbloqueado.'):(lastStoryReward?'Próximo capítulo desbloqueado. Você recebeu 4 pontos de habilidade.':'Resultado registrado. Suas habilidades continuam disponíveis no mapa.')];}
  if(engine.arrival){labels.won=['EPISÓDIO 1 / FASE 1.1','UM PODER DESCONHECIDO','Gohan foi levado. A fase 1.2 — Uma aliança improvável está disponível no mapa.'];labels.dead=['CHECKPOINT DISPONÍVEL','NÃO DESISTA','Você pode retomar do último objetivo concluído.'];}
  const t=labels[mode];$('menu-eyebrow').textContent=t[0];$('menu-title').textContent=t[1];$('menu-description').textContent=mode==='won'&&engine.stageId===1?'Floresta Celeste desbloqueada! Enfrente a patrulha saiyajin na fase 2.':t[2];$('restart').textContent=mode==='won'?'JOGAR NOVAMENTE':'RECOMEÇAR A FASE';
  if(engine.arrival){$('restart').textContent=mode==='won'?'JOGAR NOVAMENTE':'RETOMAR CHECKPOINT';$('menu-skills').hidden=true;if(mode==='won')$('result-stats').textContent=`4 objetivos · 2 encontros · ${formatTime(engine.time)}`;return;}
  if(mode!=='paused')for(const [value,label] of [[formatTime(engine.time),'TEMPO'],[engine.maxCombo,'MAIOR COMBO'],[engine.collected+'/7','ESFERAS']]){const d=document.createElement('div'),s=document.createElement('strong');s.textContent=value;d.append(s,document.createTextNode(label));$('result-stats').append(d);}
}
function showToast(text){if(engine.mode==='playing'||engine.saiyanCombat&&engine.mode==='dialogue')return;$('toast').textContent=text;$('toast').classList.add('show');toastTime=3.1;}
function showZone(title,subtitle){if(engine.saiyanCombat)return;$('zone-toast').querySelector('strong').textContent=title;$('zone-toast').querySelector('span').textContent=subtitle;$('zone-toast').classList.add('show');zoneTime=3;}
function formatTime(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;}

function hudUpdate(){
  syncScreen();
  updateArrivalHud(engine,document,controllerConnected);
  document.body.classList.toggle('child-segment',!!engine.episode&&engine.p.character==='gohan');updateEpisodeHud(engine,document);
  if(engine.journey)$('arrival-step').textContent='EPISÓDIO 1 / '+String(Math.min(12,Math.round(engine.progress*12)+1)).padStart(2,'0')+' DE 12';
  const p=engine.p;const specialCost=engine.story?(engine.skills.has('kame')?32:40):p.form?28:40;$('special-fill').style.width=Math.min(100,p.ki/specialCost*100)+'%';$('special-fill').parentElement.classList.toggle('ready',p.ki>=specialCost);$('health-fill').style.width=100*p.hp/engine.maxHp+'%';$('ki-fill').style.width=p.ki+'%';
  $('health-text').textContent=`${Math.ceil(p.hp)} / ${engine.maxHp}`;$('ki-text').textContent=p.form?`KI ${Math.floor(p.ki)} · ${Math.ceil(p.formTime)}s`:`KI ${Math.floor(p.ki)} / 100`;
  $('hero-name').textContent=engine.episode||engine.battle?EPISODE_ACTORS[p.character].name:engine.versus?engine.versus.player.name.toUpperCase():engine.story?'GOKU':'KAI';
  $('form-label').textContent=engine.story?(p.form?`KAIOKEN ×${engine.kaiokenLevel} · DESGASTE ${Math.round(p.formFatigue)}%`:p.formCooldown>0?`RECUPERANDO ${Math.ceil(p.formCooldown)}s`:engine.story.chapter===1?'FORMA BASE':p.ki>=60?'KAIOKEN '+(controllerConnected?'[R3]':'[T]'):'FORMA BASE'):p.form?'ASCENSÃO SOLAR':p.ki>=100?(controllerConnected?'DESPERTAR [R3]':'DESPERTAR [T]'):'FORMA BASE';
  $('orb-total').textContent=engine.collected;Array.from($('orb-slots').children).forEach((o,i)=>o.classList.toggle('collected',engine.orbs.some(v=>v.id===i+1&&v.got)));
  $('orb-slots').setAttribute('aria-label',`${engine.collected} de 7 esferas`);
  $('progress-fill').style.width=engine.progress*100+'%';$('progress-dot').style.left=engine.progress*100+'%';$('timer').textContent=formatTime(engine.time);
  $('zone-eyebrow').textContent=engine.story?`FASE ${engine.story.sagaNumber||1} · CAPÍTULO ${engine.story.chapter}`:String(engine.stageId).padStart(2,'0')+' / '+engine.level.name;$('zone-name').textContent=engine.level.zones[engine.zone];$('boss-name').textContent=engine.boss.storyBoss==='vegeta'&&engine.boss.phase===2?'VEGETA · OOZARU':engine.level.bossName;
  $('combo').classList.toggle('show',engine.combo>=2);$('combo-count').textContent=engine.combo;$('combo-caption').textContent=engine.combo>=20?'IMPLACÁVEL':engine.combo>=10?'SEM LIMITES':engine.combo>=5?'NÃO PARE':'BOM COMEÇO';
  $('boss-hud').hidden=!engine.bossAwake||engine.bossDefeated;$('boss-fill').style.width=100*engine.boss.hp/engine.boss.maxHp+'%';$('boss-hp').textContent=`${engine.boss.hp} / ${engine.boss.maxHp}`;
  $('objective').textContent=engine.collected===7?'SIGA ATÉ O PORTAL':engine.bossDefeated?`ENCONTRE AS ${7-engine.collected} ESFERAS RESTANTES`:'REÚNA AS 7 ESFERAS';
  let direction='SIGA EM FRENTE';
  const missing=engine.orbs.filter(o=>!o.got&&o.x<engine.p.x-160).sort((a,b)=>b.x-a.x)[0];
  if(missing)direction='ESFERA PARA TRÁS';else if(engine.bossAwake&&!engine.bossDefeated)direction='DERROTE O GUARDIÃO';else if(engine.collected===7)direction='SIGA ATÉ O PORTAL';
  $('direction').textContent=direction;$('direction').hidden=engine.mode!=='playing';
  $('touch-transform').style.borderColor=p.ki>=(engine.story?60:100)?'#ffc470':'';
  const a=p.attack,windowOpen=a&&a.t>=a.move.end-.045&&a.t<=a.move.end+.095;
  $('timing-cue').textContent=engine.saiyanCombat&&!engine.versus?.finish?(p.riposteWindow>0?'APARO · X / GOLPE PARA RESPONDER!':p.stun>0?(p.escapeCooldown>0?'RECUPERAÇÃO EM '+p.escapeCooldown.toFixed(1)+'s':'DEFESA / ESQUIVA · RECUPERAR 25 KI'):a?.connected&&a.step===0?'Y · PRESSÃO  |  ↑ + Y · ELEVAR 14 KI':a?.connected&&a.step>=1?'CHUTE · AFASTAR  |  ELEVAR · 14 KI  |  KAME · '+(engine.skills.has('kame')?32:40)+' KI':''):'';
  $('dash-name').textContent=p.chainWindow>0&&p.ki>=15?'SEGUIR':'ESQUIVA';
  $('technique-name').textContent=p.grounded?'ELEVAR':'QUEDA';
  $('special-name').textContent=engine.versus?'ESPECIAL':engine.story?'KAME':p.form?'EXPLOSÃO':'ESPECIAL';
  if(engine.activeEncounter)$('objective').textContent=`ARENA · ${engine.enemies.filter(e=>engine.activeEncounter.ids.includes(e.id)&&e.hp>0).length} INIMIGOS`;
  if(engine.activeEncounter)$('direction').textContent='LIMPE A ARENA';
  const guidance=worldGuidance(engine);$('direction').textContent=guidance?(guidance.x<p.x?'← ':'→ ')+guidance.label:'';
  updateRaditzHud(engine);
  if(engine.episode){$('special-name').textContent=EPISODE_ACTORS[p.character].technique;$('form-label').textContent='EPISÓDIO 1';if(p.character==='gohan')$('timing-cue').textContent='';}
}

function burst(x,y,n,color,power=170,gravity=300){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=power*(.2+Math.random()),life=.22+Math.random()*.35;particlePool.spawn({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,size:1+Math.random()*3,color,gravity});}
}
function ring(x,y,color,r=15,life=.4){effects.push({type:'ring',x,y,color,r,life,max:life});}
function processEvents(){
  const events=engine.events.splice(0);
  for(const e of events){
    sound.play(e.type,e.heavy);
    const feedback=impactFeedback[e.type];
    if(feedback){effects=effects.filter(f=>!(f.type==='feedback'&&f.text===feedback.label&&Math.abs(f.x-e.x)<100));const profile=e.type==='parry'?'parry':e.type.includes('Break')?'break':'guard',duration=effectDuration[profile];effects.push({type:'spriteFX',profile,frame:feedback.frame,x:e.x,y:e.y,size:feedback.size,life:duration,max:duration});effects.push({type:'feedback',x:e.x,y:e.y-65,text:feedback.label,color:feedback.color,life:.75,max:.75});if(e.type.includes('Break'))shake=Math.max(shake,2.8);continue;}
    const fx={hit:e.heavy?9:8,playerHit:9,land:14,rockBreak:2,terrainImpact:14,swing:13,saiyanImpact:9,groundFinish:9,groundBounce:14,wallImpact:9};
    if(e.type in fx){const profile=effectProfile(e.type,e.heavy),duration=effectDuration[profile];effects.push({type:'spriteFX',profile,frame:fx[e.type],dir:e.dir,style:e.style,x:e.x,y:e.y-(e.type==='land'?15:0),size:e.type==='hit'?(e.heavy?95:55):e.type==='swing'?55:95,life:duration,max:duration});if(['hit','playerHit','groundFinish','wallImpact'].includes(e.type))shake=Math.max(shake,e.heavy?2.4:.65);if(e.type==='land')landingPulse=1;if(['hit','playerHit'].includes(e.type))controller.rumble(e.heavy?.35:.12,e.heavy?160:65);continue;}
    if(['hit','playerHit','beam','solarBurst','vanish','enemyVanish','wallImpact','groundBounce'].includes(e.type))controller.rumble(e.type==='hit'?(e.heavy?.35:.12):.55,e.type==='hit'?65:160);
    switch(e.type){
      case 'dialogue':clearInput();renderDialogue();break;
      case 'dialogueEnd':$('dialogue-panel').hidden=true;clearInput();syncScreen();break;
      case 'enemyBeam':effects.push({type:'beam',x:e.x,y:e.y,dir:e.dir,enemy:true,life:effectDuration.beam,max:effectDuration.beam});shake=10;break;
      case 'genkiCharge':ring(e.x,e.y,'#c8f6ff',45,1.2);break;
      case 'genki':effects.push({type:'genki',x:e.x+engine.p.dir*150,y:e.y,life:Math.min(.22,effectDuration.genki),max:Math.min(.22,effectDuration.genki)});burst(e.x,e.y,12,'#b8f8ff',130);shake=4;sound.play('beam');break;
      case 'hazardHit':burst(e.x,e.y,18,'#ff963c',180);break;
      case 'toast':showToast(controllerConnected?(e.text.replaceAll('WASD','ANALÓGICO').replaceAll('E:','RB:').replaceAll('←:','X:').replaceAll('Ctrl','LT').replaceAll('Aperte T','Pressione R3')):touch&&e.mobile?e.mobile:e.text);break;
      case 'zone':showZone(e.title,e.subtitle);break;
      case 'zoneSmall':if(engine.story){showToast(engine.level.zones[e.zone]+' · Observe os perigos e procure as esferas.');break;}showToast(engine.stageId===2?(e.zone===1?'COPAS CELESTES · Use o pulo duplo para alcançar a esfera.':'RUÍNAS DA PATRULHA · A próxima esfera está no alto.'):e.zone===1?'CAMINHO LIVRE · Pule novamente no ar para alcançar a esfera.':'ESCADARIA CELESTE · Suba pelas plataformas com o pulo duplo.');break;
      case 'hit':{
        if(e.perfect||e.heavy)ring(e.x,e.y,e.perfect?'#8bffe1':'#ffc46c',e.heavy?48:32,.2);
        const col=e.gold?'#ffe599':'#fff1ad';burst(e.x,e.y,e.heavy?32:19,col,e.heavy?330:215);burst(e.x,e.y,8,'#fcaa51',180);
        effects.push({type:'hit',x:e.x,y:e.y,life:.15,max:.15,heavy:e.heavy,dir:e.dir});effects.push({type:'number',x:e.x,y:e.y-30,text:String(e.damage),color:e.gold?'#fff28d':'#fff1bd',life:.65,max:.65,heavy:e.heavy});if(e.heavy){effects.push({type:'impactRays',x:e.x,y:e.y,life:.22,max:.22});zoomImpulse=Math.max(zoomImpulse,.03);}shake=Math.max(shake,e.heavy?7:2.5);break;
      }
      case 'swing':effects.push({type:e.style?'comboArc':'slash',style:e.style,x:e.x+e.dir*42,y:e.y,dir:e.dir,step:e.step,life:.18,max:.18});break;
      case 'saiyanImpact':effects.push({...e,type:'comboImpact',life:e.heavy?.23:.14,max:e.heavy?.23:.14});break;
      case 'vanish':case 'enemyVanish':effects.push({type:'pursuit',x:e.x,y:e.y,fromX:e.fromX,fromY:e.fromY,life:.28,max:.28,enemy:e.type==='enemyVanish'});ring(e.fromX,e.fromY-40,e.type==='enemyVanish'?'#bf9bff':'#9df4ff',30,.25);ring(e.x,e.y,e.type==='enemyVanish'?'#e1b8ff':'#fff5ad',35,.3);burst(e.x,e.y,26,e.type==='enemyVanish'?'#bb82ff':'#b8f5ff',250);break;
      case 'aerialFinish':effects.push({type:'number',x:e.x,y:e.y-25,text:'QUEBRA AÉREA',color:'#ffdc8e',life:.7,max:.7,heavy:true});ring(e.x,e.y,'#ffdf8c',60,.4);break;
      case 'specialCharge':effects.push({type:'cutin',x:engine.p.x,y:engine.p.y,solar:engine.p.form,life:.28,max:.28});ring(engine.p.x,engine.p.y-40,'#8fffff',45,.35);break;
      case 'dash':burst(e.x,e.y+30,14,'#cfe5bf',95);ring(e.x,e.y,'#c7eed8',15,.25);break;
      case 'jump':case 'land':landingPulse=e.type==='land'?1:0;burst(e.x,e.y,10,e.second?'#b7f4e4':'#d7d2a0',e.second?100:65,110);if(e.second)ring(e.x,e.y,'#c8fff1',20,.3);break;
      case 'step':burst(e.x,e.y,3,'#c2c897',35,120);break;
      case 'orb':burst(e.x,e.y,27,'#ffd77d',170,40);ring(e.x,e.y,'#ffeab6',25,.5);break;
      case 'playerHit':shake=8;flash=.13;flashColor='#ef6158';burst(e.x,e.y,18,'#ff9b66',180);break;
      case 'parry':ring(e.x,e.y,'#c9ffff',36,.4);burst(e.x,e.y,30,'#b7ffff',300);shake=4;break;
      case 'guard':ring(e.x,e.y,'#a0eddf',23,.22);burst(e.x,e.y,7,'#c0ffee',100);break;
      case 'beam':effects.push({type:'beam',x:e.x,y:e.y,dir:e.dir,gold:e.gold,life:effectDuration.beam,max:effectDuration.beam});burst(e.x,e.y,30,e.gold?'#ffe290':'#b3fff4',350);shake=12;flash=.11;flashColor='#ecffff';break;
      case 'transform':flash=.38;flashColor=engine.story?'#ff7463':'#fff3cb';shake=14;ring(e.x,e.y,engine.story?'#ff8275':'#ffe8a8',80,.8);burst(e.x,e.y,70,engine.story?'#ff584b':'#ffd56c',360,-60);document.body.classList.add('transformed');showZone(engine.story?'KAIOKEN ×'+engine.kaiokenLevel:'ASCENSÃO SOLAR',engine.story?'Poder ampliado. Controle o consumo de energia.':'16 segundos de poder. Golpes e especial amplificados.');drawPortrait();break;
      case 'formEnd':document.body.classList.remove('transformed');drawPortrait();break;
      case 'perfect':effects.push({type:'number',x:e.x,y:e.y,text:'PERFEITO',color:'#bfffe3',life:.6,max:.6});break;
      case 'launcher':ring(e.x,e.y,'#e4ffbc',30,.4);burst(e.x,e.y,22,'#fff2a6',220);break;
      case 'rockBreak':burst(e.x,e.y,14,'#afa187',180,450);break;
      case 'terrainImpact':burst(e.x,e.y,12,'#c5b699',160,230);break;
      case 'chargeBreak':ring(e.x,e.y,'#e28ed8',28,.2);break;
      case 'groundFinish':shake=10;ring(e.x,e.y,'#fff0b5',58,.4);burst(e.x,e.y,32,'#e8d1a0',270,650);break;
      case 'groundBounce':shake=8;zoomImpulse=Math.max(zoomImpulse,.035);ring(e.x,e.y,'#ffc975',48,.35);burst(e.x,e.y,28,'#dfba83',260,620);break;
      case 'wallImpact':shake=9;zoomImpulse=Math.max(zoomImpulse,.045);effects.push({type:'impactRays',x:e.x,y:e.y,life:.25,max:.25});burst(e.x,e.y,30,'#ffe1a0',310);break;
      case 'airRecover':ring(e.x,e.y,'#b7f7ff',42,.32);burst(e.x,e.y,24,'#95e8ff',260,40);break;
      case 'playerGuardBreak':showToast('SUA DEFESA QUEBROU · RECUE!');shake=7;burst(e.x,e.y,22,'#ff8f7a',220);break;
      case 'guardRecovery':ring(e.x,e.y,'#9df8ee',32,.24);burst(e.x,e.y,12,'#bffff5',145);break;
      case 'hurtRecover':ring(e.x,e.y,'#bcecff',18,.16);break;
      case 'counterBurst':effects.push({type:'nova',x:e.x,y:e.y,life:.28,max:.28});ring(e.x,e.y,'#fff0a8',72,.3);burst(e.x,e.y,34,'#ffe29a',300);shake=8;showToast('CONTRA-ATAQUE!');break;
      case 'enemyCharge':if(Math.random()<.18)ring(e.x,e.y,'#ba9dff',18,.2);break;
      case 'enemyGuard':ring(e.x,e.y,'#b7bdec',24,.22);burst(e.x,e.y,8,'#c4d5ff',150);break;
      case 'guardBreak':showToast('DEFESA QUEBRADA · Aproveite a abertura!');burst(e.x,e.y,25,'#addbff',220);break;
      case 'enemyEvade':burst(e.x,e.y+30,12,'#adafe6',80);break;
      case 'enemyAirDash':effects.push({type:'enemyDash',x:e.x,y:e.y,dir:e.dir,life:.22,max:.22});burst(e.x,e.y,15,'#b89cff',180,20);break;
      case 'enemyComboCancel':effects.push({type:'enemyDash',x:e.x,y:e.y,dir:engine.p.x>e.x?1:-1,life:.14,max:.14});ring(e.x,e.y,'#d6b4ff',18,.18);break;
      case 'enemyBreaker':effects.push({type:'nova',x:e.x,y:e.y,life:effectDuration.nova,max:effectDuration.nova});ring(e.x,e.y,e.boss?'#ffb36f':'#dfb5ff',64,.32);burst(e.x,e.y,30,e.boss?'#ff975e':'#c894ff',290);shake=e.boss?10:7;showToast(e.repeated?'REPETIÇÃO LIDA · O INIMIGO REVIDOU!':'REVERSÃO DE COMBO · DEFENDA!');break;
      case 'solarBurst':effects.push({type:'nova',x:e.x,y:e.y,life:effectDuration.nova,max:effectDuration.nova});ring(e.x,e.y,'#fff2b3',200,.65);burst(e.x,e.y,70,'#ffd477',380);shake=15;flash=.17;flashColor='#fff2be';break;
      case 'arenaStart':if(e.title!==engine.level.bossName)showZone(e.title,'Observe a defesa. Lance, encadeie e finalize.');break;
      case 'arenaClear':showToast('CAMINHO LIVRE · Reúna as esferas e siga em frente.');break;
      case 'slam':shake=13;burst(e.x,e.y,36,'#d7c68e',300,700);ring(e.x,e.y,'#ffd078',75,.5);break;
      case 'enrage':shake=9;burst(e.x,e.y,30,'#ffbe61',240);break;
      case 'defeat':burst(e.x,e.y,e.boss?70:25,e.boss?'#d9f2a4':'#c6b7ed',e.boss?260:170);if(e.boss){shake=15;flash=.2;flashColor='#fff3c4';}break;
      case 'roundStart':showZone('ROUND '+e.round,'Vença dois rounds para ganhar a partida.');break;
      case 'versusStart':effects=[];trails=[];particlePool.clear();$('finish-title').hidden=true;heroAnimator.reset();duelCamera.reset();break;
      case 'versusFinish':clearInput();$('finish-title').textContent=(e.winner==='player'?'VITÓRIA':'DERROTA')+(engine.versus.matchOver?'':' · ROUND '+engine.versus.round);$('finish-title').dataset.result=e.winner;break;
      case 'versusEnd':clearInput();$('finish-title').hidden=true;showMenu(e.winner==='player'?'won':'dead');break;
      case 'gameover':clearInput();if(engine.versus)showMenu('dead');else setTimeout(()=>showMenu('dead'),650);break;
      case 'characterChanged':clearInput();trails=[];effects=[];particlePool.clear();heroAnimator.reset();duelCamera.reset();cam=clamp(engine.p.x-W*.35,0,Math.max(0,engine.story.width-W));drawPortrait();break;
      case 'journeyCheckpoint':progressSaved=saveJourney({...readJourney(),...e,completed:false}).saved;break;
      case 'episodeCheckpoint':if(engine.journey)break;progressSaved=saveEpisodeCheckpoint(e.id,e.checkpoint,e.time).saved;break;
      case 'makankosappo':effects.push({type:'piccoloBeam',x:e.x,y:e.y,dir:e.dir,life:.35,max:.35});break;
      case 'gohanPulse':ring(e.x,e.y,'#ffca42',40,.6);break;
      case 'arrivalCheckpoint':{if(engine.journey)break;const old=readArrival();progressSaved=saveArrival({...old,checkpoint:e.checkpoint,time:e.time}).saved;if(!progressSaved)engine.arrival.caption='CHECKPOINT NESTA SESSAO';}break;
      case 'raditzCheckpoint':progressSaved=checkpointRaditz(e.checkpoint,e.time).saved;break;
      case 'raditzScene':case 'raditzSceneEnd':clearInput();effects=[];trails=[];duelCamera.reset();syncScreen();break;
      case 'raditzVictory':progressSaved=finishRaditz(e.time).saved;clearInput();showMenu('won');break;
      case 'victory':{if(engine.journey){progressSaved=finishJourney(engine.time).saved;clearInput();showMenu('won');break;}if(engine.episode){progressSaved=completeEpisode(engine.stageId,engine.time).saved;clearInput();showMenu('won');break;}if(engine.arrival){const old=readArrival();progressSaved=saveArrival({...old,completed:true,checkpoint:0,time:0,bestTime:old.bestTime?Math.min(old.bestTime,engine.time):engine.time}).saved;clearInput();showMenu('won');break;}lastStoryReward=engine.story&&!sagaRecord(saga,engine.stageId).completed?4:0;const result=engine.story?finishSaga(saga,engine.stageId,engine.time,engine.maxCombo,engine.collected):recordVictory(campaign,engine.time,engine.maxCombo,engine.stageId);if(engine.story){saga=result.progress;if(engine.stageId===103)storySaga='freeza';}else campaign=result.progress;progressSaved=result.saved;}clearInput();burst(engine.p.x,engine.p.y-60,85,'#ffe4a2',310,-30);setTimeout(()=>showMenu('won'),900);break;
    }
  }
}

function drawPortrait(){
  if(!loaded)return;const c=$('portrait').getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,100,100);c.fillStyle='#fff3ca';c.fillRect(0,0,100,100);
  const atlas=playerAtlas(engine.p.form);const [x,y,w,h]=atlas.frames[0].rect;c.drawImage(atlas.image,x+w*.2,y,w*.6,h*.4,0,0,100,100);
}
function buildAtlas(image,cols,rows){
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ac=c.getContext('2d',{willReadFrequently:true});ac.drawImage(image,0,0);const pixels=ac.getImageData(0,0,c.width,c.height),data=pixels.data,frames=[];
  // Decode the neutral color-key matte at texture-load time. The source atlas stays intact.
  // Component boundaries preserve enclosed stone highlights and small white eye details.
  const sagaAsset=/goku-v8|kaioken-v8|saga-enemies-v8|arrival-props-v23|coastal-creatures-v23|arrival-rocks-v24/.test(image.src||'');
  const nativeAlpha=/village-boy-v27|piccolo-v26|gohan-child-v26|freeza-v20|saiyan-bosses-v21|saiyans-v6|namek-villains-v13/.test(image.src||'')||sagaAsset;
  if(sagaAsset)for(let i=0;i<data.length;i+=4){if(data[i]>150&&data[i+2]>110&&data[i+1]<110&&data[i]-data[i+1]>65&&data[i+2]-data[i+1]>50)data[i+3]=0;}
  const count=c.width*c.height,mask=new Uint8Array(count),queue=new Int32Array(count);
  for(let i=0;!nativeAlpha&&i<count;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2];if(Math.min(r,g,b)>85&&Math.max(r,g,b)-Math.min(r,g,b)<20)mask[i]=1;}
  for(let seed=0;seed<count;seed++)if(mask[seed]===1){
    let head=0,tail=1,edge=false,low=255,high=0;queue[0]=seed;mask[seed]=2;
    while(head<tail){const i=queue[head++],x=i%c.width,y=Math.floor(i/c.width);low=Math.min(low,data[i*4]);high=Math.max(high,data[i*4]);if(x===0||y===0||x===c.width-1||y===c.height-1)edge=true;
      if(x>0&&mask[i-1]===1){mask[i-1]=2;queue[tail++]=i-1;}if(x<c.width-1&&mask[i+1]===1){mask[i+1]=2;queue[tail++]=i+1;}if(y>0&&mask[i-c.width]===1){mask[i-c.width]=2;queue[tail++]=i-c.width;}if(y<c.height-1&&mask[i+c.width]===1){mask[i+c.width]=2;queue[tail++]=i+c.width;}
    }
    if(edge||tail>90&&high-low>22)for(let n=0;n<tail;n++)data[queue[n]*4+3]=0;
  }
  ac.putImageData(pixels,0,0);
  if(/village-boy-v27|piccolo-v26|gohan-child-v26|freeza-v20|saiyan-bosses-v21|combo-roster-v22|coastal-creatures-v23/.test(image.src||'')){
    // Pack connected sprites individually: adjacent limbs overlap bounding rectangles.
    const parts=findSpriteFrames(data,c.width,c.height,cols,rows,true),packed=document.createElement('canvas');
    const cw=Math.max(...parts.map(f=>f.rect[2]))+8,ch=Math.max(...parts.map(f=>f.rect[3]))+8;
    packed.width=cw*cols;packed.height=ch*rows;
    const pc=packed.getContext('2d'),out=pc.createImageData(packed.width,packed.height);
    const completeFrames=parts.map((f,i)=>{
      const [sx,sy,w,h]=f.rect,tx=i%cols*cw+4,ty=Math.floor(i/cols)*ch+4;
      for(const pixel of f.pixels){const dest=((ty+Math.floor(pixel/c.width)-sy)*packed.width+tx+pixel%c.width-sx)*4;out.data.set(data.subarray(pixel*4,pixel*4+4),dest);}
      const feet=Array.from(f.pixels).filter(p=>Math.floor(p/c.width)>=sy+h*.72);const anchor=feet.length?(feet.reduce((sum,p)=>sum+p%c.width-sx,0)/feet.length)/w:f.anchor;
      return {rect:[tx,ty,w,h],anchor};
    });
    pc.putImageData(out,0,0);
    return {image:packed,frames:completeFrames,scale:125/completeFrames[0].rect[3]};
  }
  if((image.src||'').includes('goku-combos-v16')){
    const completeFrames=findSpriteFrames(data,c.width,c.height,6,4);
    return {image:c,frames:completeFrames,scale:105/completeFrames[0].rect[3]};
  }
  const bands=(counts,gap=5)=>{let out=[],start=-1,last=-1;for(let i=0;i<counts.length;i++){if(counts[i]>6){if(start<0)start=i;last=i;}else if(start>=0&&i-last>=gap){if(last-start>24)out.push([Math.max(0,start-3),Math.min(counts.length,last+4)]);start=-1;}}if(start>=0&&last-start>24)out.push([Math.max(0,start-3),Math.min(counts.length,last+4)]);return out;};
  const ys=new Uint32Array(c.height);for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>40)ys[y]++;
  const authorCuts=rows===5&&!sagaAsset?(image.src?.includes('solar')?[0,246,475,730,935,1145]:[0,262,501,758,950,1145]):null;
  const rowBands=bands(ys),rowRanges=authorCuts?authorCuts.slice(0,-1).map((y,r)=>[Math.floor(y*c.height/1145),Math.floor(authorCuts[r+1]*c.height/1145)]):rowBands.length===rows?rowBands:Array.from({length:rows},(_,r)=>[Math.floor(r*c.height/rows),Math.floor((r+1)*c.height/rows)]);
  const columnRanges=rowRanges.map(([y0,y1])=>{const xs=new Uint32Array(c.width);for(let y=y0;y<y1;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>40)xs[x]++;const bs=bands(xs,3);return bs.length===cols?bs:Array.from({length:cols},(_,col)=>[Math.floor(col*c.width/cols),Math.floor((col+1)*c.width/cols)]);});
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    let [x0,x1]=columnRanges[row][col],[y0,y1]=rowRanges[row];
    if(sagaAsset){x0=Math.floor(col*c.width/cols);x1=Math.floor((col+1)*c.width/cols);const ys=new Uint32Array(c.height);for(let y=0;y<c.height;y++)for(let x=x0;x<x1;x++)if(data[(y*c.width+x)*4+3]>40)ys[y]++;const ranges=bands(ys,2).map(([a,b])=>[a+3,b-3]);if(ranges.length===rows)[y0,y1]=ranges[row];}
    let l=x1,r=x0,t=y1,b=y0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*c.width+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
    if(r<l){l=x0;r=x1-1;t=y0;b=y1-1;}
    let sum=0,n=0;for(let y=Math.round(t+(b-t)*.72);y<=b;y++)for(let x=l;x<=r;x++)if(data[(y*c.width+x)*4+3]>80){sum+=x;n++;}
    const pivot=n?sum/n:(l+r)/2;frames.push({rect:[l,t,r-l+1,b-t+1],anchor:clamp((pivot-l)/(r-l+1),.18,.82)});
  }
  return {image:c,frames,scale:105/frames[0].rect[3]};
}
function playerAtlas(form=false){return (engine.episode||engine.battle)&&engine.p.character!=='goku'?atlases[engine.p.character]:engine.versus?fighterAtlas(engine.versus.player):engine.story?(form?atlases.kaioken:atlases.goku):(form?atlases.solar:atlases.base);}
function playerPose(p){
  if((engine.episode||engine.battle)&&p.character!=='goku')return {atlas:atlases[p.character],frame:episodePose(p),combo:false};
  const motion=heroAnimator.sample(p,renderDelta);
  const extra=comboPose(p,engine.versus?engine.versus.player.id:engine.story&&!p.form?'goku':null);
  if(extra!==null)return {atlas:atlases.comboRoster,frame:extra,combo:false,motion};
  if(engine.versus)return {atlas:fighterAtlas(engine.versus.player),frame:engine.versus.player.full?motion.frame:versusPose(engine.versus.player,p),combo:false,motion};
  if(engine.saiyanCombat&&!p.form&&p.attack?.move.spriteFrames&&p.stun<=0){return {atlas:atlases.saiyanCombos,frame:comboSpriteFrame(p.attack),combo:true,motion};}
  return {atlas:playerAtlas(p.form),frame:engine.story?motion.frame:heroFrame(p),combo:false,motion};
}
function heroFrame(p){
  if(engine.mode==='dead'||p.stun>0)return 25;
  if(p.attack){const a=p.attack;return a.move.frames[a.t<a.move.active?0:a.t<=a.move.end?1:2];}
  if(p.hurtRecoveryAnim>0||p.state==='guard')return 24;
  if(p.state==='counter'||p.state==='dash')return 26;
  if(p.state==='genki'||p.state==='transform'||p.state==='charge')return 27;
  if(p.state==='special')return p.stateTime<.26?28:29;
  if(p.state==='blast')return 29;
  if(p.diving)return 23;
  if(!p.grounded)return p.vy<0?18:19;
  if(Math.abs(p.vx)>35)return 2+[0,1,2,3,2,1][Math.floor(p.anim*(8+Math.abs(p.vx)/40))%6];
  return Math.floor(p.anim*2)%2;
}
function sprite(image,rect,x,y,dir,scale=1,opts={}){
  const [sx,sy,sw,sh]=rect;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(dir*scale,scale);
  if(opts.reaction){const r=hitReaction(opts.reaction,reduced);ctx.translate(0,r.lift/scale);ctx.transform(1,0,-r.lean*dir,1,0,0);ctx.scale(1+r.squash,1-r.squash);}
  if(opts.alpha!=null)ctx.globalAlpha=opts.alpha;
  if(opts.hurt)ctx.filter='brightness(2.3) saturate(.3)';else if(opts.gold)ctx.filter='sepia(.4) saturate(1.2) brightness(1.16)';
  const anch=opts.anchor??.5;ctx.drawImage(image,sx,sy,sw,sh,Math.round(-sw*anch),Math.round(-sh),sw,sh);ctx.restore();
}
function shadow(x,y,w,alpha=.25){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#071716';ctx.beginPath();ctx.ellipse(x,y+1,w,5,0,0,Math.PI*2);ctx.fill();ctx.restore();}

function renderBackground(){
  if(engine.arrival){drawArrivalBackground(ctx,engine,images['arrival-coast-v23'],W,H);return;}
  if(!loaded){ctx.fillStyle='#183634';ctx.fillRect(0,0,W,H);return;}
  const namek=engine.story?.saga==='freeza',bg=namek?images['namek-stage-v13']:engine.stageId===2?images['forest-v6']:images.valley;const bw=namek?Math.max(W,Math.round(WORLD.ground*bg.width/(bg.height*.80))):1020,offset=namek?clamp(cam/Math.max(1,WORLD.width-W),0,1)*Math.max(0,bw-W):cam*.16;
  if(namek){ctx.drawImage(bg,0,0,bg.width,Math.round(bg.height*.80),-Math.round(offset),renderTop,bw,WORLD.ground-renderTop);}
  for(let i=Math.floor(offset/bw);!namek&&i<Math.floor(offset/bw)+Math.ceil(W/bw)+2;i++){
    const x=Math.round(i*bw-offset);ctx.save();if(i%2!==0){ctx.translate(x+bw,0);ctx.scale(-1,1);ctx.drawImage(bg,0,0,bg.width,Math.round(bg.height*.733),0,renderTop,bw,WORLD.ground-renderTop);}else ctx.drawImage(bg,0,0,bg.width,Math.round(bg.height*.733),x,renderTop,bw,WORLD.ground-renderTop);ctx.restore();
  }
  // Warm shafts and drifting light belong to the game camera, never the collision layer.
  const haze=ctx.createLinearGradient(0,0,0,H);haze.addColorStop(0,'#ffc9660a');haze.addColorStop(.7,'#244a4000');haze.addColorStop(1,'#051b313b');ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);
  for(const a of ambient){const x=((a.x-engine.visualTime*a.v*.25-cam*.07)%W+W)%W,y=a.y+Math.sin(engine.visualTime*.7+a.t)*12;ctx.globalAlpha=.15+Math.sin(engine.visualTime+a.t)*.1;ctx.fillStyle='#fff2ac';ctx.fillRect(x,y,a.s,a.s);}ctx.globalAlpha=1;
}
function renderTerrain(){
  if(engine.arrival){drawArrivalTerrain(ctx,engine,images['arrival-coast-v23'],cam,W,H,worldSprite);return;}
  const bg=engine.story?.saga==='freeza'?images['namek-stage-v13']:engine.stageId===2?images['forest-v6']:images.valley;if(!bg)return;
  const namek=engine.story?.saga==='freeza';
  const tw=namek?384:650;
  for(let x=Math.floor(cam/tw)*tw;x<cam+W+tw;x+=tw)ctx.drawImage(bg,namek?720:0,Math.round(bg.height*(namek?.80:.73)),namek?640:bg.width,Math.floor(bg.height*(namek?.20:.27)),Math.round(x-cam),WORLD.ground,tw,H-WORLD.ground);
  for(const c of engine.craters)worldSprite(3,c.x-cam,c.y+5,95,30,Math.max(0,1-(engine.time-c.born)/3));
  for(const r of engine.rocks)if(!r.broken)worldSprite(0,r.x-cam,r.y-r.h/2,r.w*2.5,r.h*1.25);
  for(const p of engine.platforms){
    const x=Math.round(p.x-cam);if(x+p.w<0||x>W)continue;
    ctx.save();ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(x+p.w,p.y);ctx.lineTo(x+p.w-5,p.y+p.h-10);ctx.lineTo(x+p.w*.73,p.y+p.h);ctx.lineTo(x+15,p.y+p.h-5);ctx.closePath();ctx.clip();
    ctx.drawImage(bg,namek?720:(p.x%700)+70,Math.round(bg.height*(namek?.80:.73)),Math.min(Math.round(p.w*1.5),namek?640:bg.width-770),Math.floor(bg.height*(namek?.20:.205)),x,p.y,p.w,p.h);ctx.restore();
    // Edge highlight precisely marks the surface that catches the player's feet.
    ctx.fillStyle=namek?'#80dcff':'#e7dfa077';ctx.fillRect(x+4,p.y,p.w-8,2);
  }
}
function star(x,y,r,points=5){ctx.beginPath();for(let i=0;i<points*2;i++){const a=-Math.PI/2+i*Math.PI/points,q=i%2?r*.43:r;const xx=x+Math.cos(a)*q,yy=y+Math.sin(a)*q;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.closePath();ctx.fill();}
function renderOrbs(){
  for(const o of engine.orbs){if(o.got)continue;const x=o.x-cam,y=o.y+Math.sin(engine.visualTime*3+o.id)*4;if(x< -35||x>W+35)continue;
    ctx.save();ctx.shadowColor='#ffc44b';ctx.shadowBlur=18;const gradient=ctx.createRadialGradient(x-4,y-5,1,x,y,13);gradient.addColorStop(0,'#fff3a9');gradient.addColorStop(.4,'#ffcc4b');gradient.addColorStop(1,'#ef850d');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff2b2';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#b6410a';if(o.id<=3){for(let i=0;i<o.id;i++)star(x+(i-(o.id-1)/2)*5,y,2.6);}else{for(let i=0;i<o.id;i++){const a=i*Math.PI*2/o.id;star(x+Math.cos(a)*5.5,y+Math.sin(a)*5.5,1.9);}}
    ctx.fillStyle='#ffffd4';ctx.globalAlpha=.8;ctx.fillRect(x-5,y-7,3,2);ctx.restore();
    if(Math.sin(engine.visualTime*6+o.id)>.96)burst(o.x,o.y-6,1,'#ffd987',15,-60);
  }
}
function renderArena(){
  const a=engine.activeEncounter;if(!a)return;
  ctx.save();for(const boundary of [a.left,a.right]){const x=boundary-cam;if(x< -20||x>W+20)continue;ctx.strokeStyle='#e7c783';ctx.lineWidth=2;ctx.globalAlpha=.5+Math.sin(engine.visualTime*4)*.15;ctx.beginPath();ctx.moveTo(x,WORLD.ground);ctx.lineTo(x,120);ctx.stroke();for(let i=0;i<8;i++){ctx.fillStyle='#ffe2a7';ctx.fillRect(x-3,WORLD.ground-(engine.visualTime*70+i*42)%340,6,13);}}ctx.restore();
}
function renderPortal(){
  if(engine.arrival||engine.episode)return;
  const x=6140-cam,y=WORLD.ground-50;if(x< -70||x>W+70)return;
  const open=engine.collected===7&&engine.bossDefeated;
  ctx.save();ctx.strokeStyle=open?'#e7ffcb':'#91c9bc88';ctx.lineWidth=3;ctx.shadowColor=open?'#cbff86':'#44dcc1';ctx.shadowBlur=open?25:10;
  ctx.beginPath();ctx.ellipse(x,y,30+Math.sin(engine.visualTime*2)*2,53,0,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,38,60,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=open?'#d0ffa615':'#60deba10';ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f5f3c9';ctx.font='bold 10px monospace';ctx.textAlign='center';if(!engine.saiyanCombat)ctx.fillText(open?'CAMINHO CONCLUÍDO':'7 ESFERAS',x,y-71);ctx.restore();
}
function renderEnemy(e){const m=fighterTransition(e,renderDelta),x=e.x-cam;ctx.save();ctx.translate(x,e.y+m.lift);ctx.transform(1,0,-m.lean,1,0,0);ctx.translate(-x,-e.y);try{renderEnemyBody(e);}finally{ctx.restore();}}
function renderEnemyBody(e){
  if(e.creature){if(e.hp<=0&&e.dead<=0)return;const a=atlases.coastalCreatures,pose=e.hp<=0?5:e.stun>0?4:e.state==='windup'?2:e.state==='attack'?3:e.state==='run'?1:0,f=a.frames[e.creatureRow*6+pose],scale=82/a.frames[e.creatureRow*6].rect[3];sprite(a.image,f.rect,e.x-cam,e.y,e.dir,scale,{anchor:f.anchor,reaction:e,alpha:e.hp<=0?e.dead/.65:1});if(e.hp>0&&engine.activeEncounter?.ids.includes(e.id)){ctx.fillStyle='#102c3d';ctx.fillRect(e.x-cam-22,e.y-98,44,3);ctx.fillStyle=e.state==='windup'?'#ffb88c':'#d3dfae';ctx.fillRect(e.x-cam-22,e.y-98,44*e.hp/e.maxHp,3);}return;}

  const x=e.x-cam;if(x< -140||x>W+140||e.hp<=0&&e.dead<=0)return;
  const extra=engine.battle?null:comboPose(e,engine.versus?engine.versus.opponent.id:e.storyBoss);
  if(extra!==null){const atlas=atlases.comboRoster,f=atlas.frames[extra];shadow(x,e.grounded?e.y:WORLD.ground,e.w*.55,.25);sprite(atlas.image,f.rect,x,e.y,e.dir,f.scale,{anchor:f.anchor,reaction:e,hurt:e.flash>.04});drawBossStyle(e,x);if(engine.versus)drawVersusTag(x,e.y+22,'CPU','#ffabb4');return;}
  if(engine.versus){const atlas=fighterAtlas(engine.versus.opponent),f=atlas.frames[versusPose(engine.versus.opponent,e)];shadow(x,e.grounded?e.y:WORLD.ground,e.w*.55,.25);sprite(atlas.image,f.rect,x,e.y,e.dir,f.scale??atlas.scale,{anchor:f.anchor,reaction:e,hurt:e.flash>.04});drawBossStyle(e,x);drawVersusTag(x,e.y+22,'CPU','#ffabb4');return;}
  const boss=e.type===2,scale=boss?.5:.37,moving=['walk','run','flight'].includes(e.state);let frame=e.hp<=0?5:e.stun>0?4:['windup','feint'].includes(e.state)?2:e.state==='attack'?3:moving?Math.floor(e.moveCycle*(e.state==='run'?10:6))%2:0;
  const y=e.y+(e.grounded&&moving?-Math.abs(Math.sin(e.moveCycle*12))*2:0)+(e.type===1?Math.sin(engine.visualTime*3+e.id)*3:0),breathe=e.state==='idle'?Math.sin(e.moveCycle*3)*.008:0;
  shadow(x,e.y,e.w*.75,.29);
  drawBossStyle(e,x);
  if(e.combat?.flight){ctx.save();ctx.globalAlpha=.22+Math.sin(engine.visualTime*12+e.id)*.08;ctx.strokeStyle=e.type===2?'#e8a7ff':'#adbcff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,e.y-e.h*.45,e.w*.72,e.h*.62,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x-e.dir*(12+i*7),e.y-20-i*13);ctx.lineTo(x-e.dir*(48+i*13),e.y-20-i*13);ctx.stroke();}ctx.restore();}
  if(e.state==='windup'){
    const ratio=clamp(e.timer/(boss?.8:.5),0,1);ctx.save();ctx.globalAlpha=.3+Math.sin(engine.visualTime*23)*.14;ctx.fillStyle=boss?'#ffb35a':'#f98d78';ctx.beginPath();ctx.ellipse(x,e.y,50*(1-ratio)+30,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  let defenseFrame=e.state==='guard'?(e.flash>0?1:0):['evade','retreat','flank'].includes(e.state)?2:e.attackKind==='counter'||boss&&e.attackKind==='sweep'?(e.state==='windup'?3:e.state==='attack'?4:e.state==='recover'?5:-1):-1;
  if(e.storyBoss==='freeza'){const atlas=atlases.freeza,f=atlas.frames[freezaPose(e)];sprite(atlas.image,f.rect,x,y,e.dir,atlas.scale,{anchor:f.anchor,reaction:e,hurt:e.flash>.04,alpha:e.hp<=0?e.dead/.65:1});}
  else if(engine.story&&(e.type===2||engine.story.chapter>1)){const atlas=engine.saiyanCombat&&boss&&e.spriteRow<3?atlases.saiyanBosses:engine.story.saga==='freeza'?atlases.namekVillains:atlases.sagaEnemies,index=e.hp<=0?5:e.stun>0?4:e.state==='windup'?2:e.state==='attack'?3:['walk','run','flight','evade','retreat','flank'].includes(e.state)?1:0;const f=atlas.frames[e.spriteRow*6+index],h=atlas.frames[e.spriteRow*6].rect[3];sprite(atlas.image,f.rect,x,y,e.dir,(engine.story.saga!=='freeza'&&e.spriteRow===3?205:boss?125:84)/h,{anchor:f.anchor,reaction:e,hurt:e.flash>.04,alpha:e.hp<=0?e.dead/.65:1});}
  else if(e.saiyan){const atlas=atlases.saiyans,index=e.hp<=0?5:e.stun>0?4:e.state==='windup'?2:e.state==='attack'?3:['walk','run','flight','evade','retreat','flank'].includes(e.state)?1:0;const f=atlas.frames[e.type*6+index];const h=atlas.frames[e.type*6].rect[3];sprite(atlas.image,f.rect,x,y,e.dir,(boss?135:105)/h,{anchor:f.anchor,reaction:e,hurt:e.flash>.04,alpha:e.hp<=0?e.dead/.65:1});}
  else if(e.hp>0&&defenseFrame>=0){const atlas=atlases.defense,f=atlas.frames[e.type*6+defenseFrame],rowHeight=Math.max(...atlas.frames.slice(e.type*6,e.type*6+6).map(f=>f.rect[3]));sprite(atlas.image,f.rect,x,y,e.dir,(boss?150:106)/rowHeight,{anchor:f.anchor,reaction:e,hurt:e.flash>.04});}
  else {ctx.save();ctx.translate(x,y);const anticipation=e.state==='windup'?Math.sin(clamp(1-e.timer/(e.windupDuration||.6),0,1)*Math.PI/2):0;ctx.transform(1,0,e.dir*anticipation*.065,1,0,0);ctx.scale(1+anticipation*.045,1-anticipation*.045);sprite(images.enemies,enemyRects[e.type*6+frame],0,0,e.dir,scale+breathe,{reaction:e,hurt:e.flash>.04,alpha:e.hp<=0?e.dead/.65:1});ctx.restore();}
  if(e.hp>0&&!boss&&(e.aggression||e.hp<e.maxHp)){
    const w=e.maxHp>145?48:39,yy=e.y-e.h-27;ctx.fillStyle='#071d21';ctx.fillRect(x-w/2-2,yy-2,w+4,7);ctx.fillStyle='#233b3f';ctx.fillRect(x-w/2,yy,w,3);ctx.fillStyle=e.type===1?'#9cceef':'#ec9370';ctx.fillRect(x-w/2,yy,w*e.hp/e.maxHp,3);
  }
  if(e.state==='guard'&&!engine.saiyanCombat){ctx.fillStyle='#acc8ff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('DEFESA',x,e.y-e.h-35);}
  if(boss&&e.phase===2&&e.hp>0){ctx.fillStyle='#ffa65e';ctx.globalAlpha=.6;for(let i=0;i<5;i++)ctx.fillRect(x+Math.sin(engine.visualTime*3+i)*55,e.y-10-((engine.visualTime*55+i*22)%120),2,5);ctx.globalAlpha=1;}
}
function drawBossStyle(e,x){
  if(!['raditz','nappa','vegeta'].includes(e.storyBoss)||e.hp<=0)return;
  ctx.save();
  if(e.storyBoss==='nappa'&&e.state==='windup'){const t=1-clamp(e.timer/e.windupDuration,0,1);ctx.strokeStyle='#ffb456';ctx.lineWidth=2+t*2;ctx.globalAlpha=.3+t*.5;ctx.beginPath();ctx.ellipse(x,e.y,35+t*35,8,0,0,Math.PI*2);ctx.stroke();}
  if(e.storyBoss==='raditz'&&['evade','retreat','run'].includes(e.state)){ctx.strokeStyle='#bb9afc';ctx.lineWidth=2;ctx.globalAlpha=.55;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-e.dir*30,e.y-35-i*16);ctx.lineTo(x-e.dir*75,e.y-35-i*16);ctx.stroke();}}
  if(e.storyBoss==='vegeta'&&['feint','guard'].includes(e.state)){ctx.strokeStyle='#a8d8ff';ctx.lineWidth=2;ctx.globalAlpha=e.state==='feint'?.25:.6;ctx.beginPath();ctx.arc(x+e.dir*20,e.y-65,35,-1.1,1.1);ctx.stroke();}
  ctx.restore();
}
function drawAura(p,x){
  const gold=p.form,c=gold?(engine.story?'#ff4e52':'#ffd674'):'#8cebdc',t=engine.visualTime;
  ctx.save();ctx.globalCompositeOperation='screen';
  const g=ctx.createRadialGradient(x,p.y-43,10,x,p.y-45,90);g.addColorStop(0,gold?(engine.story?'#ff274b55':'#ffd36933'):'#56dfca22');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-95,p.y-150,190,170);
  ctx.strokeStyle=c;ctx.lineWidth=1.3;ctx.globalAlpha=.5;ctx.beginPath();ctx.ellipse(x,p.y-49,42+Math.sin(t*15)*3,63+Math.sin(t*11)*5,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<8;i++){const yy=p.y-((t*90+i*20)%150),xx=x+Math.sin(i*2+t*3)*44;ctx.globalAlpha=.35;ctx.fillStyle=c;ctx.fillRect(xx,yy,2,8);}
  ctx.restore();
}
function drawVersusTag(x,y,label,color){
  ctx.save();ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#061426d9';ctx.fillRect(x-22,y-11,44,16);ctx.fillStyle=color;ctx.fillText(label,x,y);ctx.restore();
}
function renderPlayer(){
  if(drawGohanRush(ctx,engine,cam,atlases))return;
  const p=engine.p,x=p.x-cam,pose=playerPose(p),{frame,atlas}=pose;if(!atlas)return;
  shadow(x,p.grounded?p.y:WORLD.ground,25,Math.max(.07,.27-(WORLD.ground-p.y)*.001));
  if(p.form||p.charging)drawAura(p,x);if(p.state==='genki'){ctx.save();ctx.fillStyle='#c5f8ff';ctx.shadowColor='#50cfff';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(x,p.y-145,12+Math.min(1,p.stateTime)*32,0,Math.PI*2);ctx.fill();ctx.restore();}
  if(p.state==='dash'||p.attack||p.flying||p.form&&Math.abs(p.vx)>150){if(trails.length===0||engine.visualTime-trails[trails.length-1].t>.045)trails.push({x:p.x,y:p.y,frame,atlas:pose.atlas,combo:pose.combo,dir:p.dir,solar:p.form,t:engine.visualTime,life:.2});}
  for(const t of trails){const a=t.atlas||(t.combo?atlases.saiyanCombos:playerAtlas(t.solar)),f=a.frames[t.frame];sprite(a.image,f.rect,t.x-cam,t.y+(a.offsetY||0)*a.scale,t.dir,f.scale??a.scale,{alpha:Math.max(0,(engine.saiyanCombat?.12:.2)*(t.life/.2)),anchor:f.anchor});}
  let bob=0;if(p.state==='idle')bob=Math.sin(p.anim*4)*1.2;else if(p.grounded&&p.state==='run')bob=-Math.abs(Math.sin(p.anim*16))*2.5;
  const alpha=p.invincible>0&&p.state==='hurt'&&Math.floor(engine.visualTime*18)%2===0?.5:1;
  const f=atlas.frames[!engine.story&&p.form&&p.state==='special'&&p.stateTime>=.26?28:frame];
  const phase=p.attack?p.attack.t/p.attack.move.duration:0,squash=p.attack?Math.sin(phase*Math.PI*2)*.025:0;
  const anticipation=p.attack?Math.max(0,1-p.attack.t/p.attack.move.active):0;
  const lean=p.state==='run'?p.vx/9000:p.state==='dash'?p.dir*.1:p.attack?-p.dir*anticipation*.055:0;
  const land=landingPulse*.04,motion=pose.motion;ctx.save();ctx.translate(x-p.dir*anticipation*3,p.y);ctx.transform(1,0,-(motion?.lean??lean),1,0,0);ctx.scale(1+squash+land,(1-squash-land)*(motion?.breath||1));sprite(atlas.image,f.rect,0,bob+(motion?.lift||0)+(atlas.offsetY||0)*atlas.scale,p.dir,f.scale??atlas.scale,{alpha,anchor:f.anchor,reaction:p});ctx.restore();
  if(p.flying){ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle=p.form?'#ff8b78':'#8ff4ed';ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x-p.dir*18,p.y-42+i*10);ctx.lineTo(x-p.dir*(55+Math.abs(p.vx)*.08),p.y-42+i*10);ctx.stroke();}ctx.restore();}
  if(p.state==='special'&&p.stateTime<.28){ctx.save();ctx.shadowColor=p.form?'#ffd777':'#a9fff0';ctx.shadowBlur=20;ctx.fillStyle='#effff6';ctx.beginPath();ctx.arc(x+p.dir*43,p.y-48,5+p.stateTime*34,0,Math.PI*2);ctx.fill();ctx.restore();}
  if(engine.versus)drawVersusTag(x,p.y+22,'VOCÊ','#a4e6ff');
}
function renderShots(){
  for(const s of engine.shots){
    const x=s.x-cam,y=s.y,col=s.owner==='enemy'?'#b0a1ff':s.gold?'#ffcf67':'#7ef3db';
    if(x< -50||x>W+50)continue;
    for(let i=0;i<s.trail.length;i+=2){const t=s.trail[i],fade=(i+1)/s.trail.length;worldSprite(15,t.x-cam,t.y,s.r*(1+fade),s.r*(1+fade),fade*.28);}
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(s.vy,s.vx)+Math.PI/2);worldSprite(15,0,0,s.r*2.5,s.r*3.5);ctx.restore();
  }
}
function cBeam(x,y,dir,t){ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.fillStyle='#ffe36f';ctx.fillRect(0,-3,900,6);ctx.strokeStyle='#bd74e4';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<900;i+=6){const yy=Math.sin(i*.085-t*20)*8;if(i===0)ctx.moveTo(i,yy);else ctx.lineTo(i,yy);}ctx.stroke();ctx.restore();}
function renderEffects(){
  for(const e of effects){
    if(engine.saiyanCombat&&e.type==='number')continue;
    const x=e.x-cam,y=e.y,t=1-e.life/e.max;ctx.save();
    if(drawCombatEffect(ctx,e,x,y,reduced)){ctx.restore();continue;}
    if(['beam','nova','genki','impactRays','comboImpact','slash','hit','spriteFX'].includes(e.type)){
      if(e.type==='beam'){ctx.translate(x,y);ctx.rotate((e.dir||1)*Math.PI/2);drawWorldEffect(worldSprite,e,0,0,reduced);}
      else drawWorldEffect(worldSprite,e,x,y,reduced);
      ctx.restore();continue;
    }
    if(e.type==='piccoloBeam'){ctx.globalAlpha=1-t;cBeam(x,y,e.dir,t);ctx.restore();continue;}
    if(e.type==='feedback'){ctx.globalAlpha=Math.min(1,e.life*4);ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#071322';ctx.strokeText(e.text,engine.p.x-cam,engine.p.y+43);ctx.fillStyle=e.color;ctx.fillText(e.text,engine.p.x-cam,engine.p.y+43);ctx.restore();continue;}
    if(e.type==='comboArc'){
      ctx.translate(x,y);ctx.scale(e.dir,1);ctx.globalAlpha=(1-t)*.7;
      ctx.strokeStyle=engine.p.form?'#ff8778':'#c9f4ff';ctx.lineCap='round';ctx.lineWidth=3*(1-t)+1;
      ctx.beginPath();
      if(e.style==='rise'){ctx.moveTo(-25,44);ctx.quadraticCurveTo(40,0,5,-62*t);}
      else if(e.style==='fall'){ctx.moveTo(-25,-40);ctx.quadraticCurveTo(25,0,10,60*t);}
      else if(e.style==='kick'||e.style==='spin'){ctx.ellipse(-18,0,55,32,-.5,-1.8,-1.8+Math.PI*1.65*t);}
      else{ctx.moveTo(-35-t*18,3);ctx.lineTo(12+t*20,-3);}
      ctx.stroke();
    }else if(e.type==='comboImpact'){
      ctx.translate(x,y);ctx.scale(e.dir,1);ctx.globalAlpha=(1-t)*.9;ctx.strokeStyle='#f5fcff';ctx.lineWidth=e.heavy?3:1.5;
      const angle=e.style==='rise'?-1.25:e.style==='fall'?1.25:0;ctx.rotate(angle);
      for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(4+t*28,i*5);ctx.lineTo(24+t*(e.heavy?95:60),i*(12+t*10));ctx.stroke();}
    }else
    if(e.type==='genki'){ctx.globalAlpha=(1-t)*.55;ctx.fillStyle='#eaffff';ctx.shadowColor='#48bcff';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(x,y,10+t*28,0,Math.PI*2);ctx.fill();}
    else if(e.type==='pursuit'){ctx.globalAlpha=(1-t)*.7;ctx.strokeStyle='#c5faff';ctx.lineWidth=2;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(e.fromX-cam,e.fromY-65+i*8);ctx.lineTo(x,y-25+i*8);ctx.stroke();}}
    else if(e.type==='enemyDash'){ctx.globalAlpha=(1-t)*.65;ctx.strokeStyle='#c7a8ff';ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x-e.dir*(18+t*85),y+i*11-45);ctx.lineTo(x-e.dir*(62+t*130),y+i*11-45);ctx.stroke();}}
    else if(e.type==='impactRays'&&!reduced){ctx.globalAlpha=(1-t)*.6;ctx.strokeStyle='#ffeac1';ctx.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6,r=32+t*85;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*(r+25),y+Math.sin(a)*(r+25));ctx.stroke();}}
    else if(e.type==='ring'){ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle=e.color;ctx.lineWidth=2*(1-t)+.5;ctx.beginPath();ctx.ellipse(x,y,e.r+t*45,e.r*.7+t*30,0,0,Math.PI*2);ctx.stroke();}
    else if(e.type==='hit'){
      ctx.translate(x,y);ctx.rotate(engine.visualTime*2);ctx.fillStyle='#fff5b3';ctx.globalAlpha=1-t;ctx.beginPath();
      for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?(e.heavy?9:5):(e.heavy?48:31)*(1-t*.3);const xx=Math.cos(a)*r,yy=Math.sin(a)*r;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-5,-5,10,10);
    }else if(e.type==='slash'){
      ctx.globalAlpha=(1-t)*.6;ctx.strokeStyle=e.step===2?'#ffdf97':'#f3f7ce';ctx.lineWidth=e.step===2?5:3;ctx.beginPath();ctx.ellipse(x,y,e.step===2?46:32,e.step===2?38:23,e.dir<0?Math.PI:0,-1.2,1.1);ctx.stroke();
    }else if(e.type==='number'){ctx.globalAlpha=1-t;ctx.font=`italic 900 ${e.heavy?19:14}px Arial`;ctx.textAlign='center';ctx.strokeStyle='#263221';ctx.lineWidth=3;ctx.strokeText(e.text,x,y-t*42);ctx.fillStyle=e.color;ctx.fillText(e.text,x,y-t*42);}
    else if(e.type==='beam'){
      const length=760,thick=(e.gold?30:23)*Math.min(1,(1-t)*4);ctx.translate(x,y);ctx.scale(e.dir,1);ctx.shadowColor=e.enemy?'#b569ff':e.gold?'#ffbf46':'#76fce6';ctx.shadowBlur=25;ctx.fillStyle=e.enemy?'#be7bff':e.gold?'#ffd166':'#74e9da';ctx.beginPath();ctx.moveTo(0,-thick*.4);ctx.lineTo(length,-thick);ctx.lineTo(length,thick);ctx.lineTo(0,thick*.4);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f6fff0';ctx.fillRect(0,-thick*.45,length,thick*.9);ctx.strokeStyle='#f7ffe3';ctx.lineWidth=2;for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(80+j*160+t*140,0,6,thick*1.7,0,0,Math.PI*2);ctx.stroke();}
    }else if(e.type==='nova'){
      ctx.globalAlpha=(1-t)*.7;ctx.strokeStyle='#ffdf84';ctx.lineWidth=18*(1-t)+2;ctx.shadowColor='#ffdc6d';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(x,y,40+t*280,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff9d7';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,25+t*280,0,Math.PI*2);ctx.stroke();
    }ctx.restore();
  }
  for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x-cam),Math.round(p.y),p.size,p.size*(p.vy< -100?2:1));}ctx.globalAlpha=1;
}
function updateEffects(dt){
  particlePool.update(dt);particles=particlePool.items;
  for(const e of effects)e.life-=dt;effects=effects.filter(e=>e.life>0);
  landingPulse=Math.max(0,landingPulse-dt*7);for(const t of trails)t.life-=dt;trails=trails.filter(t=>t.life>0);
  shake=Math.max(0,shake-dt*34);flash=Math.max(0,flash-dt);
}
function renderCombatDebug(){
  if(!debugCombat)return;const data=engine.getDebugSnapshot();ctx.save();ctx.lineWidth=1.5;ctx.font='bold 10px monospace';
  const box=(r,color)=>{if(!r)return;ctx.strokeStyle=color;ctx.strokeRect(Math.round(r.x-cam),Math.round(r.y),Math.round(r.w),Math.round(r.h));};
  box(data.player.hurtbox,'#55e7ff');box(data.player.hitbox,'#ffdf58');ctx.fillStyle='#07101ddd';ctx.fillRect(8,80,255,48);ctx.fillStyle='#d9f6ff';ctx.fillText(`P ${data.player.state} · ${data.player.phase} F${data.player.frame}`,16,97);ctx.fillText(`ST ${data.player.stamina.toFixed(0)} · GUARDA ${data.player.guard.toFixed(0)} · POOL ${particles.length}`,16,114);
  for(const e of data.enemies){box(e.hurtbox,'#ff6978');const x=e.hurtbox.x-cam;if(x<0||x>W)continue;ctx.fillStyle='#170b18dd';ctx.fillRect(x,e.hurtbox.y-28,176,24);ctx.fillStyle='#ffe0e6';ctx.fillText(`#${e.id} ${e.state} / ${e.intent} D${e.distance}`,x+4,e.hurtbox.y-13);}
  ctx.restore();
}
function render(dt){
  renderDelta=dt*(engine.versus?.finish?.scale||1);
  if(engine.battle?.scene){drawRaditzScene(ctx,engine,W,H,atlases,images,reduced);return;}
  const screenW=W,screenH=H,p=engine.p;
  const opponent=engine.versus?engine.boss:engine.activeEncounter?engine.enemies.filter(e=>e.hp>0&&engine.activeEncounter.ids.includes(e.id)).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0]:null;
  const adaptive=opponent&&engine.mode!=='intro';let target=clamp(p.x-W*.35,0,Math.max(0,(engine.episode?engine.story.width:engine.arrival?ARRIVAL.width:WORLD.width)-W));
  if(engine.mode==='intro'){target=0;p.anim=engine.visualTime;}
  zoomImpulse=Math.max(0,zoomImpulse-dt*.16);ctx.save();renderTop=0;
  if(adaptive){
    const controlsVisible=!$('touch-controls').hidden,mobile=controlsVisible&&(touch||screenW<700);
    const camera=duelCamera.update(dt,[{x:p.x,y:p.y,height:Math.max(135,(engine.versus?.player.height||105)+25)},{x:opponent.x,y:opponent.y,height:(engine.versus?.opponent.height||opponent.h)+25}],{width:screenW,height:screenH,top:75,bottom:mobile?135:35,reduced,boost:reduced?0:zoomImpulse+(baseZoom-1)*.3});
    cam=camera.left;cameraZoom=camera.zoom;W=screenW/camera.zoom;H=Math.max(540,camera.top+screenH/camera.zoom);renderTop=Math.min(0,camera.top);
    ctx.scale(camera.zoom,camera.zoom);ctx.translate(0,-camera.top);
  }else{duelCamera.reset();cam+=(target-cam)*Math.min(1,dt*7);cameraZoom=1;}
  renderBackground();renderTerrain();renderHazards();renderPortal();renderOrbs();renderArena();
  if(engine.arrival)drawArrivalWorld(ctx,engine,cam,atlases,sprite,reduced);
  if(engine.battle)drawRaditzWorld(ctx,engine,cam,atlases);
  if(engine.episode)drawEpisodeWorld(ctx,engine,cam,atlases,sprite);
  if(engine.mode==='intro'){
    const previewX=W*.71;shadow(previewX,WORLD.ground,30);const a=atlases.goku,f=a.frames[Math.floor(engine.visualTime*2)%2];sprite(a.image,f.rect,previewX,WORLD.ground,1,a.scale*1.15,{anchor:f.anchor});
    if(W>680){shadow(W*.9,WORLD.ground,28);const a=atlases.sagaEnemies,f=a.frames[0];sprite(a.image,f.rect,W*.9,WORLD.ground,-1,115/f.rect[3],{anchor:f.anchor});}
  }else{
    for(const e of engine.enemies)renderEnemy(e);renderPlayer();renderShots();renderEffects();drawWorldGuidance(ctx,engine,cam,W,reduced);renderCombatDebug();
  }
  ctx.restore();W=screenW;H=screenH;renderTop=0;
  renderCutin();
  if(flash>0&&!reduced){ctx.globalAlpha=Math.min(.38,flash*1.5);ctx.fillStyle=flashColor;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
}
function frame(now){
  const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
  // Fixed simulation step keeps controls and collisions consistent on 30/60/120 Hz screens.
  accumulator+=dt;let input=getInput();let count=0;
  while(accumulator>=1/60&&count<4){engine.step(1/60,input);input={...input,pressed:{}};accumulator-=1/60;count++;}
  if(count===0)Object.assign(pressed,input.pressed);
  processEvents();
  if(engine.mode==='playing'||engine.mode==='won'||engine.mode==='dead')updateEffects(dt*(engine.versus?.finish?.scale||1));
  $('round-score').hidden=!engine.versus;
  if(engine.versus)$('round-score').textContent=`ROUND ${engine.versus.round} · VOCÊ ${engine.versus.score.player} × ${engine.versus.score.cpu} CPU`;
  if(engine.versus?.finish)$('finish-title').hidden=engine.mode!=='playing'||engine.versus.finish.elapsed<.35;
  toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');zoneTime-=dt;if(zoneTime<=0)$('zone-toast').classList.remove('show');
  hudTime+=dt;if(hudTime>.075){hudUpdate();hudTime=0;}
  sound.update(engine.mode==='playing');
  if(loaded)render(dt);else{ctx.fillStyle='#183634';ctx.fillRect(0,0,W,H);}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function openMap(){
  if(!loaded)return;engine.pause();clearInput();sound.unlock();if(touch&&!document.body.classList.contains('immersive'))enterFullscreen();
  $('versus-select').hidden=true;$('intro').hidden=true;$('menu').hidden=true;$('controls-modal').hidden=true;$('dialogue-panel').hidden=true;$('skills-modal').hidden=true;
  $('world-map').hidden=false;selectedStage=mapStages().find(c=>c.available&&unlocked(c.id)&&!recordFor(c.id).completed)?.id||storyStages().find(c=>c.available).id;renderMap();syncScreen();$('map-play').focus({preventScroll:true});
}
function closeMap(){$('world-map').hidden=true;$('menu').hidden=true;$('intro').hidden=false;clearInput();syncScreen();$('start').focus({preventScroll:true});}
function renderMap(){
  const levels=mapStages(),nodes=$('map-nodes'),legacy=campaignMode==='legacy';$('world-map').classList.add('story-map');$('world-map').classList.remove('freeza-map');$('map-heading').textContent='TERRA · A CHEGADA DE RADITZ';$('map-mode').hidden=true;$('map-saga').hidden=false;$('map-saga').disabled=true;$('map-saga').textContent='FREEZA · EM BREVE';$('map-skills').hidden=true;
  $('world-map').classList.toggle('legacy-map',legacy);$('world-map').classList.toggle('freeza-map',legacy&&storySaga==='freeza');$('map-saga').hidden=!legacy;$('map-saga').disabled=!legacy;if(legacy){$('map-heading').textContent='HISTORIA ANTIGA / '+storySaga.toUpperCase();$('map-saga').textContent=storySaga==='saiyan'?'SAGA FREEZA':'SAGA SAIYAJIN';}
  nodes.replaceChildren();
  for(const level of levels){
    const b=document.createElement('button');b.className='map-node';b.dataset.stage=level.id;
    const art=document.createElement('canvas');art.className='node-art';art.width=200;art.height=150;
    const ac=art.getContext('2d');ac.imageSmoothingEnabled=false;
    const atlas=level.id===1102?atlases.piccolo:level.id===1201?atlases.saiyanBosses:atlases.goku;
    const [sx,sy,sw,sh]=atlas.frames[0].rect,scale=Math.min(170/sw,140/sh);ac.drawImage(atlas.image,sx,sy,sw,sh,(200-sw*scale)/2,150-sh*scale,sw*scale,sh*scale);
    const number=document.createElement('small');number.textContent='MISSÃO '+(level.number||level.chapter||'1');
    const name=document.createElement('strong');name.textContent=level.name;
    const status=document.createElement('span');status.className='node-status';const record=recordFor(level.id),ready=unlocked(level.id);
    status.textContent=!level.available?'EM BREVE':record.completed?'CONCLUÍDA':!ready?'BLOQUEADA':record.checkpoint||record.segment>1101?'EM ANDAMENTO':'DISPONÍVEL';
    b.classList.toggle('locked',!ready);b.classList.toggle('selected',level.id===selectedStage);b.classList.toggle('completed',record.completed);b.setAttribute('aria-pressed',String(level.id===selectedStage));b.append(art,number,name,status);b.addEventListener('click',()=>{selectedStage=level.id;renderMap();});nodes.append(b);
  }
  const level=getStage(selectedStage)||levels[0],record=recordFor(level.id),ready=unlocked(level.id);
  $('map-number').textContent=level.biome;$('map-title').textContent=level.name;$('map-description').textContent=level.detail;$('map-enemies').textContent=level.enemy;
  $('map-goal').textContent=legacy?'Reuna as 7 esferas e derrote '+level.bossName:level.id===1101?'Ajudar os moradores e preparar o resgate de Gohan':level.id===1102?'Piccolo · abrir a rota até Raditz':level.id===1103?'Goku / Piccolo / Gohan · preparar o resgate':'Goku / Piccolo / Gohan · vença Raditz em equipe';
  $('map-preview').style.backgroundImage=level.id===1101?"url('/assets/arrival-coast-v23.png')":"url('/assets/valley.png')";
  renderSagaScene(document,level,atlases);
  $('map-play').disabled=!level.available||!ready;$('map-play-label').textContent=!level.available?'EM DESENVOLVIMENTO':!ready?'CONCLUA A MISSÃO ANTERIOR':record.completed?'JOGAR NOVAMENTE':record.checkpoint||record.segment>1101?'RETOMAR CHECKPOINT':'INICIAR MISSÃO '+(level.number||'1');
  $('map-stage-status').textContent=!level.available?'Será implementada na próxima parte do plano.':!ready?'Conclua a missão anterior para continuar.':record.completed?'Missão concluída.'+(record.bestTime?' Melhor tempo: '+formatTime(record.bestTime):''):record.checkpoint||record.segment>1101?level.id===1201?'Etapa '+(record.checkpoint+1)+' de 4 salva.':'Objetivo '+((record.segment-1101)*4+record.checkpoint+1)+' de 12 salvo.':'Pronto para jogar.';
  $('map-orbs').parentElement.hidden=true;$('map-best-combo').parentElement.hidden=true;$('map-completed').textContent=levels.filter(l=>recordFor(l.id).completed).length+' / '+levels.filter(l=>l.available).length;$('map-save-note').textContent=legacy?'Todas as fases antigas desbloqueadas. Progresso preservado.':progressSaved?'Jornada e batalha de Raditz · progresso salvo neste dispositivo.':'Progresso disponível apenas nesta sessão.';
}

function setControlGuide(mode){
  const xbox=mode==='xbox';$('keyboard-guide').hidden=xbox;$('xbox-guide').hidden=!xbox;
  $('guide-keyboard').setAttribute('aria-pressed',String(!xbox));$('guide-xbox').setAttribute('aria-pressed',String(xbox));
}
$('guide-keyboard').addEventListener('click',()=>setControlGuide('keyboard'));
$('guide-xbox').addEventListener('click',()=>setControlGuide('xbox'));
function pollController(){
  const result=controller.poll();controllerConnected=result.connected;
  if(result.changed){controllerNotice='connected';$('controller-status').textContent='Controle conectado. Solte os botões e use A para confirmar.';showToast('CONTROLE CONECTADO · A confirma · MENU pausa');setControlGuide('xbox');}
  if(result.disconnected){document.body.classList.remove('using-controller');clearInput();if(engine.mode==='playing'){engine.pause();showMenu('paused');}showToast('Controle desconectado. Reconecte ou use toque / teclado.');}
  const notice=result.error||(!result.connected?(result.unsupported?'Controle detectado sem mapeamento padrão. Tente reconectar pelo navegador.':'Conecte o Xbox por Bluetooth ou USB e pressione um botão.'):'connected');
  if(notice!==controllerNotice){controllerNotice=notice;$('controller-status').textContent=notice==='connected'?'Controle conectado. A confirma · B volta · MENU pausa.':notice;}
  if(!result.connected||document.hidden)return {pressed:{}};
  const input=result.input,edges=input.pressed;
  if(Object.values(edges).some(Boolean)){document.body.classList.add('using-controller');sound.unlock();}
  if(engine.battle?.scene){if(edges.pause){engine.battle.scenePaused?engine.resume():engine.pause();clearInput();}if(edges.back){engine.finishBattleScene();clearInput();}return {pressed:{}};}
  if(engine.dialogue){if(edges.confirm||edges.attack||edges.back){engine.advanceDialogue(!!edges.back);clearInput();}return {pressed:{}};}
  if(!$('skills-modal').hidden&&edges.back){closeSkills();return {pressed:{}};}
  if(edges.help&&$('skills-modal').hidden){if(!$('controls-modal').hidden)closeControls();else if(!touchLayout.editing)openControls();return {pressed:{}};}
  if(edges.pause&&$('skills-modal').hidden&&!touchLayout.editing&&$('controls-modal').hidden&&$('world-map').hidden&&$('intro').hidden){togglePause();return {pressed:{}};}
  if(engine.mode==='playing'&&$('controls-modal').hidden&&$('menu').hidden&&$('world-map').hidden&&!touchLayout.editing&&$('skills-modal').hidden){if(edges.zoom)baseZoom=baseZoom===1?1.15:1;return input;}
  if(edges.back){if(touchLayout.editing)touchLayout.close();else if(!$('controls-modal').hidden)closeControls();else if(!$('versus-select').hidden)closeVersus();else if(!$('world-map').hidden)closeMap();else if(engine.mode==='paused'&&$('intro').hidden)togglePause();return {pressed:{}};}
  const direction=['left','right','up','down'].find(key=>input[key])||'',now=performance.now();
  const move=direction&&(direction!==padMenuDirection||now>=padMenuNext);if(move)padMenuNext=now+(direction===padMenuDirection?165:360);padMenuDirection=direction;
  if(!$('world-map').hidden&&$('controls-modal').hidden&&$('skills-modal').hidden){
    if(move){const levels=mapStages(),i=levels.findIndex(c=>c.id===selectedStage);selectedStage=levels[clamp(i+(['left','up'].includes(direction)?-1:1),0,levels.length-1)].id;renderMap();}
    if(edges.attack){$('map-mode').click();return {pressed:{}};}
    if(edges.skills&&campaignMode==='story'){openSkills();return {pressed:{}};}
    if(edges.confirm&&getStage(selectedStage)?.available&&unlocked(selectedStage))begin(selectedStage);
    return {pressed:{}};
  }
  const root=!$('skills-modal').hidden?$('skills-modal'):touchLayout.editing?$('layout-modal'):!$('controls-modal').hidden?$('controls-modal'):!$('versus-select').hidden?$('versus-select'):!$('menu').hidden?$('menu'):$('intro');
  const items=Array.from(root.querySelectorAll('button:not(:disabled),input,select')).filter(el=>el.getClientRects().length>0);
  if(!items.length)return {pressed:{}};
  let index=items.indexOf(document.activeElement);if(index<0){index=0;items[0].focus({preventScroll:true});}
  const focused=items[index];
  if(move){
    if(['left','right'].includes(direction)&&focused.matches('input[type=range],select')){
      const delta=direction==='left'?-1:1;
      if(focused.tagName==='SELECT'){focused.selectedIndex=clamp(focused.selectedIndex+delta,0,focused.options.length-1);focused.dispatchEvent(new Event('change',{bubbles:true}));}
      else{focused.value=clamp(Number(focused.value)+delta*5,Number(focused.min),Number(focused.max));focused.dispatchEvent(new Event('input',{bubbles:true}));}
    }else{const next=items[(index+(['up','left'].includes(direction)?-1:1)+items.length)%items.length];next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});}
  }
  if(edges.confirm&&focused.tagName==='BUTTON')focused.click();
  return {pressed:{}};
}
function renderCutin(){
  if(engine.saiyanCombat)return;
  const e=effects.find(e=>e.type==='cutin');if(!e||reduced||(engine.episode||engine.battle)&&engine.p.character!=='goku')return;
  const t=1-e.life/e.max,atlas=playerAtlas(e.solar),f=atlas.frames[27];
  ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*4);ctx.fillStyle='#031021dc';ctx.fillRect(0,H*.2,W,H*.23);ctx.strokeStyle=e.solar?'#ffdc79':'#8bf0ff';ctx.lineWidth=2;ctx.strokeRect(-2,H*.2,W+4,H*.23);
  const [sx,sy,sw,sh]=f.rect;ctx.drawImage(atlas.image,sx,sy,sw,sh*.55,W*.12,H*.205,H*.16,H*.21);
  ctx.fillStyle=e.solar?'#ffe495':'#d1fcff';ctx.textAlign='center';ctx.font=`italic 900 ${Math.min(32,W*.05)}px Arial`;ctx.fillText(engine.story?(e.solar?'KAIOKEN · KAMEHAMEHA':'KAMEHAMEHA'):e.solar?'EXPLOSÃO SOLAR':'RAIO DE KI',W*.6,H*.33);ctx.restore();
}

$('map-mode').hidden=true;
$('map-saga').disabled=true;
$('map-skills').addEventListener('click',openSkills);$('menu-skills').addEventListener('click',openSkills);$('skills-close').addEventListener('click',closeSkills);
$('dialogue-next').addEventListener('click',()=>{engine.advanceDialogue();clearInput();});$('dialogue-skip').addEventListener('click',()=>{engine.advanceDialogue(true);clearInput();});
$('skill-buy').addEventListener('click',()=>{const result=buySkill(saga,selectedSkill);saga=result.progress;progressSaved=result.saved;renderSkills();$('skill-feedback').textContent=result.reason||(result.saved?'Habilidade aprendida. Será aplicada ao iniciar o capítulo.':'Habilidade aplicada nesta sessão; não foi possível salvar neste navegador.');});
for(const b of document.querySelectorAll('[data-form]'))b.addEventListener('click',()=>{const result=saveSaga({...saga,form:Number(b.dataset.form)});saga=result.progress;progressSaved=result.saved;renderSkills();});
function openSkills(){
  if(engine.dialogue)return;skillsWasPlaying=engine.mode==='playing';if(skillsWasPlaying)engine.pause();clearInput();$('skills-modal').hidden=false;renderSkills();syncScreen();$('skills-close').focus({preventScroll:true});
}
function closeSkills(){
  $('skills-modal').hidden=true;if(skillsWasPlaying)engine.resume();skillsWasPlaying=false;clearInput();syncScreen();if(!$('world-map').hidden)renderMap();
}
function renderSkills(){
  $('skill-points').textContent=saga.points;const root=$('skill-tree');root.replaceChildren();
  for(let row=0;row<3;row++)for(let branch=0;branch<3;branch++){
    const skill=SKILLS[branch*3+row],owned=saga.skills.includes(skill.id),available=(!skill.chapter||sagaUnlocked(saga,skill.chapter))&&skill.requires.every(id=>saga.skills.includes(id));
    const b=document.createElement('button');b.dataset.skill=skill.id;b.className='skill-node'+(owned?' learned':'')+(selectedSkill===skill.id?' selected':'')+(!available?' locked':'');b.setAttribute('aria-pressed',String(selectedSkill===skill.id));
    const title=document.createElement('strong'),sub=document.createElement('small');title.textContent=skill.name;sub.textContent=owned?'APRENDIDO':skill.auto?'APÓS RADITZ':!available?'REQUISITOS':skill.cost+' PONTO'+(skill.cost>1?'S':'');b.append(title,sub);b.addEventListener('click',()=>{selectedSkill=skill.id;renderSkills();root.querySelector('[data-skill="'+skill.id+'"]').focus({preventScroll:true});});root.append(b);
  }
  const skill=SKILLS.find(s=>s.id===selectedSkill),owned=saga.skills.includes(skill.id),ready=skill.requires.every(id=>saga.skills.includes(id))&&(!skill.chapter||sagaUnlocked(saga,skill.chapter));
  $('skill-name').textContent=skill.name;$('skill-description').textContent=skill.desc;
  $('skill-requirements').textContent=skill.requires.length?'Requer: '+skill.requires.map(id=>SKILLS.find(s=>s.id===id).name).join(' + ')+(skill.chapter?' · Capítulo '+(skill.chapter-100):''):skill.chapter?'Disponível a partir do capítulo '+(skill.chapter-100):'Disponível desde o início.';
  $('skill-buy').disabled=owned||skill.auto||!ready||saga.points<skill.cost;$('skill-buy').textContent=owned?'APRENDIDO':skill.auto?'NO TREINAMENTO':saga.points<skill.cost?'FALTAM PONTOS':'APRENDER · '+skill.cost;
  for(const b of document.querySelectorAll('[data-form]')){const n=Number(b.dataset.form);b.disabled=!saga.skills.includes(n===2?'kaioken':'kaioken'+n);b.setAttribute('aria-pressed',String(saga.form===n));}
}
function renderDialogue(){
  const d=engine.dialogue;if(!d)return;$('dialogue-panel').hidden=false;$('menu').hidden=true;const line=d.lines[d.index];$('dialogue-chapter').textContent=engine.story.biome;$('dialogue-count').textContent=(d.index+1)+' / '+d.lines.length;$('dialogue-speaker').textContent=line.speaker;$('dialogue-text').textContent=line.text;
  $('dialogue-next').firstChild.textContent=d.index===d.lines.length-1?'VAMOS LÁ ':'CONTINUAR ';$('dialogue-next').focus({preventScroll:true});drawDialoguePortrait(line.speaker);syncScreen();
}
function drawDialoguePortrait(speaker){
  if(!loaded)return;const c=$('dialogue-portrait'),dc=c.getContext('2d');dc.imageSmoothingEnabled=false;dc.clearRect(0,0,180,180);dc.fillStyle='#12233c';dc.fillRect(0,0,180,180);
  const portraits=['GOKU','PICCOLO','GOHAN','KURIRIN','SENHOR KAIO','YAJIROBE'],i=portraits.indexOf(speaker);
  if(i>=0){const img=images['portraits-v8'];dc.drawImage(img,i%3*512,Math.floor(i/3)*512,512,490,0,0,180,180);}
  else if(['RADITZ','NAPPA','VEGETA'].includes(speaker)){const i=['RADITZ','NAPPA','VEGETA'].indexOf(speaker),atlas=atlases.sagaEnemies,[x,y,w,h]=atlas.frames[i*6].rect;dc.drawImage(atlas.image,x,y,w,h*.65,12,5,156,180);}
  else if(['DODORIA','ZARBON','RECOLUME','CAPITÃO GINYU','FREEZA'].includes(speaker)){const row={DODORIA:1,ZARBON:2,RECOLUME:3,'CAPITÃO GINYU':4,FREEZA:5}[speaker],atlas=atlases.namekVillains,[x,y,w,h]=atlas.frames[row*6].rect;dc.drawImage(atlas.image,x,y,w,h,12,4,156,172);}
  else if(speaker==='MENINO'&&atlases.villageBoy){const a=atlases.villageBoy,[x,y,w,h]=a.frames[0].rect;dc.fillStyle='#eff8e0';dc.fillRect(0,0,180,180);dc.drawImage(a.image,x,y,w,h,35,8,110,164);}
  else{dc.fillStyle='#edc884';dc.font='38px "Seven Pixel"';dc.textAlign='center';dc.fillText('Z',90,107);}
}
function renderHazards(){
 if(!engine.story)return;
 for(const h of engine.hazards){const x=h.x-cam;if(x>W+100||x+h.w<0)continue;
  const v=drawWorldHazard(worldSprite,h,engine.time,x+h.w/2,WORLD.ground,reduced);
  if(v.state==='warning'){ctx.save();ctx.fillStyle='#ffdc86';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('! PERIGO',x+h.w/2,WORLD.ground-45);ctx.restore();}
 }
}
function worldSprite(frame,x,y,w,h,alpha=1){const a=atlases.worldFX;if(!a)return;ctx.save();ctx.globalAlpha*=clamp(alpha,0,1);const r=a.frames[frame].rect;ctx.drawImage(a.image,...r,x-w/2,y-h/2,w,h);ctx.restore();}

const arrivalButton=$('arrival-interact');
arrivalButton.addEventListener('pointerdown',e=>{e.preventDefault();arrivalButton.setPointerCapture(e.pointerId);pointers.set(e.pointerId,'interact');pressed.interact=true;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])arrivalButton.addEventListener(event,e=>pointers.delete(e.pointerId));
