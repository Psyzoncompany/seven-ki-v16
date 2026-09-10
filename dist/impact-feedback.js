export const impactFeedback={
 guard:{frame:10,label:'BLOQUEADO',color:'#80bfff',size:70},
 enemyGuard:{frame:10,label:'BLOQUEADO',color:'#80bfff',size:70},
 parry:{frame:11,label:'APARO PERFEITO',color:'#aaffff',size:100},
 guardBreak:{frame:12,label:'GUARDA QUEBRADA',color:'#ffcb78',size:105},
 playerGuardBreak:{frame:12,label:'SUA GUARDA QUEBROU',color:'#ff947c',size:105},
 counterHit:{frame:13,label:'CONTRA-ATAQUE',color:'#ffa7eb',size:110},
 counterBurst:{frame:13,label:'REVERSÃO',color:'#ffa7eb',size:110}
};
export function gridAtlas(image,cols=4,rows=4){return {image,frames:Array.from({length:cols*rows},(_,i)=>({rect:[i%cols*image.width/cols,Math.floor(i/cols)*image.height/rows,image.width/cols,image.height/rows]}))};}
