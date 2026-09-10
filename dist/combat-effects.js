// Small, vector contact effects. Time is normalized so fades are independent of FPS.
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export function drawCombatEffect(ctx,e,x,y,reduced=false){
  const profile=e.profile||e.type;
  if(!['impact','heavy','hit','comboImpact','impactRays','slash','comboArc','guard','parry','break'].includes(profile))return false;
  const t=clamp(1-e.life/e.max),fade=ease(t/.09)*(1-ease((t-.12)/.88));
  const heavy=profile==='heavy'||profile==='break'||e.heavy;
  const color=profile==='guard'||profile==='parry'?'#b6e5ed':heavy?'#efd4a4':'#e6eef0';
  const travel=ease(t)*(reduced?.2:1);
  ctx.save();ctx.translate(x,y);ctx.scale(e.dir||1,1);
  ctx.globalAlpha=fade*(reduced?.45:.72);ctx.strokeStyle=color;ctx.lineCap='round';
  if(profile==='slash'||profile==='comboArc'){
    ctx.rotate(e.style==='rise'?-.9:e.style==='fall'?.9:-.25);
    ctx.lineWidth=1.3*(1-t)+.4;
    ctx.beginPath();ctx.ellipse(-12,0,25+travel*6,15,0,-1.1+travel*.45,1.05+travel*.45);ctx.stroke();
  }else if(profile==='guard'||profile==='parry'){
    ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,12+travel*9,-1.15,1.15);ctx.stroke();
    if(profile==='parry'){ctx.globalAlpha*=.35;ctx.beginPath();ctx.arc(0,0,17+travel*11,-1.15,1.15);ctx.stroke();}
  }else{
    const radius=heavy?10:6,count=heavy?5:3;
    ctx.lineWidth=heavy?1.5:1.1;
    for(let i=0;i<count;i++){
      const angle=i*Math.PI*2/count+.3,inner=3+travel*radius,outer=inner+(heavy?10:7)*(1-ease(t));
      ctx.beginPath();ctx.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);ctx.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);ctx.stroke();
    }
    const glow=ctx.createRadialGradient(0,0,0,0,0,radius*1.5);
    glow.addColorStop(0,heavy?'#efd4a455':'#e6eef044');glow.addColorStop(1,'#e6eef000');
    ctx.fillStyle=glow;ctx.fillRect(-radius*1.5,-radius*1.5,radius*3,radius*3);
  }
  ctx.restore();return true;
}
