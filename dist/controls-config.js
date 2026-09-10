export const ACTIONS=['left','right','attack','jump','dash','technique','charge','guard','blast','special','transform'];
export const DEFAULTS={
  portrait:{left:[9,68],right:[25,68],attack:[89,50],jump:[76,80],dash:[48,80],technique:[62,48],charge:[42,40],guard:[63,40],blast:[86,40],special:[53,78],transform:[77,78]},
  landscape:{left:[6,67],right:[17,67],attack:[92,65],jump:[79,65],dash:[53,65],technique:[66,65],charge:[40,65],guard:[53,65],blast:[66,65],special:[79,65],transform:[92,65]}
};
export function sanitizePrefs(value){
  const prefs={size:1,opacity:.86,portrait:{},landscape:{}};
  if(value&&typeof value==='object'){
    if(Number.isFinite(value.size))prefs.size=Math.max(.8,Math.min(1.3,value.size));
    if(Number.isFinite(value.opacity))prefs.opacity=Math.max(.4,Math.min(1,value.opacity));
  }
  for(const mode of ['portrait','landscape'])for(const key of ACTIONS){
    const v=value?.[mode]?.[key];prefs[mode][key]=Array.isArray(v)&&v.length===2&&v.every(Number.isFinite)?v.map(n=>Math.max(2,Math.min(98,n))):[...DEFAULTS[mode][key]];
  }
  return prefs;
}
export function buttonSize(action,prefs,width){const base=action==='attack'?68:action==='jump'?57:['left','right'].includes(action)?52:['charge','guard','blast','special','transform'].includes(action)?43:49;return Math.max(36,Math.min(base*prefs.size,width*.19));}
export function controlPosition(action,prefs,mode,width,height){
  const size=buttonSize(action,prefs,width),[px,py]=prefs[mode][action];
  return {size,x:Math.max(size/2+3,Math.min(width-size/2-3,width*px/100)),y:Math.max(size/2+3,Math.min(height-size/2-3,height*py/100))};
}
