import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {findSpriteFrames} from '../dist/sprite-frames.js';
const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function buildAtlas('),source.indexOf('function playerAtlas('));
const build=vm.runInNewContext(fn+';buildAtlas',{document:{createElement:()=>createCanvas(1,1)},findSpriteFrames,clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
const img=await loadImage(fileURLToPath(new URL('../dist/assets/saiyan-bosses-v21.png',import.meta.url)));
const atlas=build(img,6,3);assert.equal(atlas.frames.length,18);
const sheet=createCanvas(1440,540),ctx=sheet.getContext('2d');ctx.imageSmoothingEnabled=false;
for(let i=0;i<18;i++){
 const f=atlas.frames[i],[sx,sy,w,h]=f.rect,x=i%6*240,y=Math.floor(i/6)*180;
 assert(w>100&&h>100,`Empty or clipped pose ${i}`);
 const scale=125/atlas.frames[Math.floor(i/6)*6].rect[3];
 ctx.fillStyle=i%2?'#132943':'#183551';ctx.fillRect(x,y,240,180);
 ctx.drawImage(atlas.image,sx,sy,w,h,x+90-w*f.anchor*scale,y+165-h*scale,w*scale,h*scale);
 ctx.fillStyle='#fff';ctx.font='12px monospace';ctx.fillText(String(i),x+5,y+14);
}
fs.mkdirSync(new URL('../output/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../output/boss-sprite-check.png',import.meta.url),sheet.toBuffer('image/png'));
console.log('18 boss poses rendered for visual inspection.',JSON.stringify(atlas.frames));
