// Runs the exact production atlas loader without starting a browser or changing source PNGs.
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {findSpriteFrames} from '../dist/sprite-frames.js';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function buildAtlas('),source.indexOf('function playerAtlas('));
const build=vm.runInNewContext(fn+';buildAtlas',{document:{createElement:()=>createCanvas(1,1)},findSpriteFrames,clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
const img=await loadImage(fileURLToPath(new URL('../dist/assets/goku-combos-v16.png',import.meta.url)));
const atlas=build(img,6,4),pixels=atlas.image.getContext('2d').getImageData(0,0,img.width,img.height).data;
assert.equal(atlas.frames.length,24);
console.log(JSON.stringify(atlas.frames));
let transparent=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparent++;
console.log('Transparent background fraction after texture decoding:',transparent/(img.width*img.height));
assert(transparent/(img.width*img.height)>.6);
const sheet=createCanvas(960,640),ctx=sheet.getContext('2d');ctx.imageSmoothingEnabled=false;
for(let i=0;i<24;i++){
 const f=atlas.frames[i],x=i%6*160,y=Math.floor(i/6)*160;
 const [sx,sy,w,h]=f.rect;
 assert(sx>=0&&sy>=0&&sx+w<=img.width&&sy+h<=img.height);
 assert(w>70&&h>90&&w<280&&h<285,`invalid frame ${i}: ${f.rect}`);
 ctx.fillStyle=i%2?'#132943':'#183551';ctx.fillRect(x,y,160,160);
 ctx.fillStyle='#7998ad';ctx.fillRect(x,y+143,160,1);
 ctx.drawImage(atlas.image,sx,sy,w,h,x+80-w*f.anchor*atlas.scale,y+143-h*atlas.scale,w*atlas.scale,h*atlas.scale);
 ctx.fillStyle='#fff';ctx.font='12px monospace';ctx.fillText(String(i),x+5,y+14);
}
const output=new URL('../output/',import.meta.url);fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(new URL('saiyan-sprite-check.png',output),sheet.toBuffer('image/png'));
