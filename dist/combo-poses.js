export const COMBO_ROWS={goku:0,raditz:1,nappa:2,vegeta:3};
// Six poses per fighter: body windup/contact, kick windup/contact, rise, hammer.
export function comboPose(actor,id){
  const row=COMBO_ROWS[id];if(row===undefined||actor.stun>0||actor.hp<=0)return null;
  let kind,preparing=false,recovering=false;
  if(actor.attack){
    const a=actor.attack;kind=a.kind==='normal'?a.move.effect:a.kind;
    preparing=a.t<a.move.active;recovering=a.t>a.move.end;
  }else if(['windup','attack'].includes(actor.state)){
    kind={strike:'pressure',double:'pressure',counter:'pressure',airStrike:'kick',finisher:'slam',launcher:'launch'}[actor.attackKind];
    preparing=actor.state==='windup';
  }
  if(recovering)return null;
  const column=kind==='pressure'?preparing?0:1:['spin','kick'].includes(kind)?preparing?2:3:kind==='launch'||kind==='rise'?preparing?0:4:kind==='slam'||kind==='fall'?preparing?null:5:null;
  return column===null?null:row*6+column;
}
