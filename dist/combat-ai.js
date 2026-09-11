import {AI_PROFILES,DIFFICULTY,profileFor,movePhase} from './combat-data.js?v=14';

export class CombatDirector{
  constructor(difficulty='normal'){this.difficulty=difficulty;this.reset();}
  reset(){this.history=[];this.lastPlayerState='idle';this.sampleClock=0;this.airborneTime=0;this.hoverTime=0;this.lastAttackRef=null;this.lastAttackSignature='';this.sameAttackCount=0;}
  observe(engine,dt){
    const p=engine.p,airborne=!p.grounded&&p.y<427;
    this.airborneTime=airborne?Math.min(5,this.airborneTime+dt):Math.max(0,this.airborneTime-dt*3);
    this.hoverTime=airborne&&Math.abs(p.vy)<155?Math.min(5,this.hoverTime+dt):Math.max(0,this.hoverTime-dt*2);
    if(p.attack&&p.attack!==this.lastAttackRef){const signature=p.grounded?`${p.attack.kind}:${p.attack.step}`:`air:${p.attack.kind}`;this.sameAttackCount=signature===this.lastAttackSignature?this.sameAttackCount+1:1;this.lastAttackSignature=signature;this.lastAttackRef=p.attack;}else if(!p.attack){this.lastAttackRef=null;if(engine.time-(p.lastAttack||0)>1.25){this.sameAttackCount=0;this.lastAttackSignature='';}}
    this.sampleClock-=dt;if(this.sampleClock>0)return;this.sampleClock=.08;
    const action=p.guarding?'guard':p.attack?'attack':p.state==='blast'||p.state==='special'?'ki':p.state==='dash'?'dash':airborne?'air':Math.abs(p.vx)>180?'rush':Math.abs(p.vx)<22?'idle':'move';
    if(action!==this.lastPlayerState||['attack','ki','air'].includes(action)){this.history.push(action);if(this.history.length>18)this.history.shift();this.lastPlayerState=action;}
  }
  tendency(action){return this.history.length?this.history.filter(v=>v===action).length/this.history.length:0;}
  get airSpam(){return this.airborneTime>.65&&(this.hoverTime>.38||this.sameAttackCount>=2||this.tendency('air')>.42);}
  ensure(e){
    if(e.combat)return e.combat;const profile=profileFor(e);
    return e.combat={profile,decision:0,intent:'idle',ki:55,stamina:100,guardMeter:100,comboQueue:[],comboHits:0,airDash:0,flight:false,flightGrace:0,cancelCooldown:0,punishCooldown:0,breakerCooldown:0,pressureHits:0,pressureTime:0,wallBounces:0,groundBounces:0,lastDistance:999,frustration:0};
  }
  tick(e,dt){const c=this.ensure(e);c.decision-=dt;c.feintCooldown=Math.max(0,(c.feintCooldown||0)-dt);c.cancelCooldown=Math.max(0,c.cancelCooldown-dt);c.punishCooldown=Math.max(0,c.punishCooldown-dt);c.breakerCooldown=Math.max(0,c.breakerCooldown-dt);c.pressureTime=Math.max(0,c.pressureTime-dt);if(c.pressureTime<=0)c.pressureHits=0;c.flightGrace=Math.max(0,c.flightGrace-dt);c.stamina=Math.min(100,c.stamina+dt*(e.state==='idle'?24:13));c.ki=Math.min(100,c.ki+dt*(e.state==='charge'?38:7));c.guardMeter=Math.min(100,c.guardMeter+dt*(e.state==='guard'?0:14));c.airDash=Math.max(0,c.airDash-dt);return c;}
  reactiveCancel(engine,e){
    const c=this.ensure(e),p=c.profile||AI_PROFILES.brawler,player=engine.p;
    if(engine.saiyanCombat&&e.storyBoss==='nappa')return null;
    if(e.invincible>0||e.stun>0||c.cancelCooldown>0||c.stamina<24||!player.attack||!['windup','attack','recover','flight'].includes(e.state))return null;
    const dist=Math.abs(player.x-e.x),vertical=Math.abs(player.y-e.y),phase=movePhase(player.attack);
    if(dist>player.attack.move.reach+68||vertical>125||phase==='recovery')return null;
    const learned=this.sameAttackCount>=2||this.tendency('attack')>.38,chance=learned?Math.min(.96,p.defense+.45):Math.min(.82,p.defense+.08);
    // One reaction roll per swing: retrying every frame made even low odds certain.
    if(c.reactedAttack===player.attack)return null;
    c.reactedAttack=player.attack;
    if(engine.random()>chance)return null;c.cancelCooldown=.9;c.stamina-=24;c.comboQueue=[];
    if(c.ki>=18&&(p.vanishChance>.2||this.airSpam)){c.ki-=18;return 'vanish';}
    return learned&&p.counterChance>.2?'counterGuard':'guard';
  }
  decide(engine,e,dt){
    const c=this.tick(e,dt),p=c.profile||AI_PROFILES.brawler,diff=DIFFICULTY[e.type===2?'boss':this.difficulty]||DIFFICULTY.normal;
    const player=engine.p,dist=Math.abs(player.x-e.x),vertical=Math.abs(player.y-e.y),projectile=engine.shots.some(s=>s.owner==='player'&&Math.abs(s.x-e.x)<250&&(e.x-s.x)*s.vx>0);
    const threatened=!!(player.attack&&dist<player.attack.move.reach+85&&vertical<135||projectile),spamAttack=this.sameAttackCount>=2||this.tendency('attack')>.4,spamKi=this.tendency('ki')>.28;
    if(this.airSpam&&!(engine.saiyanCombat&&e.storyBoss==='nappa')&&c.punishCooldown<=0){c.punishCooldown=.38;c.decision=.08;if(vertical>70||dist>125){c.intent='airChase';return c.intent;}if(c.ki>=18&&spamAttack){c.intent='vanish';return c.intent;}c.intent='airCombo';return c.intent;}
    if(c.decision>0)return null;c.decision=Math.max(.07,p.decisionCooldown*diff.reaction+engine.random()*.07);
    if(player.charging&&player.chargeTime>.4){c.intent=vertical>110?'airChase':dist<155?'combo':e.type===1&&c.ki>=18?'projectile':'approach';return c.intent;}
    if(engine.versus&&e.versusFighter?.profile==='gunner'&&dist>165&&c.ki>=18){c.intent='projectile';return c.intent;}
    if(engine.saiyanCombat&&e.storyBoss==='nappa'){c.intent=vertical>125?(dist<240?'airChase':'approach'):dist>140?'approach':'combo';return c.intent;}
    if(engine.saiyanCombat&&e.storyBoss==='raditz'&&dist<120&&c.stamina>=24&&e.defenseCooldown<=0){const arena=engine.encounters.find(a=>a.ids.includes(e.id)),room=arena?(e.x>player.x?arena.right-e.x:e.x-arena.left):100;c.intent=room<65&&c.ki>=18?'vanish':'evade';return c.intent;}
    if(engine.saiyanCombat&&e.storyBoss==='vegeta'&&['idle','run','chase'].includes(e.state)&&player.attack&&movePhase(player.attack)==='recovery'&&dist<155&&vertical<115&&c.punishCooldown<=0&&c.stamina>=18){c.intent='counter';return c.intent;}
    if(engine.saiyanCombat&&e.storyBoss==='vegeta'&&dist<160&&vertical<115&&c.feintCooldown<=0&&!threatened){c.intent='feint';return c.intent;}
    if(threatened&&c.stamina>=24){if(c.ki>=18&&(spamKi||this.airSpam)&&engine.random()<p.vanishChance+.25){c.intent='vanish';return c.intent;}if((spamAttack||engine.random()<p.counterChance)&&c.guardMeter>20){c.intent='guard';return c.intent;}if(engine.random()<p.dodgeChance+p.defense*.2){c.intent='evade';return c.intent;}}
    if(!player.grounded&&(vertical>35||dist>145)){c.intent='airChase';return c.intent;}
    if(!player.grounded&&dist<165&&vertical<115){c.intent='airCombo';return c.intent;}
    const activeAllies=engine.enemies.filter(o=>o!==e&&o.hp>0&&['windup','attack'].includes(o.state)&&Math.abs(o.x-player.x)<260).length;
    if(activeAllies>=2){c.intent=c.ki>24?'projectile':'space';return c.intent;}
    if(dist>p.preferredDistance+70){c.intent=c.ki>28&&engine.random()<p.kiUsage*(spamKi?.55:1)?'projectile':'approach';return c.intent;}
    if(dist<p.preferredDistance-25&&e.type===1){c.intent='retreat';return c.intent;}
    if(c.ki<16&&dist>190){c.intent='charge';return c.intent;}
    if(dist<165&&vertical<115){c.intent=engine.random()<p.comboSkill?'combo':'attack';return c.intent;}
    c.intent=dist>p.preferredDistance?'approach':'space';return c.intent;
  }
}
