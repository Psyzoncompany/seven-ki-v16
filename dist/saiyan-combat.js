// This move set belongs only to chapters 101–103. Other campaigns retain their frame data.
const move=(id,startup,active,recovery,damage,reach,knock,spriteFrames,extra={})=>({
  id,startupFrames:startup,activeFrames:active,recoveryFrames:recovery,
  active:startup/60,end:(startup+active)/60,duration:(startup+active+recovery)/60,
  damage,reach,knock,spriteFrames,frames:[6,7,8],hitstunFrames:18,
  cancelStartFrame:startup+2,cancelEndFrame:startup+active+6,
  cancelOptions:['light','air','dash','special'],...extra
});
export const SAIYAN_MOVES={
  pressure:move('pressure',6,4,12,14,100,18,[3,4,5],{effect:'cross',hitstunFrames:24}),
  jab:move('jab',5,4,9,12,91,32,[0,1,2],{effect:'jab'}),
  cross:move('cross',6,4,10,15,102,40,[3,4,5],{effect:'cross'}),
  kick:move('kick',7,5,11,18,112,54,[6,7,8,9,10,11],{effect:'kick'}),
  rush:move('rush',5,5,10,16,109,48,[3,4,5],{effect:'cross'}),
  spin:move('spin',9,5,23,30,130,540,[6,7,8,9,10,11],{effect:'spin',finisher:true,cancelOptions:['special']}),
  launch:move('launch',8,5,18,23,106,55,[12,13,14,15,16,17],{effect:'rise',hitstunFrames:32,kiCost:14}),
  hammer:move('hammer',8,5,17,34,119,185,[18,19,20,21,22,23],{effect:'fall',finisher:true,cancelOptions:['special']}),
  airJab:move('airJab',5,4,10,16,105,38,[0,1,2],{effect:'jab'}),
  airKick:move('airKick',6,5,11,20,118,60,[6,7,8,9,10,11],{effect:'kick'})
};
export const SAIYAN_CHAIN=[SAIYAN_MOVES.jab,SAIYAN_MOVES.cross,SAIYAN_MOVES.kick,SAIYAN_MOVES.rush,SAIYAN_MOVES.spin];
export const isSaiyanChapter=id=>id>=101&&id<=103;
export function saiyanMove(kind,step,aerial){
  if(kind==='pressure')return SAIYAN_MOVES.pressure;
  if(kind==='launch')return SAIYAN_MOVES.launch;
  if(kind==='slam')return SAIYAN_MOVES.hammer;
  if(kind==='spin')return SAIYAN_MOVES.spin;
  return aerial?(step%2?SAIYAN_MOVES.airKick:SAIYAN_MOVES.airJab):SAIYAN_CHAIN[step%SAIYAN_CHAIN.length];
}
export function comboSpriteFrame(attack){
  const m=attack.move,frames=m.spriteFrames;
  if(frames.length===3)return frames[attack.t<m.active?0:attack.t<=m.end?1:2];
  // Two preparation, two impact and two recovery poses follow actual move timing.
  const phase=attack.t<m.active?Math.min(1,Math.floor(attack.t/m.active*2)):
    attack.t<=m.end?2+Math.min(1,Math.floor((attack.t-m.active)/(m.end-m.active)*2)):
    4+Math.min(1,Math.floor((attack.t-m.end)/(m.duration-m.end)*2));
  return frames[phase];
}
const line=(speaker,text)=>({speaker,text});
export const SAIYAN_BOSS_SCENES={
  101:{boss:[line('RADITZ','Ainda acha que pode me enfrentar, Kakarotto?'),line('GOKU','Devolva meu filho. Eu não vou recuar.')],
    assist:[line('RADITZ','Como aquele garoto conseguiu tanto poder?'),line('GOKU','Você nunca deveria ter tocado nele.')],
    outro:[line('RADITZ','Outros dois Saiyajins virão... e são muito mais fortes que eu.'),line('GOKU','A Terra não vai se render.') ]},
  102:{boss:[line('NAPPA','Você chegou tarde. Agora é a sua vez!'),line('GOKU','Eu vou acabar com essa luta.')],
    assist:[line('NAPPA','Pare de fugir e enfrente minha força!'),line('GOKU','Força não é tudo, Nappa.')],
    outro:[line('NAPPA','Impossível... eu não consegui acompanhar seus golpes.'),line('GOKU','Chega. Você não vai machucar mais ninguém.')]},
  103:{boss:[line('VEGETA','Vou mostrar a diferença entre você e a elite Saiyajin.'),line('GOKU','Então vamos descobrir até onde meu treinamento me levou.')],
    ape:[line('VEGETA','Sem lua? Eu mesmo criarei uma!'),line('GOKU','Esse poder... ele está se transformando!')],
    assist:[line('VEGETA','Minha cauda! Vocês vão pagar por isso!'),line('GOKU','Sua transformação acabou, Vegeta.')],
    outro:[line('VEGETA','Não pense que isso terminou, Kakarotto.'),line('GOKU','Eu vou estar pronto quando você voltar.') ]}
};
