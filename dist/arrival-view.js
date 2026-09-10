import {ARRIVAL,arrivalTarget} from './arrival-mission.js';
export function drawArrivalBackground(c,g,image,width,height){
 const pan=Math.max(0,Math.min(1,g.p.x/ARRIVAL.width));
 const sourceHeight=Math.min(800,image.width*462/width),sourceWidth=sourceHeight*width/462;
 c.drawImage(image,pan*(image.width-sourceWidth),800-sourceHeight,sourceWidth,sourceHeight,0,0,width,462);
 const shade=c.createLinearGradient(0,0,0,height);shade.addColorStop(0,g.arrival.step===3?'#29324344':'#07283b18');shade.addColorStop(1,'#0c263600');c.fillStyle=shade;c.fillRect(0,0,width,height);
}
export function drawArrivalTerrain(c,g,image,cam,width,height,rock){
 for(let x=Math.floor(cam/650)*650;x<cam+width+650;x+=650)c.drawImage(image,0,800,image.width,image.height-800,x-cam,462,650,Math.max(78,height-462));
 for(const p of g.platforms){const x=p.x-cam;c.save();c.beginPath();c.moveTo(x,p.y);c.lineTo(x+p.w,p.y);c.lineTo(x+p.w-12,p.y+p.h);c.lineTo(x+18,p.y+p.h);c.closePath();c.clip();c.drawImage(image,250,800,700,220,x,p.y,p.w,p.h);c.fillStyle='#b2c978';c.fillRect(x,p.y,p.w,4);c.restore();}
}
export function drawArrivalWorld(c,g,cam,atlases,sprite,reduced){
 const draw=(frame,x,y,height,dir=1)=>{const a=atlases.arrivalProps,f=a.frames[frame];sprite(a.image,f.rect,x-cam,y,dir,height/f.rect[3],{anchor:.5});};
 draw(0,190,462,185);draw(1,3060,466,138);
 for(const r of g.rocks)if(!r.broken){
  const a=atlases.arrivalRocks,f=a.frames[r.variant+(r.hp===1?2:0)];
  sprite(a.image,f.rect,r.x-cam,r.y,1,r.h/f.rect[3],{anchor:.5});
  if(r.hp===1){c.fillStyle='#102d3e';c.fillRect(r.x-cam-13,r.y-r.h-10,26,3);c.fillStyle='#eac589';c.fillRect(r.x-cam-13,r.y-r.h-10,13,3);}
 }
 if(g.arrival.step<2||g.arrival.farmerTime>0){
  const rescued=g.arrival.step>=2,x=1790-cam;
  draw(2,1790,462,86);
  c.save();c.fillStyle='#f2f9fff2';c.strokeStyle='#d99522';c.lineWidth=1;
  c.beginPath();c.roundRect(x-122,478,244,49,9);c.fill();c.stroke();
  c.textAlign='center';c.fillStyle='#214d70';c.font='bold 12px Arial';
  c.fillText(rescued?'Obrigado! Meu caminho está livre!':'Quebre as pedras do meu caminho!',x,497);
  c.fillStyle='#355c7b';c.font='11px Arial';c.fillText(rescued?'A cápsula caiu logo adiante.':`${g.rocks.filter(r=>r.broken).length}/2 pedras · Golpes ou rajadas de KI`,x,514);c.restore();
 }
 const d=g.dialogue,scene=d?.key==='abduction',t=g.arrival.sceneTime;
 if(!scene&&g.arrival.step<3)draw(3,350,462,60);
 if(scene){
  const index=d.index,flight=index>=3?Math.min(1,Math.max(0,(t-13.5)/3)):0;
  const x=500+flight*700,y=462-flight*230;
  const a=atlases.saiyanBosses,f=a.frames[index>=3?1:0];
  sprite(a.image,f.rect,x-cam,y,-1,125/a.frames[0].rect[3],{anchor:f.anchor});
  if(index<2)draw(4,365,462,62);else draw(5,x-28,y-34,52,-1);
  if(index===1){c.save();c.globalAlpha=.15;c.strokeStyle='#edd3a5';c.beginPath();c.arc(500-cam,400,58,0,Math.PI*2);c.stroke();c.restore();}
 }
 const target=arrivalTarget(g);
 if(g.mode==='playing'){
  const x=target.x-cam,y=target.y-112,pulse=reduced?0:Math.sin(g.visualTime*3)*3;
  c.save();c.strokeStyle='#ffe1a3';c.fillStyle='#102d3ed9';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-9+pulse);c.lineTo(x+8,y+pulse);c.lineTo(x,y+9+pulse);c.lineTo(x-8,y+pulse);c.closePath();c.fill();c.stroke();
  if(g.arrival.scan>0){c.strokeStyle='#b5e7d5';c.beginPath();c.arc(x,y+pulse,15,-Math.PI/2,-Math.PI/2+g.arrival.scan*Math.PI*2);c.stroke();}
  c.restore();
 }
 // A quiet plume marks the landing site from a distance.
 if(g.arrival.step<3&&!reduced){c.save();for(let i=0;i<4;i++){const age=(g.visualTime*.16+i*.25)%1;c.globalAlpha=(1-age)*.1;c.fillStyle='#665545';c.beginPath();c.ellipse(3030-cam+age*40,320-age*170,12+age*25,18+age*35,0,0,Math.PI*2);c.fill();}c.restore();}
}
export function drawArrivalMinimap(c,g){
 const width=c.canvas.width,height=c.canvas.height;c.clearRect(0,0,width,height);
 c.fillStyle='#deeff4';c.fillRect(0,0,width,height);const px=x=>10+x/ARRIVAL.width*(width-20),py=y=>17+y/462*(height-28);
 c.strokeStyle='#5a827b';c.lineWidth=2;c.beginPath();c.moveTo(10,py(462));c.lineTo(width-10,py(462));c.stroke();
 for(const p of g.platforms){c.strokeStyle='#769183';c.beginPath();c.moveTo(px(p.x),py(p.y));c.lineTo(px(p.x+p.w),py(p.y));c.stroke();}
 for(const h of g.hazards){c.fillStyle='#da9676';c.fillRect(px(h.x),py(462)-4,Math.max(3,h.w/ARRIVAL.width*(width-20)),4);}
 for(const e of g.enemies)if(e.hp>0&&Math.abs(e.x-g.p.x)<700){c.fillStyle='#ed9682';c.beginPath();c.arc(px(e.x),py(e.y),2.5,0,Math.PI*2);c.fill();}
 const target=arrivalTarget(g);c.fillStyle='#ac6800';c.fillRect(px(target.x)-3,py(target.y)-3,6,6);
 c.fillStyle='#007652';c.beginPath();c.arc(px(g.p.x),py(g.p.y),3.5,0,Math.PI*2);c.fill();
}
export function updateArrivalHud(g,root,usingController){
 const m=g.arrival,panel=root.getElementById('arrival-hud');panel.hidden=!m||!['playing','paused'].includes(g.mode);
 root.body.classList.toggle('arrival-mode',!!m);
 if(!m)return;
 const t=arrivalTarget(g);root.getElementById('arrival-step').textContent='1.1 / '+String(m.step+1).padStart(2,'0')+' DE 04';
 root.getElementById('arrival-title').textContent=t.title;root.getElementById('arrival-detail').textContent=m.step===1?`${g.rocks.filter(r=>r.broken).length}/2 pedras removidas. ${t.detail}`:t.detail;
 root.getElementById('arrival-note').textContent=m.captionTime>0?m.caption:g.arrival.step===3?'RETORNO À COSTA':'COSTA LESTE · GOKU';
 root.getElementById('arrival-interact').hidden=true;
 const radio=root.getElementById('arrival-radio'),line=m.radio[0];radio.hidden=!line;radio.textContent=line?`${line.speaker} · ${line.text}`:'';
 root.getElementById('arrival-distance').textContent=(g.p.x>t.x?'← ':'→ ')+Math.round(Math.abs(g.p.x-t.x)/10)+' m';
 drawArrivalMinimap(root.getElementById('arrival-minimap').getContext('2d'),g);
}
