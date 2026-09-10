import fs from 'node:fs';
import vm from 'node:vm';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {findSpriteFrames} from '../dist/sprite-frames.js';
import {CampaignEngine} from '../dist/episode-engine.js';
import {cleanEpisodes,episodePose} from '../dist/episode-campaign.js';
import {drawEpisodeWorld} from '../dist/episode-view.js';
const source=fs.readFileSync('dist/game.js','utf8');
const build=vm.runInNewContext(source.slice(source.indexOf('function buildAtlas('),source.indexOf('function playerAtlas('))+';buildAtlas',{document:{createElement:()=>createCanvas(1,1)},findSpriteFrames,clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
const atlases={};
for(const [id,name,cols,rows,height] of [['piccolo','piccolo-v26',4,3,116],['gohan','gohan-child-v26',3,2,64],['goku','goku-v8',6,5,105],['arrivalProps','arrival-props-v23',3,2,100],['saiyanBosses','saiyan-bosses-v21',6,3,125]]){
 const image=await loadImage('dist/assets/'+name+'.png');
 const a=atlases[id]=build(image,cols,rows);a.scale=height/a.frames[0].rect[3];
 if(a.frames.length!==cols*rows)throw Error('Invalid atlas: '+id);
}
fs.mkdirSync('output/episode',{recursive:true});
const sheet=createCanvas(960,410),sc=sheet.getContext('2d');sc.fillStyle='#eaf4ff';sc.fillRect(0,0,960,410);sc.imageSmoothingEnabled=false;
for(const [id,top] of [['piccolo',0],['gohan',270]]){const a=atlases[id];a.frames.forEach((f,i)=>{const x=(i%6)*160+80,y=top+Math.floor(i/6)*130+123;sc.drawImage(a.image,...f.rect,x-f.rect[2]*a.scale*f.anchor,y-f.rect[3]*a.scale,f.rect[2]*a.scale,f.rect[3]*a.scale);});}
fs.writeFileSync('output/episode/sprites.png',sheet.toBuffer('image/png'));
const episodes=cleanEpisodes();episodes.missions[1103].checkpoint=2;const g=new CampaignEngine();g.start(1103,{legacy:{chapters:{101:{completed:true}}},episodes});
g.advanceDialogue(true);g.p.x=2850;g.p.guarding=true;
const canvas=createCanvas(960,540),c=canvas.getContext('2d');c.fillStyle='#daeff9';c.fillRect(0,0,960,540);c.fillStyle='#d7c391';c.fillRect(0,462,960,78);
const sprite=(image,rect,x,y,dir,scale,opts={})=>{c.save();c.translate(x,y);c.scale(dir*scale,scale);c.drawImage(image,...rect,-rect[2]*(opts.anchor??.5),-rect[3],rect[2],rect[3]);c.restore();};
drawEpisodeWorld(c,g,2420,atlases,sprite);const a=atlases.gohan,f=a.frames[episodePose(g.p)];sprite(a.image,f.rect,g.p.x-2420,g.p.y,1,a.scale,{anchor:f.anchor});
fs.writeFileSync('output/episode/captive.png',canvas.toBuffer('image/png'));
console.log('Runtime atlas loader: 12 Piccolo poses + 6 Gohan poses; captive segment rendered.');
