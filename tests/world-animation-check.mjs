import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {gridAtlas} from '../dist/impact-feedback.js';
import {drawWorldEffect,effectDuration,drawWorldHazard} from '../dist/world-animation.js';
const atlas=gridAtlas(await loadImage(new URL('../dist/assets/combat-world-v21.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')));
const canvas=createCanvas(1080,1020),ctx=canvas.getContext('2d');
ctx.fillStyle='#152537';ctx.fillRect(0,0,1080,1020);
const draw=(frame,x,y,w,h,a=1)=>{ctx.save();ctx.globalAlpha=a;ctx.drawImage(atlas.image,...atlas.frames[frame].rect,x-w/2,y-h/2,w,h);ctx.restore();};
const profiles=['rock','heavy','parry','break','nova','dust'];
profiles.forEach((profile,row)=>{
 [0.08,.25,.5,.75,.95].forEach((t,col)=>{
  const x=108+col*216,y=75+row*140,max=effectDuration[profile];
  ctx.fillStyle='#dce8f8';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(`${profile} ${(t*max).toFixed(2)}s`,x,y-48);
  ctx.save();ctx.translate(x,y+10);if(profile==='nova')ctx.scale(.4,.4);
  drawWorldEffect(draw,{profile,frame:({heavy:9,parry:11,break:12})[profile],size:75,life:max*(1-t),max},0,0);ctx.restore();
 });
});
['spikes','lava','acid','geyser','rocks'].forEach((type,i)=>drawWorldHazard(draw,{type,w:110,x:0},1.16,108+i*216,990));
writeFileSync(new URL('../output/world-animation-check.png',import.meta.url),canvas.toBuffer('image/png'));
console.log('output/world-animation-check.png');
