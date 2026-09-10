// Common silhouette proportions and hip pivots for the two authored Goku atlases.
const heights=[105,105,98,98,100,98,103,103,103,105,105,103,101,99,103,87,119,103,109,105,89,89,99,89,100,96,89,105,101,99];
const pivots=[.48,.48,.48,.55,.49,.42,.48,.36,.48,.46,.31,.48,.48,.35,.48,.5,.4,.48,.43,.53,.4,.37,.43,.61,.48,.6,.5,.5,.5,.42];
export function normalizeHeroAtlas(atlas){
 atlas.frames=atlas.frames.map((f,i)=>({...f,scale:heights[i]/f.rect[3],anchor:pivots[i]}));atlas.scale=atlas.frames[0].scale;return atlas;
}
export function heroMotionFrame(p,elapsed=1){
 if(p.hp<=0||p.stun>0||p.finishing)return 25;
 if(p.attack){const a=p.attack,m=a.move,e=m.effect,frames=e==='rise'?[15,16,17]:e==='fall'?[20,23,23]:['kick','spin'].includes(e)?[9,10,11]:m.frames;return frames[a.t<m.active?0:a.t<=m.end?1:2];}
 if(p.hurtRecoveryAnim>0||p.state==='guard')return 24;
 if(p.state==='counter'||p.state==='dash'||p.state==='evade')return 26;
 if(p.state==='windup')return ['strike','counter','airStrike','finisher'].includes(p.attackKind)?6:p.attackKind==='launcher'?15:28;
 if(['genki','transform','charge','feint'].includes(p.state))return 27;
 if(p.state==='special')return p.stateTime<.26?28:29;
 if(p.state==='attack'&&['strike','counter','airStrike','finisher','launcher'].includes(p.attackKind))return p.attackKind==='launcher'?16:p.attackKind==='finisher'?23:7;
 if(p.state==='blast'||p.state==='attack')return 29;
 if(p.diving)return 23;
 if(!p.grounded){if(Math.abs(p.vx)>155)return 26;if(Math.abs(p.vy)<85)return elapsed<.12?22:19;return p.vy<0?18:19;}
 if(Math.abs(p.vx)>35)return 2+[0,1,2,3,2,1][Math.floor((p.anim||p.moveCycle||0)*10)%6];
 return elapsed<.12?24:Math.floor((p.anim||p.moveCycle||0)*2)%2;
}
export class HeroAnimator{
 constructor(){this.reset();}
 reset(){this.state='';this.elapsed=1;this.lean=0;this.lift=0;}
 sample(p,dt){
  const state=p.attack?'attack':p.stun>0?'hurt':p.state==='guard'?'guard':p.state==='charge'?'charge':!p.grounded?(Math.abs(p.vx)>155?'flight':Math.abs(p.vy)<85?'hover':'jump'):Math.abs(p.vx)>35?'run':p.state;
  if(state!==this.state){this.state=state;this.elapsed=0;}else this.elapsed+=dt;
  const target=state==='flight'?p.dir*.10:state==='run'?p.vx/5000:state==='hurt'?-p.dir*.08:0,mix=1-Math.exp(-dt*18);
  this.lean+=(target-this.lean)*mix;const lift=state==='hover'?Math.sin((p.anim||p.moveCycle||0)*4)*1.5:0;this.lift+=(lift-this.lift)*mix;
  return {frame:heroMotionFrame(p,this.elapsed),lean:this.lean,lift:this.lift,breath:state==='charge'?1+Math.sin((p.anim||p.moveCycle||0)*9)*.012:1};
 }
}
