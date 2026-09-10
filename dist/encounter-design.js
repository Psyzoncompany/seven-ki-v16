// Each chapter changes the order and composition while keeping every orb carrier.
export function storyEncounters(chapter) {
 const patterns=[['duel','group','pursuit'],['group','pursuit','duel'],['pursuit','duel','group'],['duel','pursuit','group'],['pursuit','group','duel'],['group','duel','pursuit'],['pursuit','duel','pursuit']];
 const order=patterns[[101,102,103,201,202,203,204].indexOf(chapter.id)];
 const bounds=[[510,1270,565],[2220,3080,2270],[3900,4530,3950]];
 const result=[];
 order.forEach((kind,i)=>{
  const [left,right,trigger]=bounds[i],ids=[i*3,i*3+1,i*3+2];
  if(kind==='duel'){
   const split=left+(right-left)*.46;
   result.push({left,right:split,trigger,ids:[ids[0]],kind,title:'DUELO · VANGUARDA'});
   result.push({left:split,right,trigger:split+12,ids:ids.slice(1),kind:'group',title:'DUPLA · REFORÇOS'});
  }else result.push({left,right,trigger,ids,kind,title:kind==='pursuit'?'PERSEGUIÇÃO AÉREA':'GRUPO · CERCO'});
 });
 result.push({left:5050,right:5890,trigger:5100,ids:[9],kind:'duel',title:chapter.bossName});
 return result;
}
