import test from 'node:test';
import assert from 'node:assert/strict';
import {KeyboardInput,decodeKeyboard} from '../dist/keyboard.js';
import {decodePad} from '../dist/gamepad.js';
const input=(...keys)=>decodeKeyboard(new Set(keys));
test('keyboard keys reproduce Xbox positions and shoulder buttons',()=>{
  for(const [key,index] of [['ArrowLeft',2],['ArrowUp',3],['ArrowRight',1],['ArrowDown',0],['KeyQ',4],['KeyE',5],['ControlLeft',6],['ControlRight',6],['Space',7]]){
    const pad={buttons:Array.from({length:16},(_,i)=>({pressed:i===index})),axes:[0,0]};
    assert.deepEqual(input(key),decodePad(pad));
  }
  for(const [key,action] of [['KeyW','up'],['KeyA','left'],['KeyS','down'],['KeyD','right']])assert(input(key)[action]);
  assert(!input('Space').jump);assert(!input('ArrowUp').up);
});
test('keyboard modifiers produce specials, rush and defensive movement',()=>{
  assert(input('ControlLeft','ArrowUp').special);assert(!input('ControlLeft','ArrowUp').blast);
  assert(input('ControlRight','Space','ArrowUp').ultimate);
  assert(input('ControlLeft','ArrowDown').dragonDash);
  assert(input('ArrowRight','KeyA').vanish);
  assert(input('ArrowRight','ArrowDown').guard&&input('ArrowRight','ArrowDown').dash);
});
test('keyboard edges do not repeat, retain taps, and release either Ctrl correctly',()=>{
  const k=new KeyboardInput(),keys=new Set(['ControlLeft']);k.change(keys);k.poll(keys);
  keys.add('ArrowUp');k.change(keys);assert(k.poll(keys).pressed.special);assert.deepEqual(k.poll(keys).pressed,{});
  keys.add('ControlRight');k.change(keys);keys.delete('ControlLeft');k.change(keys);assert(k.poll(keys).charge);
  k.reset();keys.clear();keys.add('KeyE');k.change(keys);keys.clear();k.change(keys);
  const tap=k.poll(keys);assert(tap.pressed.jump);assert(tap.pressed.jumpRelease);
  k.reset();assert.deepEqual(k.poll(new Set()),{pressed:{}});
});
