import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {findSpriteFrames} from '../dist/sprite-frames.js';
import {GameEngine} from '../dist/engine.js';
import {ARRIVAL_ID} from '../dist/arrival-mission.js';
import {drawArrivalBackground,drawArrivalTerrain,drawArrivalWorld,drawArrivalMinimap} from '../dist/arrival-view.js';
const root=new URL('../',import.meta.url),source=fs.readFileSync(new URL('dist/game.js',root),'utf8');
const build=vm.runInNewContext(source.slice(source.indexOf('function buildAtlas('),source.indexOf('function playerAtlas('))+';buildAtlas',{document:{createElement:()=>createCanvas(1,1)},findSpriteFrames,clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
const images={};
for(const name of ['arrival-coast-v23','arrival-props-v23','goku-v8','saiyan-bosses-v21','combat-world-v21','coastal-creatures-v23','arrival-rocks-v24'])images[name]=await loadImage(fileURLToPath(new URL('dist/assets/'+name+'.png',root)));
const atlas={arrivalProps:build(images['arrival-props-v23'],3,2),goku:build(images['goku-v8'],6,5),saiyanBosses:build(images['saiyan-bosses-v21'],6,3)};
atlas.arrivalRocks=build(images['arrival-rocks-v24'],2,2);assert.equal(atlas.arrivalRocks.frames.length,4);
for(const f of atlas.arrivalRocks.frames)assert(f.rect[2]>300&&f.rect[3]>300);
atlas.creatures=build(images['coastal-creatures-v23'],6,2);assert.equal(atlas.creatures.frames.length,12);
assert.equal(atlas.arrivalProps.frames.length,6);
for(const f of atlas.arrivalProps.frames){assert(f.rect[2]>150&&f.rect[3]>200);assert(f.rect[2]<500&&f.rect[3]<500);}
const output=new URL('output/arrival/',root);fs.mkdirSync(output,{recursive:true});
for(const [name,step,x,y,scene,width] of [['coast',0,180,462,false,960],['lookout',0,880,270,false,960],['rubble',1,1660,462,false,960],['capsule',2,2960,462,false,960],['ending',3,280,462,true,960],['mobile',1,1740,462,false,390]]){
 const g=new GameEngine();g.start(ARRIVAL_ID,{arrivalCheckpoint:{checkpoint:step}});if(g.dialogue)g.advanceDialogue(true);Object.assign(g.p,{x,y});if(scene){g.mode='won';g.openScene('abduction');g.dialogue.index=2;g.arrival.sceneTime=10;}
 const c=createCanvas(width,540),ctx=c.getContext('2d'),cam=Math.max(0,Math.min(3460-width,x-width*.35));
 const sprite=(image,rect,dx,dy,dir,scale,opts={})=>{ctx.save();ctx.translate(dx,dy);ctx.scale(dir*scale,scale);ctx.drawImage(image,...rect,-rect[2]*(opts.anchor??.5),-rect[3],rect[2],rect[3]);ctx.restore();};
 const rock=(frame,dx,dy,w,h)=>{const a=images['combat-world-v21'];ctx.drawImage(a,(frame%4)*a.width/4,Math.floor(frame/4)*a.height/4,a.width/4,a.height/4,dx-w/2,dy-h/2,w,h);};
 drawArrivalBackground(ctx,g,images['arrival-coast-v23'],width,540);drawArrivalTerrain(ctx,g,images['arrival-coast-v23'],cam,width,540,rock);drawArrivalWorld(ctx,g,cam,atlas,sprite,false);
 for(const e of g.enemies){if(e.hp<=0)continue;const f=atlas.creatures.frames[e.creatureRow*6];sprite(atlas.creatures.image,f.rect,e.x-cam,e.y,e.dir,82/f.rect[3],{anchor:f.anchor});}
 const f=atlas.goku.frames[0];sprite(atlas.goku.image,f.rect,x-cam,y,1,105/f.rect[3],{anchor:f.anchor});
 fs.writeFileSync(new URL(name+'.png',output),c.toBuffer('image/png'));
 const map=createCanvas(200,80);drawArrivalMinimap(map.getContext('2d'),g);fs.writeFileSync(new URL(name+'-minimap.png',output),map.toBuffer('image/png'));
}
console.log('Six mission scenes and minimaps rendered; six prop crops validated.');
