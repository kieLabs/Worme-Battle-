import { clamp } from './logic.js';
export class Camera {
  constructor(){this.x=0;this.y=0;}
  follow(target,canvas,world,dt,zoom=1){
    const desiredX=target.x, desiredY=target.y;
    const smooth=1-Math.pow(.001,dt);
    this.x+=(desiredX-this.x)*smooth;this.y+=(desiredY-this.y)*smooth;
    // Canvas backing dimensions include devicePixelRatio; camera framing must use CSS pixels.
    const viewportWidth=canvas.clientWidth||canvas.width;
    const viewportHeight=canvas.clientHeight||canvas.height;
    const halfW=viewportWidth/(2*zoom),halfH=viewportHeight/(2*zoom);
    this.x=halfW*2>=world.width?world.width/2:clamp(this.x,halfW,world.width-halfW);
    this.y=halfH*2>=world.height?world.height/2:clamp(this.y,halfH,world.height-halfH);
  }
}
