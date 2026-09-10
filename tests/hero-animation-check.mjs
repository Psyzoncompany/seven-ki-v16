import fs from 'node:fs';import vm from 'node:vm';import {createCanvas,loadImage} from '@napi-rs/canvas';import {findSpriteFrames} from '../dist/sprite-frames.js';
import {normalizeHeroAtlas} from '../dist/hero-animation.js';
const source=fs.readFileSync('dist/game.js','utf8'),fn=source.slice(source.indexOf('function buildAtlas('),source.indexOf('function playerAtlas('));
const build=vm.runInNewContext(fn+';buildAtlas',{document:{createElement:()=>createCanvas(1,1)},findSpriteFrames,clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
const sheet=createCanvas(1200,1000),c=sheet.getContext('2d');
for(const [j,name] of ['goku-v8','kaioken-v8'].entries()){const a=normalizeHeroAtlas(build(await loadImage('dist/assets/'+name+'.png'),6,5));for(let i=0;i<30;i++){const f=a.frames[i],[sx,sy,w,h]=f.rect,x=(i%6+j*6)*100,y=Math.floor(i/6)*200;c.fillStyle=i%2?'#14283e':'#213952';c.fillRect(x,y,100,200);c.drawImage(a.image,sx,sy,w,h,x+50-w*f.anchor*f.scale,y+180-h*f.scale,w*f.scale,h*f.scale);c.fillStyle='white';c.font='11px monospace';c.fillText(i+': '+Math.round(h*f.scale),x+3,y+15);}}
fs.writeFileSync('output/hero-animation-check.png',sheet.toBuffer('image/png'));
