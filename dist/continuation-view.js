const names={goku:'GOKU',piccolo:'PICCOLO',gohan:'GOHAN',kuririn:'KURIRIN'};
export function buildContinuationAtlas(image,create=()=>document.createElement('canvas')){const c=create();c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data,frames=[];for(let i=0;i<12;i++){const x0=Math.floor(i%4*c.width/4),x1=Math.floor((i%4+1)*c.width/4),y0=Math.floor(Math.floor(i/4)*c.height/3),y1=Math.floor((Math.floor(i/4)+1)*c.height/3);let l=x1,r=x0,t=y1,b=y0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*c.width+x)*4+3]>90){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}frames.push({rect:[l,t,Math.max(1,r-l+1),Math.max(1,b-t+1)]});}return {image,frames};}
function actor(c,a,i,x,y,h,dir=1){if(!a?.frames[i])return;const [sx,sy,w,sh]=a.frames[i].rect;c.save();c.translate(x,y);c.scale(dir,1);c.drawImage(a.image,sx,sy,w,sh,-w*h/sh/2,-h,w*h/sh,h);c.restore();}
// Small local cast is drawn in the same logical pixel grid at every viewport size.
function drawLocal(c,id,x,y,t=0,state='idle',dir=1,atlas){
 if(atlas){const frame=id==='kaio'?0:id==='bubbles'?(state==='run'?2:1):id==='gregory'?3:id==='kuririn'?(state==='special'?7:state==='attack'?6:state==='run'?5:4):id==='mez'?9:8;const height=id==='bubbles'?64:id==='gregory'?35:id==='kaio'?110:id==='kuririn'?94:115;const bob=state==='run'?Math.sin(t*12)*2:0;actor(c,atlas,frame,x,y+bob,height,dir);return;}
 c.save();c.translate(x,y);c.scale(dir*2,2);const moving=state==='run',swing=moving?Math.sin(t*12)*5:0;
 const kaio=id==='kaio',monkey=id==='bubbles',oni=id==='oni',kuririn=id==='kuririn',bug=id==='gregory';
 const skin=kaio?'#59b9d4':oni?'#d87573':monkey?'#965b38':bug?'#86d145':'#f3ba83';
 c.fillStyle='#182641';c.fillRect(-14,-31,28,27);c.fillRect(-14+swing,-7,10,8);c.fillRect(4-swing,-7,10,8);
 c.fillStyle=kaio?'#273556':monkey?'#7a462d':oni?'#eadabe':bug?'#629f35':'#ef8b2c';c.fillRect(-12,-29,24,23);
 c.fillStyle=skin;c.fillRect(-10,-45,20,18);c.fillRect(-17,state==='attack'?-35:-28,6,19);c.fillRect(11,state==='attack'?-35:-28,6,19);
 c.fillStyle='#26334b';c.fillRect(-6,-38,4,3);c.fillRect(3,-38,4,3);
 if(kaio){c.fillRect(-12,-40,24,5);c.fillRect(-9,-53,2,10);c.fillRect(7,-53,2,10);c.fillStyle='#edca69';c.fillRect(-2,-28,4,22);}
 if(kuririn){c.fillStyle='#996342';for(let i=0;i<6;i++)c.fillRect(-5+i%3*4,-44+Math.floor(i/3)*3,2,2);c.fillStyle='#2869aa';c.fillRect(-12,-12,24,4);}
 if(monkey){c.fillStyle=skin;c.fillRect(-16,-42,6,10);c.fillRect(10,-42,6,10);c.strokeStyle=skin;c.lineWidth=4;c.beginPath();c.arc(-19,-10,9,.4,4);c.stroke();}
 if(oni){c.fillStyle='#fff1b0';c.fillRect(-8,-51,4,8);c.fillRect(5,-51,4,8);}
 if(bug){c.strokeStyle='#d3ffac';c.lineWidth=2;c.beginPath();c.moveTo(-5,-45);c.lineTo(-10,-55);c.moveTo(5,-45);c.lineTo(10,-55);c.stroke();}
 c.restore();
}
export function mountContinuationUi(getEngine,clear){
 const panel=document.createElement('section');panel.id='continuation-objective';panel.hidden=true;panel.innerHTML='<small></small><strong></strong><span></span><progress max="1" value="0" aria-label="Progresso da missão"></progress>';
 document.getElementById('gameplay-notes').append(panel);
 const pause=document.createElement('button');pause.id='continuation-pause';pause.textContent='PAUSAR CENA';pause.hidden=true;
 document.getElementById('dialogue-panel').append(pause);pause.onclick=()=>{const q=getEngine().continuation;if(q){q.scenePaused=!q.scenePaused;pause.textContent=q.scenePaused?'CONTINUAR CENA':'PAUSAR CENA';clear();}};
}
export function updateContinuationHud(g){
 const q=g.continuation,panel=document.getElementById('continuation-objective');document.body.classList.toggle('continuation-mode',!!q);panel.hidden=!q||!!g.dialogue;document.getElementById('continuation-pause').hidden=!q||!g.dialogue;if(!q)return;
 const s=g.objective;panel.children[0].textContent=g.story.realm+' · '+(q.step+1)+' / '+g.story.steps.length;
 panel.children[1].textContent=s.title;panel.children[2].textContent=s.detail;
 const value=s.kind==='route'?g.p.x/s.goal:s.kind==='fight'?g.enemies.filter(e=>e.hp<=0).length/s.goal:s.kind==='damage'?q.damage/s.goal:s.kind==='survive'?Math.min(q.elapsed/s.goal,q.damage/60):q.score/s.goal;panel.children[3].value=Math.min(1,value);
 document.getElementById('hero-name').textContent=names[g.p.character];document.getElementById('special-name').textContent=g.p.character==='kuririn'?'KIENZAN':g.p.character==='piccolo'?'MAKANKO':g.stageId===1401&&q.step===4?'GENKI DAMA':'KAME';
 document.getElementById('form-label').textContent=g.stageId===1401?'TREINO DE KAIOH':'SAGA SAIYAJIN';
 document.getElementById('arrival-hud').hidden=true;document.getElementById('direction').hidden=true;
 document.getElementById('objective').textContent=s.title;document.getElementById('boss-hud').hidden=g.enemies.every(e=>e.hp<=0)||!!g.dialogue;document.getElementById('boss-name').textContent=g.enemies.find(e=>e.hp>0)?.name||g.story.name;
}
export function drawContinuation(c,g,w,h,a,reduced=false){
 const q=g.continuation,s=g.objective,t=g.visualTime,earth=g.stageId===1601,planet=g.stageId===1401;
 const local=(ctx,id,x,y,time=0,state='idle',dir=1)=>drawLocal(ctx,id,x,y,time,state,dir,a.otherworld);
 c.save();const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,earth?'#516d99':planet?'#243e79':'#9879bc');sky.addColorStop(1,earth?'#f1bb83':'#ffe0b8');c.fillStyle=sky;c.fillRect(0,0,w,h);
 for(let i=0;i<9;i++){const x=(i*183-g.p.x*.12)%(w+180);c.fillStyle=earth?'#6a748767':'#fff3e780';c.beginPath();c.ellipse(x,h*.55+(i%3)*25,130,38,0,0,Math.PI*2);c.fill();}
 const scale=Math.min(w/(w<600?500:900),h/550),view=w/scale,left=Math.max(0,Math.min(1800-view,q.ending&&earth?1110-view/2:g.p.x-view*.42));
 c.translate(0,h*.77-462*scale);c.scale(scale,scale);
 if(planet){c.fillStyle='#588c63';c.beginPath();c.ellipse(900-left,640,1050,185,0,0,Math.PI*2);c.fill();c.fillStyle='#e4dba8';c.fillRect(1480-left,355,150,105);c.fillStyle='#b2546e';c.beginPath();c.moveTo(1455-left,357);c.lineTo(1555-left,290);c.lineTo(1655-left,357);c.fill();local(c,'kaio',1530-left,462,t);}
 else if(earth){c.fillStyle='#b58c69';c.fillRect(-20,462,view+40,200);for(let i=0;i<12;i++){c.fillStyle=i%2?'#846c64':'#cfaa7c';c.beginPath();c.ellipse(i*170-left,475+i%3*24,55,10,0,0,Math.PI*2);c.fill();}}
 else{for(const [x,width] of s.kind==='route'?[[0,600],[720,510],[1350,450]]:[[0,1800]]){c.fillStyle='#547d76';c.fillRect(x-left,462,width,65);c.fillStyle='#e9c898';c.fillRect(x-left,462,width,14);for(let j=x;j<x+width;j+=35){c.strokeStyle='#87aba0';c.beginPath();c.arc(j-left,497,17,0,Math.PI);c.stroke();}}}
 const drawHero=(id,x,y,state='idle')=>{if(id==='kuririn'){local(c,id,x-left,y,t,state,g.p.dir);return;}const frame=state==='hurt'?4:state==='attack'?10:state==='run'?1:0;actor(c,a[id==='goku'&&g.p.form?'kaioken':id],id==='gohan'?Math.min(4,frame):frame,x-left,y,id==='gohan'?78:id==='piccolo'?116:105,g.p.dir);};
 if(q.ending&&earth){const z=q.sceneTime;actor(c,a.saiyanBosses,6,900-left,462,135,-1);drawHero('gohan',1320,462,'hurt');
  if(z<4){drawHero('piccolo',1180,462,'hurt');c.strokeStyle='#ffdf81';c.lineWidth=15;c.beginPath();c.moveTo(930-left,380);c.lineTo(1160-left,385);c.stroke();}
  else{c.save();c.translate(1180-left,462);c.rotate(-Math.PI/2);actor(c,a.piccolo,4,0,0,105);c.restore();}
  if(z>8){const y=462-Math.max(0,1-(z-8)/2)*270;actor(c,a.goku,0,1080-left,y,105);}
 }else{
  for(const e of g.enemies){if(e.hp<=0)continue;
   if(e.local==='nappa')actor(c,a.saiyanBosses,6+(e.state==='attack'?3:e.state==='hurt'?4:0),e.x-left,e.y,135,e.dir);
   else if(e.local==='saibaman')actor(c,a.sagaEnemies,24+(e.state==='attack'?3:0),e.x-left,e.y,85,e.dir);
   else local(c,e.name==='MEZ'?'mez':e.local==='training'?'oni':e.local==='guardiao'?'oni':e.local,e.x-left,e.y,t,e.state,e.dir);
   c.fillStyle='#26354b';c.fillRect(e.x-left-35,e.y-120,70,5);c.fillStyle='#f3a472';c.fillRect(e.x-left-35,e.y-120,70*Math.min(1,e.hp/e.maxHp),5);
   c.fillStyle='#fff0be';c.font='14px monospace';c.textAlign='center';c.fillText(e.name,e.x-left,e.y-132);
   if(e.state==='windup'||s.kind==='precision'&&q.elapsed%2.6>=1.7){c.strokeStyle='#ffde70';c.lineWidth=3;c.beginPath();c.arc(e.x-left,e.y-50,65,0,Math.PI*2);c.stroke();}
  }
  if(g.p.character==='gohan'&&a.otherworld)actor(c,a.otherworld,g.p.attack?11:10,g.p.x-left,g.p.y,82,g.p.dir);else drawHero(g.p.character,g.p.x,g.p.y,g.p.attack?'attack':g.p.state);
  if(!earth){c.strokeStyle='#ffe384';c.lineWidth=3;c.beginPath();c.ellipse(g.p.x-left,g.p.y-120,14,4,0,0,Math.PI*2);c.stroke();}
 }
 if(s.kind==='catch')local(c,'bubbles',(q.bubblesX||900)-left,462,t,'run');
 const target=s.kind==='gravity'?[520,1120,1600][q.score]||1600:s.kind==='protect'?1320:s.kind==='route'?1650:null;
 if(g.stageId===1301&&s.kind==='route'){for(const x of [565,1195]){c.fillStyle='#ffe7a1';c.font='bold 16px monospace';c.textAlign='center';c.fillText('↑ SUBIR',x-left,400);}}
 if(target!==null){c.strokeStyle=s.kind==='protect'?'#80ddff':'#ffe187';c.lineWidth=4;c.beginPath();c.ellipse(target-left,460,45,9,0,0,Math.PI*2);c.stroke();c.fillStyle=c.strokeStyle;c.font='24px monospace';c.fillText('▼',target-left,425);}
 for(const shot of g.shots){c.fillStyle=shot.owner==='enemy'?'#f5a574':'#a2eaff';c.beginPath();c.arc(shot.x-left,shot.y,shot.r||7,0,Math.PI*2);c.fill();}
 if(g.p.state==='special'){c.strokeStyle=g.p.character==='kuririn'?'#ffdc72':'#a9e9ff';c.lineWidth=7;c.beginPath();c.moveTo(g.p.x-left,g.p.y-50);c.lineTo(g.p.x-left+g.p.dir*400,g.p.y-50);c.stroke();}
 if(g.p.state==='genki'){c.fillStyle='#bceeff';c.beginPath();c.arc(g.p.x-left,g.p.y-145,38,0,Math.PI*2);c.fill();}
 c.restore();
 // Minimap uses actual world coordinates and remains inside the visible canvas.
 if(!g.dialogue){c.save();c.translate(0,h-54);const mw=Math.min(240,w-32),x=(w-mw)/2;c.fillStyle='#15273dcc';c.fillRect(x,14,mw,35);c.fillStyle='#ead2a6';c.fillRect(x+10,36,mw-20,2);for(const e of g.enemies)if(e.hp>0){c.fillStyle='#ff977b';c.fillRect(x+10+e.x/1800*(mw-20),31,4,8);}c.fillStyle='#8febff';c.fillRect(x+10+g.p.x/1800*(mw-20),26,5,13);c.restore();}
}
