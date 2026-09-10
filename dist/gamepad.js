// W3C standard mapping used by Xbox controllers in compatible browsers.
export const XBOX_BUTTONS={0:'dash',1:'guard',2:'attack',3:'blast',4:'lockOn',5:'jump',6:'charge',7:'descend',8:'zoom',9:'pause',11:'transform',12:'up',13:'down',14:'left',15:'right'};
export function decodePad(pad){
 const state={};for(const [index,action] of Object.entries(XBOX_BUTTONS)){const b=pad.buttons?.[index];state[action]=!!b&&(b.pressed||b.value>.55);}
 const x=Number.isFinite(pad.axes?.[0])?pad.axes[0]:0,y=Number.isFinite(pad.axes?.[1])?pad.axes[1]:0;
 state.left ||= x<-.24;state.right ||= x>.24;state.up ||= y<-.24;state.down ||= y>.24;
 state.confirm=state.dash;state.back=state.guard;state.skills=state.blast;
 state.flightMode=true;
 state.ascend=state.jump;state.down ||= state.descend;
 state.dragonDash=state.charge&&state.dash;
 state.special=state.charge&&state.blast;
 state.ultimate=state.special&&state.down;
 state.transform ||= state.charge&&state.guard;
 state.vanish=state.guard&&(state.left||state.right)&&!state.charge;
 if(state.charge){state.blast=false;state.guard=false;}
 return state;
}
export class XboxInput{
 constructor(read=()=>globalThis.navigator?.getGamepads?.()||[]){this.read=read;this.index=null;this.previous={};this.blocked=false;this.pad=null;this.lastRumble=0;}
 suppress(){this.blocked=true;}
 poll(){
  let pads;try{pads=Array.from(this.read()||[]);}catch{return this.drop('O navegador bloqueou o acesso ao controle.');}
  if(this.index!==null&&!pads.some(p=>p?.connected&&p.index===this.index))return this.drop();
  const pad=pads.find(p=>p?.connected&&p.index===this.index)||pads.find(p=>p?.connected&&p.mapping==='standard');
  if(!pad)return {input:{pressed:{}},connected:false,unsupported:pads.some(p=>p?.connected)};
  if(pad.mapping!=='standard')return this.drop('Controle sem mapeamento padrão.');
  const changed=this.index!==pad.index;this.pad=pad;this.index=pad.index;
  const state=decodePad(pad),pressed={};
  if(changed){this.previous=state;this.blocked=true;}
  if(this.blocked){if(!Object.entries(state).some(([key,value])=>key!=='flightMode'&&value)){this.blocked=false;this.previous={};}else this.previous=state;return {input:{pressed:{}},connected:true,changed};}
  for(const [action,held] of Object.entries(state))if(held&&!this.previous[action])pressed[action]=true;
  if(this.previous.jump&&!state.jump)pressed.jumpRelease=true;
  this.previous=state;return {input:{...state,pressed},connected:true,changed};
 }
 drop(error){const disconnected=this.index!==null;this.index=null;this.pad=null;this.previous={};this.blocked=false;return {input:{pressed:{}},connected:false,disconnected,error};}
 rumble(strong=.2,duration=70){
  const now=Date.now();if(now-this.lastRumble<75)return;this.lastRumble=now;
  try{this.pad?.vibrationActuator?.playEffect?.('dual-rumble',{duration,startDelay:0,strongMagnitude:strong,weakMagnitude:Math.min(1,strong+.2)})?.catch?.(()=>{});}catch{}
 }
}
