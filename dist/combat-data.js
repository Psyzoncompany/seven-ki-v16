export const FRAME_RATE=60;
const move=(startup,active,recovery,damage,reach,knock,frames,extra={})=>({
  startupFrames:startup,activeFrames:active,recoveryFrames:recovery,
  duration:(startup+active+recovery)/FRAME_RATE,active:startup/FRAME_RATE,end:(startup+active)/FRAME_RATE,
  damage,reach,knock,frames,hitstunFrames:extra.hitstunFrames??18,blockstunFrames:extra.blockstunFrames??10,
  staminaCost:extra.staminaCost??0,kiCost:extra.kiCost??0,cancelStartFrame:extra.cancelStartFrame??startup,
  cancelEndFrame:extra.cancelEndFrame??startup+active+3,cancelOptions:extra.cancelOptions??['light','dash','special'],
  priority:extra.priority??1,...extra
});

// Frame data is deliberately isolated so later characters and bosses can share the combat engine.
export const PLAYER_MOVES={
  light1:move(5,4,10,17,88,65,[6,7,8],{hitstunFrames:16}),
  light2:move(6,4,12,23,98,95,[9,10,11],{hitstunFrames:19}),
  heavy:move(10,5,15,35,114,295,[12,13,14],{hitstunFrames:27,blockstunFrames:16,priority:2,cancelOptions:['dash','special']}),
  formHeavy:move(8,5,13,42,128,180,[15,16,17],{hitstunFrames:25,priority:2}),
  launcher:move(8,5,16,25,94,55,[15,16,17],{hitstunFrames:32,blockstunFrames:14,priority:2,cancelOptions:['air','dash','special']}),
  air:move(5,4,11,21,99,45,[20,21,22],{hitstunFrames:20,cancelOptions:['air','dash','special']}),
  airFollow:move(6,4,12,23,106,65,[20,22,21],{hitstunFrames:21,cancelOptions:['air','dash','special']}),
  dive:move(5,5,18,32,105,160,[20,23,23],{hitstunFrames:30,priority:2,cancelOptions:['special']})
};
export const PLAYER_CHAIN=[PLAYER_MOVES.light1,PLAYER_MOVES.light2,PLAYER_MOVES.heavy,PLAYER_MOVES.formHeavy];

export const DIFFICULTY={
  easy:{reaction:1.28,damage:.8,guard:.72,error:1.45},
  normal:{reaction:1,damage:1,guard:1,error:1},
  hard:{reaction:.78,damage:1.12,guard:1.18,error:.65},
  boss:{reaction:.64,damage:1.2,guard:1.3,error:.42}
};

const base={aggression:.62,defense:.38,reactionTime:.22,comboSkill:.4,airCombatSkill:.26,kiUsage:.32,vanishChance:.12,counterChance:.12,dodgeChance:.16,preferredDistance:78,errorRate:.18,decisionCooldown:.22};
export const AI_PROFILES={
  brawler:{...base,aggression:.76,comboSkill:.52,preferredDistance:66},
  gunner:{...base,aggression:.42,defense:.48,kiUsage:.82,preferredDistance:245,dodgeChance:.28},
  elite:{...base,aggression:.76,defense:.7,reactionTime:.15,comboSkill:.72,airCombatSkill:.66,kiUsage:.58,vanishChance:.28,counterChance:.3,dodgeChance:.32,errorRate:.1},
  boss:{...base,aggression:.85,defense:.78,reactionTime:.12,comboSkill:.82,airCombatSkill:.74,kiUsage:.72,vanishChance:.32,counterChance:.34,dodgeChance:.3,errorRate:.06,decisionCooldown:.14},
  raditz:{...base,aggression:.72,defense:.72,reactionTime:.14,comboSkill:.7,airCombatSkill:.8,kiUsage:.78,vanishChance:.36,preferredDistance:180,errorRate:.07},
  nappa:{...base,aggression:.92,defense:.48,reactionTime:.2,comboSkill:.6,airCombatSkill:.35,kiUsage:.62,counterChance:.32,preferredDistance:72,errorRate:.08},
  vegeta:{...base,aggression:.9,defense:.88,reactionTime:.1,comboSkill:.92,airCombatSkill:.9,kiUsage:.9,vanishChance:.48,counterChance:.44,dodgeChance:.42,preferredDistance:105,errorRate:.035,decisionCooldown:.1}
};

export function profileFor(enemy){
  if(enemy.storyBoss&&AI_PROFILES[enemy.storyBoss])return AI_PROFILES[enemy.storyBoss];
  if(enemy.type===2)return AI_PROFILES.boss;
  if(enemy.type===1)return AI_PROFILES.gunner;
  return enemy.maxHp>=180?AI_PROFILES.elite:AI_PROFILES.brawler;
}
export const moveFrame=(attack)=>attack?Math.floor(attack.t*FRAME_RATE):0;
export const movePhase=(attack)=>{
  if(!attack)return 'neutral';const f=moveFrame(attack),m=attack.move;
  return f<m.startupFrames?'startup':f<m.startupFrames+m.activeFrames?'active':'recovery';
};
export const canCancel=(attack,kind)=>!!attack&&moveFrame(attack)>=attack.move.cancelStartFrame&&moveFrame(attack)<=attack.move.cancelEndFrame&&attack.move.cancelOptions.includes(kind);
export const rectsOverlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
