const places={
  1101:['Costa Leste · Casa do Kame','arrival-coast-v23',50,'Raditz · uma presença desconhecida'],
  101:['Terra · Desfiladeiro da nave','valley',18,'Raditz'],
  102:['Terra · Campo de crateras','valley',50,'Nappa'],
  103:['Terra · Montanhas rochosas','valley',85,'Vegeta / Oozaru'],
  201:['Namekusei · Aldeia cercada','namek-stage-v13',15,'Dodoria'],
  202:['Namekusei · Ilhas do Norte','namek-stage-v13',40,'Zarbon'],
  203:['Namekusei · Campo das Forças Ginyu','namek-stage-v13',65,'Capitão Ginyu'],
  204:['Namekusei · Batalha final','namek-stage-v13',90,'Freeza']
};

export function renderSagaScene(root,level,atlases){
  const scene=root.getElementById('saga-scene'),place=level.id===1102?[level.location,'valley',38,'Piccolo · aliança com Goku']:level.id===1103?[level.location,'valley',75,'Goku · Piccolo · Gohan']:level.id===1201?['Terra · Local do confronto','valley',90,'Raditz · em breve']:places[level.id];
  scene.hidden=!place;if(!place)return;
  const [location,asset,position,opponent]=place;
  scene.style.backgroundImage=`linear-gradient(90deg,#e6f6ffdd,transparent 75%),url('/assets/${asset}.png')`;
  scene.style.backgroundPosition=`center,${position}% 35%`;
  root.getElementById('map-location').textContent=location;
  root.getElementById('map-opponent').textContent=opponent;
  const route=root.getElementById('map-itinerary');route.replaceChildren();
  for(const [i,zone] of level.zones.entries()){
    const stop=root.createElement('li');stop.textContent=zone;stop.dataset.stop=String(i+1);route.append(stop);
  }
  const canvas=root.getElementById('map-opponent-art'),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
  const atlas=level.id===1102?atlases.piccolo:level.id===1103?atlases.goku:level.saga==='freeza'?atlases.namekVillains:atlases.sagaEnemies;
  const row=level.mission?0:level.saga==='freeza'?level.bossRow:level.chapter-1;
  const f=atlas.frames[row*6], [x,y,w,h]=f.rect,scale=Math.min(240/w,260/h);
  c.drawImage(atlas.image,x,y,w,h,(280-w*scale)/2,280-h*scale,w*scale,h*scale);
  if(level.id===1103){for(const [id,dx,size] of [['piccolo',0,150],['gohan',180,90]]){const a=atlases[id],[sx,sy,sw,sh]=a.frames[0].rect,ratio=size/sh;c.drawImage(a.image,sx,sy,sw,sh,dx,280-size,sw*ratio,size);}}
  const preview=root.getElementById('map-preview');preview.style.backgroundPosition=`${position}% 35%`;
}
