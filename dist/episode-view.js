import {EPISODE_ACTORS} from './episode-campaign.js';

export function drawEpisodeWorld(c,g,cam,atlases,sprite){
 const m=g.episode,p=g.p;
 const actor=(id,x,y,frame=0)=>{const a=atlases[id],f=a.frames[frame];sprite(a.image,f.rect,x-cam,y,1,f.scale??EPISODE_ACTORS[id].height/a.frames[0].rect[3],{anchor:f.anchor});};
 if(g.stageId===1102){actor('goku',m.step===0?360-Math.min(1,m.sceneTime/3)*50:m.step===3?3130:Math.max(180,p.x-150),462);}
 else if(p.character!=='gohan')actor(p.character==='piccolo'?'goku':'piccolo',m.step===3?3120:Math.max(180,p.x-140),462);
 if(g.stageId===1103){
  const a=atlases.arrivalProps,f=a.frames[1];sprite(a.image,f.rect,3020-cam,466,-1,140/f.rect[3],{anchor:.5});
  if(p.character==='gohan'){
   // A confined cutaway of the capsule. The child cannot leave this story segment.
   c.save();c.strokeStyle='#436c8c';c.lineWidth=8;c.fillStyle='#e7f1f8bb';c.beginPath();c.roundRect(2600-cam,325,350,140,35);c.fill();c.stroke();
   c.fillStyle='#52bce65a';c.fillRect(2790-cam,451,120,11);
   const warning=m.elapsed%2.5>1.7;c.fillStyle=warning?'#fdb32d':'#86bcc9';c.fillRect(2630-cam,338,18,9);c.fillRect(2900-cam,338,18,9);
   c.strokeStyle='#709caf';c.lineWidth=3;for(let x=2660;x<2940;x+=65){c.beginPath();c.moveTo(x-cam,328);c.lineTo(x-cam,361);c.stroke();}c.restore();
  }else{const a=atlases.saiyanBosses,f=a.frames[0];sprite(a.image,f.rect,3330-cam,462,-1,125/f.rect[3],{anchor:f.anchor});}
 }
}

export function updateEpisodeHud(g,root){
 const m=g.episode;if(!m)return;
 const t=g.story.objectives[m.step],actor=EPISODE_ACTORS[g.p.character];
 root.body.classList.add('arrival-mode');root.body.classList.toggle('child-segment',g.p.character==='gohan');
 root.getElementById('arrival-hud').hidden=!['playing','paused'].includes(g.mode);
 root.querySelector('.arrival-radar header').firstChild.textContent=t.captive?'CÁPSULA ':'TERRA ';
 root.getElementById('arrival-step').textContent=g.story.number+' / '+(m.step+1)+' DE '+g.story.objectives.length;
 root.getElementById('arrival-title').textContent=t.title;
 root.getElementById('arrival-detail').textContent=t.captive?t.detail+' · Proteção: '+Math.min(6,m.hold).toFixed(1)+' / 6 s':t.detail;
 root.getElementById('arrival-note').textContent=actor.name+' · '+(m.step?'CHECKPOINT '+(m.step+1):g.story.location);
 root.getElementById('arrival-radio').hidden=true;root.getElementById('arrival-interact').hidden=true;
 root.getElementById('arrival-distance').textContent=(g.p.x>t.x?'← ':'→ ')+Math.round(Math.abs(g.p.x-t.x)/10)+' m';
 const canvas=root.getElementById('arrival-minimap'),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 c.clearRect(0,0,w,h);c.fillStyle='#e6f4ff';c.fillRect(0,0,w,h);
 const left=t.captive?2550:0,span=t.captive?500:g.story.width,px=x=>8+(x-left)/span*(w-16),py=y=>10+y/462*(h-20);
 c.strokeStyle='#598296';c.lineWidth=2;c.beginPath();c.moveTo(8,py(462));c.lineTo(w-8,py(462));c.stroke();
 for(const platform of g.platforms){c.fillStyle='#7cb87f';c.fillRect(px(platform.x),py(platform.y),platform.w/span*(w-16),3);}
 for(const r of g.rocks)if(!r.broken){c.fillStyle='#986b46';c.fillRect(px(r.x)-2,py(r.y-r.h),4,r.h/462*(h-20));}
 for(const e of g.enemies)if(e.hp>0&&Math.abs(e.x-g.p.x)<650){c.fillStyle='#c23d3b';c.fillRect(px(e.x)-2,py(e.y)-3,4,4);}
 if(!t.captive){c.fillStyle='#4974c5';c.fillRect(px(Math.max(180,g.p.x-140))-2,py(462)-3,4,4);}
 c.fillStyle='#b27500';c.fillRect(px(t.x)-3,py(t.y)-4,6,6);c.fillStyle='#007458';c.beginPath();c.arc(px(g.p.x),py(g.p.y),3.5,0,Math.PI*2);c.fill();
}
