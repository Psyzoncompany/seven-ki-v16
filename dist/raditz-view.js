import {RADITZ_STEPS,RADITZ_SCENES} from './raditz-data.js';
export function buildRaditzAtlas(image){
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height);const data=pixels.data;
 for(let i=0;i<data.length;i+=4){if(data[i]>190&&data[i+2]>190&&data[i+1]<110)data[i+3]=0;}
 ctx.putImageData(pixels,0,0);const frames=[];
 for(let i=0;i<8;i++){const x0=Math.floor(i%4*c.width/4),x1=Math.floor((i%4+1)*c.width/4),y0=Math.floor(Math.floor(i/4)*c.height/2),y1=Math.floor((Math.floor(i/4)+1)*c.height/2);let l=x1,r=x0,t=y1,b=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*c.width+x)*4+3]>80){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}frames.push({rect:[l,t,Math.max(1,r-l+1),Math.max(1,b-t+1)]});
 }return {image:c,frames};
}
export function mountRaditzUi(getEngine,clear){
 const panel=document.createElement('section');panel.id='raditz-scene-ui';panel.hidden=true;panel.setAttribute('aria-label','Cena da batalha de Raditz');panel.innerHTML='<div class="scene-tools"><button id="raditz-pause">PAUSAR CENA</button><button id="raditz-skip">PULAR CENA</button></div><div class="scene-caption"><strong id="raditz-speaker"></strong><p id="raditz-line"></p></div>';
 document.getElementById('stage').append(panel);
 document.getElementById('raditz-pause').addEventListener('click',()=>{const g=getEngine();if(g.battle?.scene){g.battle.scenePaused?g.resume():g.pause();clear();}});
 document.getElementById('raditz-skip').addEventListener('click',()=>{getEngine().finishBattleScene?.();clear();});
 const objective=document.createElement('div');objective.id='raditz-objective';objective.hidden=true;objective.innerHTML='<small id="raditz-step"></small><strong id="raditz-goal"></strong><span id="raditz-detail"></span><progress id="raditz-progress" max="1" value="0" aria-label="Progresso do objetivo"></progress>';
 document.getElementById('gameplay-notes').append(objective);
}
export function updateRaditzHud(g){
 const b=g.battle,$=id=>document.getElementById(id);document.body.classList.toggle('raditz-battle',!!b);document.body.classList.toggle('raditz-child',!!b&&g.p.character==='gohan');
 $('raditz-scene-ui').hidden=!b?.scene;$('raditz-objective').hidden=!b||!!b.scene;
 if(!b)return;
 $('arrival-hud').hidden=true;$('direction').hidden=true;$('timing-cue').textContent='';
 if(b.scene){const scene=RADITZ_SCENES[b.scene.key],line=scene.lines.filter(l=>l[0]<=b.scene.time).at(-1);$('raditz-speaker').textContent=line[1];$('raditz-line').textContent=line[2];$('raditz-pause').textContent=b.scenePaused?'CONTINUAR CENA':'PAUSAR CENA';return;}
 const s=RADITZ_STEPS[b.step],grapple=b.step===3&&b.damage>=150;
 $('raditz-step').textContent='RADITZ · '+(b.step+1)+' / 4';$('raditz-goal').textContent=grapple?'Aproxime-se · segure DEFESA':s.title;
 $('raditz-detail').textContent=grapple?'Raditz está vulnerável. Fique perto dele e segure DEFESA por um instante.':s.detail;
 $('raditz-progress').value=grapple?b.grapple/.6:b.step===1?b.charge/4:b.step===2?b.charge/1.2:b.damage/s.goal;
 if(b.step===1)$('raditz-goal').textContent+=' · '+b.charge.toFixed(1)+' / 4 s';
 if(b.step===2&&b.charge>=1.2)$('raditz-goal').textContent='GOHAN · GOLPE PARA INTERVIR!';
 $('special-name').textContent=g.p.character==='piccolo'?'MAKANKO':'KAME';
}
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function draw(c,atlas,index,x,y,height,flip=false){if(!atlas)return;const f=atlas.frames[index];if(!f)return;const [sx,sy,w,h]=f.rect,scale=height/h;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(atlas.image,sx,sy,w,h,-w*scale/2,-height,w*scale,height);c.restore();}
function beam(c,x,y,length,t){c.save();c.lineCap='round';c.strokeStyle='#a668ed';c.lineWidth=17;c.beginPath();c.moveTo(x,y);c.lineTo(x+length,y);c.stroke();c.strokeStyle='#fff4a2';c.lineWidth=6;c.stroke();c.strokeStyle='#ffc62f';c.lineWidth=3;c.beginPath();for(let i=0;i<=length;i+=3){const yy=y+Math.sin(i*.1-t*24)*13;i?c.lineTo(x+i,yy):c.moveTo(x+i,yy);}c.stroke();c.restore();}
export function drawRaditzWorld(c,g,cam,atlases){
 const b=g.battle,e=g.boss,p=g.p,t=g.visualTime;
 const ally=b.step===1?'goku':'piccolo',ax=b.step===1?Math.max(340,e.x-100):400;
 draw(c,atlases[ally],b.step===1&&b.allyStrike>0?10:0,ax-cam,462,ally==='goku'?105:116);
 if(b.step!==2)draw(c,atlases.gohan,0,1400-cam,462,64);
 if(e.state==='windup'){
  c.save();const x=e.x-cam,y=e.y-135,remaining=Math.max(0,e.timer/e.windupDuration);c.font='bold 14px "Seven Pixel",monospace';c.textAlign='center';c.fillStyle='#172a48';c.fillRect(x-65,y-22,130,24);c.fillStyle='#ffe89b';c.fillText({rush:'INVESTIDA',double:'DUPLA RAJADA',airStrike:'CHUTE ALTO',strike:'GOLPE CURTO'}[e.attackKind],x,y-6);c.fillStyle='#ffbd55';c.fillRect(x-50,y+4,100*(1-remaining),4);c.restore();
 }
 if(b.step===1&&p.charging){c.save();c.strokeStyle='#ffdd52';c.lineWidth=2;c.beginPath();c.arc(p.x-cam+p.dir*14,p.y-83,7+b.charge*3,0,Math.PI*2);c.stroke();c.restore();}
 if(b.step===3&&b.damage>=150){c.save();c.strokeStyle='#ffe094';c.lineWidth=3;c.beginPath();c.ellipse(e.x-cam,462,55,9,0,0,Math.PI*2);c.stroke();c.restore();}
}
export function drawGohanRush(c,g,cam,atlases){if(!g.battle?.rush)return false;draw(c,atlases.raditzFinale,6,g.p.x-cam,g.p.y,65,g.p.dir>0);return true;}
export function drawRaditzScene(c,g,w,h,atlases,images,reduced){
 const s=g.battle.scene,t=s.time,final=s.key==='finale';c.save();c.fillStyle='#6687a3';c.fillRect(0,0,w,h);c.drawImage(images.valley,0,0,w,h);
 c.fillStyle='#0b193752';c.fillRect(0,0,w,h);
 // Compose in a fixed shot space; fit both performers even in a portrait viewport.
 const scale=Math.min(w/780,h/450),ox=(w-780*scale)/2,oy=h*.66-350*scale;c.translate(ox,oy);c.scale(scale,scale);
 const a=atlases.raditzFinale,ground=350;
 c.fillStyle='#243742';c.fillRect(0,ground,780,24);
 const piccolo=(pose=4,x=165)=>draw(c,a,pose,x,ground,168);
 const goku=(x=320,pose=0)=>draw(c,atlases.goku,pose,x,ground,155);
 const raditz=(x=550,pose=0)=>draw(c,atlases.saiyanBosses,pose,x,ground,180,true);
 if(final){
  const impact=t>=9.25&&t<12,fallen=t>=13;
  piccolo(t>=9?5:4);
  if(fallen){draw(c,a,3,560,ground+4,120);draw(c,atlases.gohan,3,720,ground,84);}
  else{const recoil=impact?ease((t-9.25)/.4)*16:0;draw(c,a,impact?2:t>=3?1:0,535+recoil,ground+(t>=12?ease(t-12)*25:0),210);}
  if(t>=1&&t<9){const pulse=reduced?0:Math.sin(t*19)*3;c.strokeStyle='#ffe586';c.lineWidth=3;c.beginPath();c.arc(190,ground-133,8+t*1.4+pulse,0,Math.PI*2);c.stroke();}
  if(t>=9&&t<11.5)beam(c,220,ground-122,Math.min(490,(t-9)*1900),t);
  if(t>=9.25&&t<10.3){c.fillStyle='#fff4b2';c.globalAlpha=reduced?.25:.7*(1-(t-9.25)/1.05);c.beginPath();c.ellipse(540,ground-120,45,65,0,0,Math.PI*2);c.fill();c.globalAlpha=1;}
 }else if(s.key==='firstBeam'){
  piccolo(t>=1.2?5:4);const evade=ease((t-1.4)/.4);raditz(540+evade*110,evade>0?1:0);goku(370,4);
  if(t>=1.2&&t<2.5)beam(c,220,ground-122,470,t);
  if(t>4)draw(c,atlases.gohan,4,720,ground,90);
 }else if(s.key==='intervention'){
  const x=700-ease(t/.55)*160;raditz(520,t>.5?4:0);goku(280,4);draw(c,a,6,x,ground-45,90);
  if(t>.5&&t<1.2){c.strokeStyle='#ffe697';c.lineWidth=6;c.beginPath();c.arc(540,ground-90,20+(t-.5)*70,0,Math.PI*2);c.stroke();}
  if(t>2){piccolo(4,120);}
 }else{goku(300,s.key==='opening'?4:0);raditz(560,s.key==='intro'&&t<2?2:0);piccolo(4,110);draw(c,atlases.gohan,0,710,ground,80);}
 c.restore();
 c.fillStyle='#071326';c.fillRect(0,0,w,Math.min(26,h*.06));c.fillRect(0,h-Math.min(26,h*.06),w,Math.min(26,h*.06));
}
