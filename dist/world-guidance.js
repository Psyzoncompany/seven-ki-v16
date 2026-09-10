import {arrivalTarget} from './arrival-mission.js';

// Directions describe the next reachable objective, including the return trip.
export function worldGuidance(g){
  if(g.mode!=='playing'||g.versus)return null;
  if(g.episode){const t=g.story.objectives[g.episode.step];return {x:t.x,y:t.y,label:t.title};}
  if(g.arrival){const t=arrivalTarget(g);return {x:t.x,y:t.y,label:t.title};}
  if(g.activeEncounter)return null;
  const orb=g.orbs.filter(o=>!o.got).sort((a,b)=>Math.abs(a.x-g.p.x)-Math.abs(b.x-g.p.x))[0];
  if(orb)return {...orb,label:'Reúna as esferas'};
  if(!g.bossDefeated)return {x:g.boss.x,y:g.boss.y,label:'Encontre '+g.level.bossName};
  return {x:6100,y:462,label:'Siga até o portal'};
}

export function drawWorldGuidance(c,g,cam,width,reduced){
  const target=worldGuidance(g);if(!target)return;
  const direction=target.x>=g.p.x?1:-1;
  const x=Math.max(30,Math.min(width-30,g.p.x-cam+direction*90));
  const y=g.p.y+22+(reduced?0:Math.sin(g.visualTime*4)*2);
  c.save();c.translate(x,y);c.scale(direction,1);c.lineWidth=3;c.strokeStyle='#154477';c.fillStyle='#ffcb36';
  c.beginPath();c.moveTo(-18,-6);c.lineTo(2,-6);c.lineTo(2,-14);c.lineTo(20,0);c.lineTo(2,14);c.lineTo(2,6);c.lineTo(-18,6);c.closePath();c.fill();c.stroke();c.restore();
}
