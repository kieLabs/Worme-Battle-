import { getTouchControlSide } from './logic.js';

export class Controls {
  constructor({canvas,game,touchStick}){
    this.canvas=canvas;
    this.game=game;
    this.touchStick=touchStick;
    this.steerPointer=null;
    this.steerOrigin=null;
    this.boostPointers=new Set();
    this.keys=new Set();
    this.currentAngle=0;
    this.knob=touchStick?.querySelector('.touch-stick-knob');
    this.bind();
  }

  bind(){
    const aimWithMouse=e=>{
      const rect=this.canvas.getBoundingClientRect();
      const cx=rect.left+rect.width/2;
      const cy=rect.top+rect.height/2;
      this.currentAngle=Math.atan2(e.clientY-cy,e.clientX-cx);
      this.game.setSteering(this.currentAngle);
    };

    this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
    this.canvas.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'){
        if(this.game.state!=='playing')return;
        e.preventDefault();
        try{this.canvas.setPointerCapture(e.pointerId);}catch{}
        const rect=this.canvas.getBoundingClientRect();
        const touchSide=getTouchControlSide(e.clientX,rect.left,rect.width);
        if(touchSide==='steer'){
          if(this.steerPointer!==null)return;
          this.steerPointer=e.pointerId;
          this.steerOrigin={x:e.clientX,y:e.clientY};
          this.showTouchStick(e.clientX,e.clientY);
        }else{
          this.boostPointers.add(e.pointerId);
          this.game.setBoost(true);
        }
        return;
      }
      if(e.pointerType==='mouse'){
        if(e.button===2)this.game.setBoost(true);
        else if(e.button===0)aimWithMouse(e);
      }
    });

    this.canvas.addEventListener('pointermove',e=>{
      if(e.pointerType==='mouse')aimWithMouse(e);
      if(e.pointerType==='touch'&&this.steerPointer===e.pointerId)this.moveTouchStick(e);
    });

    const release=e=>{
      if(this.steerPointer===e.pointerId){
        this.steerPointer=null;
        this.steerOrigin=null;
        this.hideTouchStick();
      }
      if(this.boostPointers.delete(e.pointerId))this.game.setBoost(this.boostPointers.size>0);
      if(e.pointerType==='mouse'&&e.button===2)this.game.setBoost(false);
    };
    window.addEventListener('pointerup',release);
    window.addEventListener('pointercancel',release);


    window.addEventListener('keydown',e=>{
      const key=e.key.toLowerCase();
      if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(key))e.preventDefault();
      this.keys.add(key);
      if(key===' ')this.game.setBoost(true);
      this.updateKeyboardAngle();
    });
    window.addEventListener('keyup',e=>{
      const key=e.key.toLowerCase();
      this.keys.delete(key);
      if(key===' ')this.game.setBoost(false);
      this.updateKeyboardAngle();
    });
    window.addEventListener('blur',()=>{
      this.boostPointers.clear();
      this.game.setBoost(false);
      this.steerPointer=null;
      this.steerOrigin=null;
      this.hideTouchStick();
      this.keys.clear();
    });
  }

  showTouchStick(clientX,clientY){
    if(!this.touchStick)return;
    const rect=this.canvas.getBoundingClientRect();
    this.touchStick.style.left=`${clientX-rect.left}px`;
    this.touchStick.style.top=`${clientY-rect.top}px`;
    this.touchStick.classList.remove('hidden');
    if(this.knob)this.knob.style.transform='translate(0,0)';
  }

  moveTouchStick(e){
    if(!this.steerOrigin)return;
    let dx=e.clientX-this.steerOrigin.x;
    let dy=e.clientY-this.steerOrigin.y;
    const max=43;
    const magnitude=Math.hypot(dx,dy);
    if(magnitude>max){dx=dx/magnitude*max;dy=dy/magnitude*max;}
    if(this.knob)this.knob.style.transform=`translate(${dx}px,${dy}px)`;
    if(magnitude>7){
      this.currentAngle=Math.atan2(dy,dx);
      this.game.setSteering(this.currentAngle);
    }
  }

  hideTouchStick(){
    this.touchStick?.classList.add('hidden');
    if(this.knob)this.knob.style.transform='translate(0,0)';
  }

  updateKeyboardAngle(){
    let x=0,y=0;
    if(this.keys.has('arrowleft')||this.keys.has('a'))x--;
    if(this.keys.has('arrowright')||this.keys.has('d'))x++;
    if(this.keys.has('arrowup')||this.keys.has('w'))y--;
    if(this.keys.has('arrowdown')||this.keys.has('s'))y++;
    if(x||y){
      this.currentAngle=Math.atan2(y,x);
      this.game.setSteering(this.currentAngle);
    }
  }
}
