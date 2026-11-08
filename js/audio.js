export class AudioManager {
  constructor(){this.ctx=null;this.enabled=true;this.musicEnabled=true;this.master=.45;this.musicTimer=null;}
  unlock(){if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)this.ctx=new AC();}if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});if(this.musicEnabled)this.startMusic();}
  beep(freq=520,duration=.08,type='sine',volume=.08){if(!this.enabled)return;this.unlock();if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume*this.master,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration);}
  click(){this.beep(620,.045,'triangle',.055);}
  collect(){this.beep(760,.055,'sine',.055);}
  power(){this.beep(480,.08,'triangle',.08);setTimeout(()=>this.beep(880,.12,'sine',.07),70);}
  death(){this.beep(150,.32,'sawtooth',.08);}
  setEnabled(on){this.enabled=on;}
  setMusic(on){this.musicEnabled=on;if(on)this.startMusic();else this.stopMusic();}
  startMusic(){if(this.musicTimer||!this.musicEnabled||!this.ctx)return;const notes=[220,261.6,329.6,392];let i=0;this.musicTimer=setInterval(()=>{if(this.musicEnabled&&this.enabled)this.beep(notes[i++%notes.length],.12,'sine',.014);},720);}
  stopMusic(){if(this.musicTimer)clearInterval(this.musicTimer);this.musicTimer=null;}
}
