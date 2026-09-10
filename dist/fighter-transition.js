const motion=new WeakMap();
export function fighterTransition(actor,dt){
 let m=motion.get(actor);if(!m){m={lean:0,lift:0};motion.set(actor,m);}
 const hurt=actor.stun>0||actor.hp<=0,target=hurt?-.055*actor.dir:actor.state==='windup'?-.035*actor.dir:Math.max(-.07,Math.min(.07,actor.vx*.00014));
 const lift=actor.grounded?0:Math.sin((actor.anim||actor.moveCycle||0)*4)*1.8;
 const blend=1-Math.exp(-Math.max(0,dt)*14);m.lean+=(target-m.lean)*blend;m.lift+=(lift-m.lift)*blend;return m;
}
