export class GameAudio {
  constructor(){this.enabled=true;this.ctx=null;this.nextNote=0;this.note=0;this.samples={};this.loading=false;this.voices=new Set();this.lastSample={};}
  unlock(){
    try{
      if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.36;this.master.connect(this.ctx.destination);const n=this.ctx.sampleRate*.3;this.noiseBuffer=this.ctx.createBuffer(1,n,this.ctx.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=Math.random()*2-1;}
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
      if(!this.loading){this.loading=true;this.ready=Promise.allSettled(Object.entries({punch:'heavy-punch.mp3',teleport:'teleport.wav',kame:'kame-short.wav'}).map(async([key,file])=>{const r=await fetch('/assets/audio/'+file);if(!r.ok)throw Error(file);this.samples[key]=await this.ctx.decodeAudioData(await r.arrayBuffer());}));}
    }catch{}
  }
  toggle(){this.enabled=!this.enabled;this.unlock();if(this.master)this.master.gain.setTargetAtTime(this.enabled?.36:0,this.ctx.currentTime,.04);return this.enabled;}
  tone(freq,duration=.1,type='sine',volume=.2,to=0,delay=0){
    if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(10,freq),t);if(to)o.frequency.exponentialRampToValueAtTime(Math.max(10,to),t+duration);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.008);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  noise(duration=.12,volume=.3,freq=1600){
    if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime,s=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();s.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+duration);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};
  }
  play(type,heavy=false){
    const key=['hit','playerHit','groundFinish','counterHit'].includes(type)?'punch':['vanish','enemyVanish'].includes(type)?'teleport':['beam','enemyBeam'].includes(type)?'kame':null;
    if(key&&this.sample(key,type==='hit'&&!heavy?1.35:1,type==='hit'&&!heavy?.45:.8,type==='hit'&&!heavy?.2:key==='kame'?1.2:.65))return;
    switch(type){
      case 'roundStart':this.play('ready');break;
      case 'counterHit':this.noise(.18,.6,2500);this.tone(250,.2,'triangle',.3,1100);break;
      case 'rockBreak':this.noise(.22,.4,800);break;
      case 'swing':this.noise(.075,.15,2200);this.tone(260,.07,'triangle',.08,90);break;
      case 'hit':this.noise(heavy?.17:.09,heavy?.75:.46,heavy?2700:1800);this.tone(heavy?110:170,heavy?.19:.11,'triangle',.7,40);this.tone(760,.045,'square',.12,120);break;
      case 'playerHit':this.noise(.14,.55,1200);this.tone(135,.22,'sawtooth',.17,42);break;
      case 'jump':this.tone(200,.14,'triangle',.13,480);break;
      case 'vanish':case 'enemyVanish':this.tone(1400,.09,'sine',.2,120);this.noise(.1,.28,6000);break;
      case 'aerialFinish':this.noise(.16,.55,2100);this.tone(220,.22,'triangle',.45,45);break;
      case 'dash':this.noise(.16,.23,4500);this.tone(380,.11,'sine',.07,70);break;
      case 'land':case 'step':this.noise(.05,.06,450);break;
      case 'blast':case 'enemyBlast':this.tone(880,.2,'sawtooth',.1,160);this.noise(.09,.13,3500);break;
      case 'orb':[523,659,784,1047].forEach((n,i)=>this.tone(n,.28,'sine',.18,0,i*.06));break;
      case 'specialCharge':this.tone(90,.4,'sawtooth',.15,950);break;
      case 'beam':this.noise(.29,.7,4500);this.tone(150,.5,'sawtooth',.3,48);this.tone(520,.35,'triangle',.2,180);break;
      case 'transform':this.noise(.3,.48,2700);this.tone(70,.8,'sawtooth',.25,400);[220,330,440,660].forEach((n,i)=>this.tone(n,.7,'triangle',.16,0,i*.07));break;
      case 'parry':this.tone(1450,.23,'triangle',.25,2400);this.noise(.07,.32,6500);break;
      case 'guard':this.tone(550,.07,'square',.12,150);this.noise(.06,.15,3000);break;
      case 'slam':case 'enrage':this.noise(.3,.85,850);this.tone(85,.32,'triangle',.8,25);break;
      case 'defeat':this.noise(.2,.18,1900);this.tone(220,.2,'triangle',.18,65);break;
      case 'ready':[660,880,1320].forEach((n,i)=>this.tone(n,.23,'sine',.15,0,i*.09));break;
      case 'perfect':this.tone(1047,.16,'sine',.12,1568);break;
      case 'enemyGuard':this.tone(650,.09,'square',.11,200);this.noise(.065,.16,3100);break;
      case 'guardBreak':this.noise(.2,.5,4200);this.tone(950,.2,'triangle',.16,120);break;
      case 'launcher':this.tone(160,.18,'triangle',.22,680);break;
      case 'groundFinish':case 'groundBounce':case 'wallImpact':this.noise(.23,.65,1100);this.tone(90,.25,'triangle',.65,30);break;
      case 'airRecover':this.tone(980,.13,'sine',.15,220);this.noise(.08,.18,5200);break;
      case 'enemyAirDash':case 'enemyComboCancel':this.tone(760,.08,'sawtooth',.1,180);this.noise(.07,.15,4300);break;
      case 'enemyBreaker':this.noise(.14,.45,4200);this.tone(310,.2,'sawtooth',.17,960);break;
      case 'playerGuardBreak':this.noise(.18,.48,3900);this.tone(680,.22,'square',.13,95);break;
      case 'guardRecovery':case 'hurtRecover':this.tone(720,.09,'triangle',.08,1100);break;
      case 'counterBurst':this.noise(.16,.5,3600);this.tone(220,.22,'triangle',.32,980);break;
      case 'solarBurst':this.noise(.3,.75,2300);this.tone(120,.6,'sawtooth',.22,35);[330,440,660].forEach(n=>this.tone(n,.5,'triangle',.1));break;
      case 'victory':[392,523,659,784,1047].forEach((n,i)=>this.tone(n,.65,'triangle',.18,0,i*.15));break;
      case 'gameover':[220,196,165,110].forEach((n,i)=>this.tone(n,.55,'triangle',.2,0,i*.17));break;
    }
  }
  sample(key,rate=1,volume=.7,duration=.8){
    if(!this.ctx||!this.enabled||!this.samples[key])return false;
    const now=this.ctx.currentTime;if(now-(this.lastSample[key]??-10)<.055)return true;this.lastSample[key]=now;
    if(this.voices.size>=8){const oldest=this.voices.values().next().value;oldest.stop();this.voices.delete(oldest);}
    const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=this.samples[key];s.playbackRate.value=rate;
    const length=Math.min(duration,s.buffer.duration/rate);g.gain.setValueAtTime(volume,now);g.gain.setValueAtTime(volume,now+Math.max(0,length-.04));g.gain.linearRampToValueAtTime(0,now+length);s.connect(g);g.connect(this.master);this.voices.add(s);s.start(now);s.stop(now+length);s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();};return true;
  }
  update(active){
    if(!active||!this.ctx||!this.enabled)return;const t=this.ctx.currentTime;
    if(t>this.nextNote){this.nextNote=t+.38;const notes=[220,0,330,440,0,392,330,0,196,0,294,392,0,330,294,0];const n=notes[this.note%notes.length];if(n)this.tone(n,.6,'sine',.025);if(this.note%8===0)this.tone(this.note%16===0?110:98,1.8,'triangle',.025);this.note++;}
  }
}
