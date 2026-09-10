export function impactKind(options={}){
  return options.launch?'rise':options.slam?'fall':options.finisher||options.heavy?'heavy':options.style==='kick'?'kick':'punch';
}
export function impactPause(kind){return {punch:.028,kick:.042,heavy:.065,rise:.05,fall:.06}[kind]??.028;}
export function hitReaction(actor,reduced=false){
  const r=actor.hitReaction;
  if(!r||r.life<=0)return {lean:0,lift:0,squash:0};
  const t=Math.max(0,Math.min(1,r.life/r.max)),a=t*t*(3-2*t)*(reduced?.3:1),dir=r.dir||1;
  return {lean:dir*a*(r.kind==='punch'?.045:r.kind==='kick'?.09:.13),lift:a*(r.kind==='rise'?-7:r.kind==='fall'?5:0),squash:a*(r.kind==='punch'?.02:r.kind==='kick'?.045:.065)};
}
export function tickReaction(actor,dt){if(actor.hitReaction)actor.hitReaction.life=Math.max(0,actor.hitReaction.life-dt);}
export function setReaction(actor,options,dir){const kind=impactKind(options),max=kind==='punch'?.18:kind==='kick'?.24:.32;actor.hitReaction={kind,dir,max,life:max};return kind;}
