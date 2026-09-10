import test from 'node:test';
import assert from 'node:assert/strict';
import {comboPose,COMBO_ROWS} from '../dist/combo-poses.js';
import {SAIYAN_MOVES} from '../dist/saiyan-combat.js';
test('new combo poses follow player timing for all four identities',()=>{
  for(const [id,row] of Object.entries(COMBO_ROWS))for(const [kind,move,col] of [['pressure',SAIYAN_MOVES.pressure,1],['spin',SAIYAN_MOVES.spin,3],['launch',SAIYAN_MOVES.launch,4],['slam',SAIYAN_MOVES.hammer,5]]){
    const actor={hp:100,attack:{kind,move,t:move.active}};
    assert.equal(comboPose(actor,id),row*6+col);
    actor.attack.t=move.end+.01;assert.equal(comboPose(actor,id),null);
    actor.stun=.1;actor.attack.t=move.active;assert.equal(comboPose(actor,id),null);
  }
});
test('CPU launch, kick, pressure and hammer use the matching contact sprites',()=>{
  for(const [kind,col] of [['strike',1],['airStrike',3],['launcher',4],['finisher',5]])assert.equal(comboPose({hp:100,state:'attack',attackKind:kind},'vegeta'),18+col);
  assert.equal(comboPose({hp:100,state:'attack',attackKind:'launcher'},'freeza'),null);
});
