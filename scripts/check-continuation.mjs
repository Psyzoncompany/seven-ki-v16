import fs from 'node:fs';
import vm from 'node:vm';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {findSpriteFrames} from '../dist/sprite-frames.js';
import {ContinuationEngine} from '../dist/continuation-engine.js';
import {cleanContinuation} from '../dist/continuation-data.js';
import {buildContinuationAtlas,drawContinuation} from '../dist/continuation-view.js';
const source=fs.readFileSync('dist/game.js','utf8');
const build=vm.runInNewContext(source.slice(source.indexOf('function buildAtlas('),source.indexOf('function playerAtlas('))+';buildAtlas',{document:{createElement:()=>createCanvas(1,1)},findSpriteFrames,clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
const a={};
for(const [id,name,cols,rows] of [['goku','goku-v8',6,5],['kaioken','kaioken-v8',6,5],['piccolo','piccolo-fight-v31',5,3],['gohan','gohan-child-v26',3,2],['saiyanBosses','saiyan-bosses-v21',6,3],['sagaEnemies','saga-enemies-v8',6,5]])a[id]=build(await loadImage('dist/assets/'+name+'.png'),cols,rows);
fs.mkdirSync('output/continuation',{recursive:true});
a.otherworld=buildContinuationAtlas(await loadImage('dist/assets/otherworld-cast-v29.png'),()=>createCanvas(1,1));
for(const [id,step] of [[1301,0],[1401,1],[1601,3],[1601,5]])for(const [w,h] of [[960,540],[390,600]]){
 const progress=cleanContinuation();for(const r of Object.values(progress.missions))r.completed=true;progress.missions[id]={checkpoint:step,completed:false};
 const g=new ContinuationEngine();g.start(id,{raditz:{completed:true},continuation:progress});g.advanceDialogue(true);g.p.x=1000;g.continuation.bubblesX=1100;
 const c=createCanvas(w,h);drawContinuation(c.getContext('2d'),g,w,h,a,true);fs.writeFileSync(`output/continuation/${id}-${step}-${w}.png`,c.toBuffer('image/png'));
}
console.log('Eight desktop/mobile frames rendered with the runtime atlas loader.');
