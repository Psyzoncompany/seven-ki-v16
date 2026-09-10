export function freezaPose(a){
 if(a.finishing)return 22;
 if(a.hp<=0)return 23;
 if(a.stun>0)return 22;
 if(a.guarding||a.state==='guard')return a.flash>0?21:20;
 if(a.charging||a.state==='charge'||a.state==='transform')return 18;
 if(a.attack){const m=a.attack.move,t=a.attack.t,phase=t<m.active?0:t<=m.end?1:2;
  if(['rise','launch'].includes(m.effect)||a.attack.kind==='launch')return [12,13,2][phase];
  if(a.attack.kind==='slam'||m.effect==='fall')return 14;
  return (['kick','spin'].includes(m.effect)?9:6)+phase;
 }
 if(['special','blast'].includes(a.state))return a.specialVariant==='deathBall'?19:a.stateTime<.26?15:a.stateTime<.6?16:17;
 if(a.state==='windup')return a.attackKind==='galick'?15:a.attackKind==='double'?19:a.attackKind==='launcher'?12:9;
 if(a.state==='attack')return a.attackKind==='launcher'?13:a.attackKind==='finisher'?10:7;
 if(a.state==='recover')return a.attackKind==='galick'?17:11;
 if(!a.grounded)return Math.abs(a.vx)>100?3:Math.abs(a.vx)>35?4:2;
 if(a.state==='land')return 5;
 if(Math.abs(a.vx)>35)return 3;
 return Math.floor((a.anim||a.moveCycle||0)*3)%2;
}
