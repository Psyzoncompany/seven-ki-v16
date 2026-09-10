import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../dist/engine.js';
import {hazardAnimation,drawWorldEffect,effectDuration} from '../dist/world-animation.js';

test('hazard visuals agree with damage windows across complete cycles',()=>{
 const g=new GameEngine();
 for(const type of ['spikes','lava','acid','geyser','eruption','rocks']){
  const h={type,x:120,offset:.23,period:3.5,born:0};
  for(let i=0;i<700;i++){g.time=i/100;assert.equal(hazardAnimation(h,g.time).state,g.hazardState(h));}
 }
});
test('layered effects finish transparent and emit finite, bounded draw calls',()=>{
 for(const [profile,max] of Object.entries(effectDuration))for(const reduced of [false,true]){
  for(let step=0;step<=60;step++){
   const calls=[];drawWorldEffect((...args)=>calls.push(args),{profile,life:max*(1-step/60),max,size:100},0,0,reduced);
   assert(calls.length<=3);
   for(const [frame,x,y,w,h,a] of calls){assert([frame,x,y,w,h,a].every(Number.isFinite));assert(frame>=0&&frame<16);assert(w>=0&&h>=0);assert(a>=0&&a<=1);if(step===60)assert(a<1e-10);}
  }
 }
});
