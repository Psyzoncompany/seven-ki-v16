const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class DuelCamera{
 constructor(){this.reset();}
 reset(){this.ready=false;this.left=0;this.top=0;this.zoom=1;}
 update(dt,actors,{width,height,top=75,bottom=35,reduced=false,boost=0}={}){
  const bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
  for(const a of actors){const h=a.height||125,r=a.radius||Math.max(80,h*.85);bounds.left=Math.min(bounds.left,a.x-r);bounds.right=Math.max(bounds.right,a.x+r);bounds.top=Math.min(bounds.top,a.y-h-24);bounds.bottom=Math.max(bounds.bottom,a.y+18);}
  const fit=Math.min((width-40)/(bounds.right-bounds.left),(height-top-bottom)/(bounds.bottom-bounds.top));
  const distance=actors.length>1?Math.hypot(actors[0].x-actors[1].x,actors[0].y-actors[1].y):0;
  const desired=Math.min(fit,(reduced?1:distance<230?1.2:distance>450?.88:1.05)+boost);
  const mix=1-Math.exp(-dt*5);
  this.zoom=this.ready?Math.min(fit,this.zoom+(desired-this.zoom)*mix):desired;
  const targetX=(bounds.left+bounds.right)/2-width/(2*this.zoom),targetY=(bounds.top+bounds.bottom)/2-(top+(height-top-bottom)/2)/this.zoom;
  this.left=this.ready?this.left+(targetX-this.left)*mix:targetX;this.top=this.ready?this.top+(targetY-this.top)*mix:targetY;
  // Smooth pursuit, but visibility wins over easing after a teleport or sudden launch.
  this.left=clamp(this.left,bounds.right-(width-20)/this.zoom,bounds.left-20/this.zoom);
  this.top=clamp(this.top,bounds.bottom-(height-bottom)/this.zoom,bounds.top-top/this.zoom);
  this.ready=true;return {left:this.left,top:this.top,zoom:this.zoom,bounds};
 }
}
