export class ParticlePool{
  constructor(capacity=480){this.capacity=capacity;this.items=[];this.free=[];}
  clear(){this.free.push(...this.items);this.items.length=0;}
  spawn(values){const p=this.free.pop()||{};Object.assign(p,values);if(this.items.length>=this.capacity)this.free.push(this.items.shift());this.items.push(p);return p;}
  update(dt){for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.vx*=.98;p.life-=dt;if(p.life<=0){this.items.splice(i,1);this.free.push(p);}}}
}
