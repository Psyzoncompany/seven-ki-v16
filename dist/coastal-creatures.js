import {tickReaction} from './hit-reaction.js';
export function createCoastalCreatures(step){
 return [[1220,0,64,1],[2450,1,76,2],[2710,0,88,2]].map(([x,row,hp,missionStep],id)=>({id,x,home:x,y:462,vx:0,vy:0,w:54,h:66,dir:-1,type:0,creature:true,creatureRow:row,missionStep,name:row?'RAPTOR DA ENCOSTA':'SAURO DA COSTA',hp:step>missionStep?0:hp,maxHp:hp,orb:0,state:'idle',timer:0,cooldown:.6+id*.35,stun:0,flash:0,dead:0,invincible:0,grounded:true,launchTime:0,airFloat:0,moveCycle:0,defenseCooldown:0,guard:100,phase:1,attackCount:0,attackKind:'strike',hitstun:0,blockstun:0,wallBounces:0,groundBounces:0,observed:0}));
}
export function updateCoastalEncounters(g){
 const step=g.arrival.step;
 for(const arena of g.encounters){
  if(arena.cleared)continue;
  const living=g.enemies.some(e=>arena.ids.includes(e.id)&&e.hp>0);
  if(!living){arena.cleared=true;arena.active=false;if(g.activeEncounter===arena)g.activeEncounter=null;g.p.hp=Math.min(g.maxHp,g.p.hp+20);g.p.ki=Math.min(100,g.p.ki+12);g.arrival.caption='CAMINHO LIVRE · +20 VIDA';g.arrival.captionTime=4;continue;}
  const nearby=g.p.x>=arena.left-100&&g.p.x<=arena.right+100;
  if(step>=arena.missionStep&&nearby&&!arena.active){arena.active=true;if(!arena.seen){arena.seen=true;g.arrival.caption='MINI LUTA OPCIONAL · VENÇA PARA RECUPERAR VIDA';g.arrival.captionTime=4;}}
  if(!nearby)arena.active=false;
 }
}
export function updateCoastalCreature(g,e,dt){
 tickReaction(e,dt);e.moveCycle+=dt;e.flash=Math.max(0,e.flash-dt);e.invincible=Math.max(0,e.invincible-dt);e.cooldown=Math.max(0,e.cooldown-dt);e.timer-=dt;
 if(e.hp<=0){e.dead=Math.max(0,e.dead-dt);return;}
 const arena=g.encounters.find(a=>a.ids.includes(e.id));
 if(!arena?.active){e.state='idle';return;}
 const p=g.p,dx=p.x-e.x,dist=Math.abs(dx),vertical=Math.abs(p.y-e.y),dir=dx<0?-1:1;
 if(e.stun>0){e.stun=Math.max(0,e.stun-dt);e.launchTime=Math.max(0,e.launchTime-dt);e.state='hurt';e.vx*=Math.exp(-6*dt);}
 else if(e.state==='windup'){
  e.vx=0;
  if(e.timer<=0){e.state='attack';e.timer=.2;e.attackDid=false;e.vx=e.dir*(e.creatureRow?360:270);}
 }else if(e.state==='attack'){
  if(!e.attackDid&&dist<98&&vertical<85&&(p.x-e.x)*e.dir>-15){g.hitPlayer(e.creatureRow?12:16,e.x,160,false,{style:e.creatureRow?'kick':'jab'});e.attackDid=true;}
  if(e.timer<=0){e.state='recover';e.timer=e.creatureRow?.6:.8;e.vx=0;}
 }else if(e.state==='recover'){e.vx=0;if(e.timer<=0){e.state='idle';e.cooldown=.5;}}
 else{
  e.dir=dir;
  if(dist<145&&vertical<110&&e.cooldown<=0){e.state='windup';e.timer=e.creatureRow?.38:.55;e.windupDuration=e.timer;e.vx=0;}
  else{e.state='run';e.vx=dir*(e.creatureRow?175:125);if(dist<70)e.vx=0;}
  // A visible leap allows engagement with low-flying Goku, without teleporting.
  if(p.y<e.y-80&&e.grounded&&dist<230){e.vy=-590;e.grounded=false;}
 }
 e.x=Math.max(arena.left+40,Math.min(arena.right-40,e.x+e.vx*dt));e.vy+=1600*dt;e.y=Math.max(174,e.y+e.vy*dt);
 if(e.y>=462){e.y=462;e.vy=0;e.grounded=true;e.launchTime=0;}else e.grounded=false;
}
