import { segmentsForMass, clamp, angleLerp, wormRadiusForMass } from './logic.js';

export function createWorm({x,y,angle=0,name='Worm',skin,player=false,mass=40,ai=0}) {
  const worm = {id:Math.random().toString(36).slice(2),x,y,angle,targetAngle:angle,name,skin,player,mass,ai,
    speed:player?150:108+Math.random()*24,baseSpeed:player?150:108+Math.random()*24,r:wormRadiusForMass(mass),alive:true,boosting:false,
    trail:[],trailDistance:0,score:Math.round(mass*2),coins:0,kills:0,food:0,created:performance.now(),respawnAt:0,
    powerups:{},shieldHits:0,think:0,personality:Math.random(),lastDrop:0,spawnProtectedUntil:0};
  for(let i=0;i<Math.max(30,segmentsForMass(mass)*6);i++) worm.trail.push({x:x-Math.cos(angle)*i*2.2,y:y-Math.sin(angle)*i*2.2});
  return worm;
}
export function updateWormTrail(worm, dt, targetAngle, world, boost=false) {
  const turn = clamp(dt*4.3,0,1);
  worm.angle = angleLerp(worm.angle,targetAngle,turn);
  const activeSpeed = worm.baseSpeed * (boost?1.75:1) * (worm.powerups.speed?1.45:1) * (worm.powerups.super?2.05:1);
  worm.speed = activeSpeed;
  const step = activeSpeed*dt;
  worm.x += Math.cos(worm.angle)*step;
  worm.y += Math.sin(worm.angle)*step;
  worm.x = clamp(worm.x, 24, world.width-24);
  worm.y = clamp(worm.y, 24, world.height-24);
  worm.trail.unshift({x:worm.x,y:worm.y});
  const desired = segmentsForMass(worm.mass);
  const keep = Math.max(40, desired*5+20);
  if(worm.trail.length>keep) worm.trail.length=keep;
}
export function bodyPoints(worm) {
  const count = segmentsForMass(worm.mass);
  const points=[];
  for(let i=count-1;i>=1;i--) {
    const p=worm.trail[Math.min(worm.trail.length-1,Math.round(i*5))];
    if(p) points.push(p);
  }
  return points;
}
function skinColor(skin, index, count, time) {
  if(skin.pattern==='rainbow') return `hsl(${(time*.05+index*13)%360} 88% 62%)`;
  if(skin.pattern==='galaxy') return index%4===0?'#fff1be':(index%2?skin.a:skin.b);
  if(skin.pattern==='glow') return index%3===0?'#fff4a3':(index%2?skin.a:skin.b);
  if(skin.pattern==='stripe') return index%3===0?skin.b:skin.a;
  if(skin.pattern==='spots') return index%4===0?skin.b:skin.a;
  return index%5===0?skin.b:skin.a;
}
export function drawWorm(ctx,worm,skin,time,zoom=1) {
  const count=segmentsForMass(worm.mass), spacing=5, radius=worm.r=wormRadiusForMass(worm.mass);
  const points=[];
  for(let i=count-1;i>=0;i--) points.push(worm.trail[Math.min(worm.trail.length-1,Math.round(i*spacing))]||{x:worm.x,y:worm.y});
  ctx.save();
  if(worm.player && Object.values(worm.powerups).some(Boolean)) {ctx.shadowBlur=18;ctx.shadowColor='#fff1a6';}
  for(let i=0;i<points.length;i++) {
    const p=points[i]; const pct=i/Math.max(1,points.length-1);
    const r=radius*(.74+.26*Math.sin(pct*Math.PI*.65));
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
    ctx.fillStyle=skinColor(skin,i,count,time);ctx.fill();
    ctx.lineWidth=2.2;ctx.strokeStyle='rgba(35,54,45,.28)';ctx.stroke();
    ctx.beginPath();ctx.arc(p.x-r*.28,p.y-r*.35,r*.32,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fill();
    if(skin.pattern==='spots'&&i%4===0){ctx.beginPath();ctx.arc(p.x+r*.2,p.y,r*.22,0,Math.PI*2);ctx.fillStyle='rgba(65,42,25,.45)';ctx.fill();}
  }
  // Head, cheeks, eyes and smile are drawn separately so the worm reads as a character.
  ctx.translate(worm.x,worm.y);ctx.rotate(worm.angle);
  ctx.beginPath();ctx.ellipse(1,0,radius*1.1,radius*.96,0,0,Math.PI*2);ctx.fillStyle=skin.a;ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle='rgba(30,55,45,.3)';ctx.stroke();
  for(const ey of [-1,1]) {
    ctx.beginPath();ctx.arc(5,ey*6,4.1,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    ctx.beginPath();ctx.arc(6.7,ey*6,1.9,0,Math.PI*2);ctx.fillStyle='#26313a';ctx.fill();
  }
  ctx.beginPath();ctx.arc(10,0,2.8,.15,Math.PI-.15);ctx.strokeStyle='#653d44';ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();
  if(worm.player || zoom>.8) {
    ctx.save();ctx.font=`bold ${worm.player?13:11}px system-ui`;ctx.textAlign='center';ctx.fillStyle='rgba(25,44,35,.8)';ctx.fillText(worm.name,worm.x+1,worm.y-radius-12+1);ctx.fillStyle='#fff';ctx.fillText(worm.name,worm.x,worm.y-radius-13);ctx.restore();
  }
}
