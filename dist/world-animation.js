// Animate the painted atlas in layers; all clocks are seconds, independent of FPS.
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const effectDuration={impact:.3,heavy:.42,guard:.36,parry:.48,break:.52,dust:1.05,rock:1.35,slash:.28,beam:1.05,nova:1.2,genki:1.5};
export function effectProfile(type,heavy=false){
  if(type==='rockBreak')return 'rock';
  if(['land','terrainImpact','groundBounce'].includes(type))return 'dust';
  if(type==='swing')return 'slash';
  return heavy||['playerHit','groundFinish','wallImpact','saiyanImpact'].includes(type)?'heavy':'impact';
}
export function effectEnvelope(t){return (1-smooth((t-.32)/.68))*smooth(t/.065);}

// draw(frame, x, y, width, height, alpha): shared by the game and visual checks.
export function drawWorldEffect(draw,e,x,y,reduced=false){
  const t=clamp(1-e.life/e.max),a=effectEnvelope(t),size=e.size||110;
  const profile=e.profile||e.type;
  const motion=reduced?.25:1;
  if(profile==='rock'){
    draw(1,x,y,size,size,(1-smooth(t/.26))*.95);
    const scatter=smooth((t-.08)/.7)*motion;
    draw(2,x,y-18*Math.sin(t*Math.PI)*motion+28*t*t,size*(.6+scatter*1.3),size*(.6+scatter),smooth(t/.16)*(1-smooth((t-.48)/.52)));
    draw(14,x,y+size*.24-12*t,size*(.55+t),size*(.24+t*.3),smooth((t-.12)/.2)*(1-smooth((t-.55)/.45))*.65);
    return;
  }
  if(profile==='dust'){
    draw(14,x,y-12*t*motion,size*(.55+t*.9*motion),size*(.4+t*.35),a*.75);return;
  }
  if(profile==='beam'){
    const length=550*(.15+.85*smooth(t/.14));
    const width=(45+20*Math.sin(t*26)*motion)*a;
    // The caller rotates this vertical plume into the firing direction.
    draw(15,x,y-length/2,width,length,a*.8);
    draw(11,x,y,80*(.8+t*.5),80*(.8+t*.5),a*.55);
    return;
  }
  if(['nova','genki'].includes(profile)){
    const s=(profile==='genki'?260:220)*(.3+smooth(t/.7)*.95);
    draw(11,x,y,s*1.2,s*1.2,a*.45);
    draw(15,x,y,s,s,a*.85);return;
  }
  // Contact sparks stay close to the hit point so combo effects cannot cover a fighter.
  if(['impact','heavy','hit','comboImpact','impactRays'].includes(profile)){
    const diameter=Math.min(size*.58,58)*(.65+.35*smooth(t/.14));
    const opacity=.72*smooth(t/.065)*(1-smooth((t-.14)/.86));
    draw(e.frame??(profile==='heavy'?9:8),x,y,diameter,diameter,opacity);
    return;
  }
  const scale=.5+.5*smooth(t/.18)+t*.28*motion;
  const frame=e.frame??(profile==='slash'?13:profile==='heavy'?9:8);
  draw(frame,x,y,size*scale,size*scale,a);
  if(!reduced&&profile!=='slash'){
    // A softer delayed echo makes the dissipation visible without holding the flash.
    const echo=smooth((t-.18)/.15)*(1-smooth((t-.45)/.55));
    draw(frame,x,y,size*(1+t*.65),size*(1+t*.65),echo*.18);
  }
}

export function hazardAnimation(h,time,reduced=false){
  const pool=['lava','acid'].includes(h.type);
  const phase=h.type==='eruption'?time-h.born:(time+(h.offset||0))%(h.period||3.5);
  const state=pool?'active':phase<.85?'warning':phase<1.5?'active':'idle';
  const wave=reduced?0:Math.sin(time*5+(h.offset||h.x)*.1);
  const rise=state==='active'?(pool?1:.8+.2*smooth((phase-.85)/.1)):0;
  return {state,phase,wave,rise,warning:.22+.18*(.5+.5*wave)};
}
export function drawWorldHazard(draw,h,time,x,ground,reduced=false){
  const v=hazardAnimation(h,time,reduced),pool=['lava','acid'].includes(h.type);
  const frame={spikes:4,lava:5,acid:6,geyser:7,eruption:15,rocks:2}[h.type]??4;
  if(v.state==='active'){
    const height=(pool?45:h.type==='spikes'?35:130)*v.rise*(1+v.wave*.045);
    if(h.type==='rocks'){
      const fall=reduced?.5:clamp((v.phase-.85)/.65);
      draw(2,x,ground-110+80*fall,h.w+12,90,.95);
      draw(14,x,ground-10,h.w+22,30,smooth((fall-.6)/.4)*.6);
    }else draw(frame,x,ground-height/2+5,h.w+12,height,.94);
  }else if(v.state==='warning')draw(frame,x,ground-20,h.w,38,v.warning);
  else if(v.phase<2.1&&h.type!=='spikes'){
    const t=(v.phase-1.5)/.6;
    draw(14,x,ground-14-t*8,h.w*(1+t*.35),30+t*14,(1-smooth(t))*.35);
  }
  return v;
}
