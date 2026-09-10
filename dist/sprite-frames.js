// Crop metadata, not a uniform grid: extended hands and boots may cross a cell seam.
export function findSpriteFrames(data,width,height,cols=6,rows=4,includePixels=false){
  const seen=new Uint8Array(width*height),queue=new Int32Array(width*height),parts=[];
  for(let seed=0;seed<seen.length;seed++){
    if(seen[seed]||data[seed*4+3]<=40)continue;
    let head=0,tail=1,left=width,right=0,top=height,bottom=0;
    queue[0]=seed;seen[seed]=1;
    while(head<tail){
      const at=queue[head++],x=at%width,y=Math.floor(at/width);
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;
        const next=yy*width+xx;
        if(!seen[next]&&data[next*4+3]>40){seen[next]=1;queue[tail++]=next;}
      }
    }
    if(tail>2000)parts.push({left,right,top,bottom,count:tail,...(includePixels?{pixels:queue.slice(0,tail)}:{})});
  }
  if(parts.length!==cols*rows)throw new Error(`Expected ${cols*rows} complete sprites, received ${parts.length}`);
  parts.sort((a,b)=>(a.top+a.bottom)-(b.top+b.bottom));
  const ordered=[];
  for(let row=0;row<rows;row++)ordered.push(...parts.slice(row*cols,(row+1)*cols).sort((a,b)=>a.left-b.left));
  return ordered.map(p=>{
    const {left:l,right:r,top:t,bottom:b}=p;
    let sum=0,n=0;
    for(let y=Math.round(t+(b-t)*.72);y<=b;y++)for(let x=l;x<=r;x++)if(data[(y*width+x)*4+3]>80){sum+=x;n++;}
    return {rect:[l,t,r-l+1,b-t+1],anchor:n?(sum/n-l)/(r-l+1):.5,...(includePixels?{pixels:p.pixels}:{})};
  });
}
