import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {findSpriteFrames} from '../dist/sprite-frames.js';
const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function buildAtlas('),source.indexOf('function playerAtlas('));
const build=vm.runInNewContext(fn+';buildAtlas',{document:{createElement:()=>createCanvas(1,1)},findSpriteFrames,clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
const img=await loadImage(fileURLToPath(new URL('../dist/assets/combo-roster-v22.png',import.meta.url)));
const atlas=build(img,6,4);
assert.equal(atlas.frames.length,24);
const preview=createCanvas(960,640),ctx=preview.getContext('2d');
for(let i=0;i<24;i++){
  const f=atlas.frames[i],[sx,sy,w,h]=f.rect,x=i%6*160,y=Math.floor(i/6)*160;
  assert(w>90&&h>140&&w<310&&h<285);assert(f.anchor>0&&f.anchor<1);
  assert(sx>=0&&sy>=0&&sx+w<=atlas.image.width&&sy+h<=atlas.image.height);
  const scale=110/atlas.frames[Math.floor(i/6)*6+2].rect[3];
  ctx.fillStyle='#132943';ctx.fillRect(x,y,160,160);
  ctx.drawImage(atlas.image,sx,sy,w,h,x+80-w*f.anchor*scale,y+145-h*scale,w*scale,h*scale);
}
const pixels=atlas.image.getContext('2d').getImageData(0,0,atlas.image.width,atlas.image.height).data;
let transparent=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparent++;
assert(transparent/(pixels.length/4)>.55);
fs.writeFileSync(new URL('../output/combo-v22-check.png',import.meta.url),preview.toBuffer('image/png'));
console.log('24 production sprite crops validated; transparent fraction:',transparent/(pixels.length/4));
