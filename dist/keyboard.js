import {decodePad} from './gamepad.js';
// Physical Xbox positions: left X, top Y, right B, bottom A.
export const KEY_MAP={KeyW:'up',KeyA:'left',KeyS:'down',KeyD:'right',ArrowLeft:'attack',ArrowUp:'blast',ArrowRight:'guard',ArrowDown:'dash',KeyQ:'lockOn',KeyE:'jump',ControlLeft:'charge',ControlRight:'charge',Space:'descend',KeyT:'transform',Tab:'zoom'};
const buttons={ArrowDown:0,ArrowRight:1,ArrowLeft:2,ArrowUp:3,KeyQ:4,KeyE:5,ControlLeft:6,ControlRight:6,Space:7,Tab:8,KeyT:11};
export function decodeKeyboard(keys){
  const pad={buttons:Array.from({length:16},()=>({pressed:false})),axes:[Number(keys.has('KeyD'))-Number(keys.has('KeyA')),Number(keys.has('KeyS'))-Number(keys.has('KeyW'))]};
  for(const code of keys)if(code in buttons)pad.buttons[buttons[code]].pressed=true;
  return decodePad(pad);
}
export class KeyboardInput{
  constructor(){this.reset();}
  reset(){this.previous={};this.pending={};this.active=false;}
  change(keys){
    this.active=true;const state=decodeKeyboard(keys);
    for(const [action,value] of Object.entries(state))if(value&&!this.previous[action]&&action!=='flightMode')this.pending[action]=true;
    if(this.previous.jump&&!state.jump)this.pending.jumpRelease=true;
    this.previous=state;
    // Modifier chords consume their base buttons, including edges from this frame.
    if(state.charge){delete this.pending.blast;delete this.pending.guard;}
  }
  poll(keys){const state=this.active?decodeKeyboard(keys):{},pressed=this.pending;this.pending={};return {...state,pressed};}
}
