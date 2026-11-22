import { segmentsForMass, segmentsForScore, clamp, angleLerp, wormRadiusForMass, wormRadiusForScore } from './logic.js';

const BOOST_SPEED_RATIO = 6.2 / 3.2;

export function createWorm({x,y,angle=0,name='Worm',skin,player=false,mass=40,ai=0}) {
  const score = player ? 0 : Math.round(mass * 2);
  const worm = {id:Math.random().toString(36).slice(2),x,y,angle,targetAngle:angle,name,skin,player,mass,ai,score,
    speed:player?192:168+Math.random()*24,baseSpeed:player?192:168+Math.random()*24,
    r:Math.max(wormRadiusForMass(mass,0),wormRadiusForScore(score)),alive:true,boosting:false,
    trail:[],trailDistance:0,coins:0,kills:0,food:0,created:performance.now(),respawnAt:0,
    powerups:{},shieldHits:0,think:0,personality:Math.random(),lastDrop:0,spawnProtectedUntil:0,
    targetSegments:segmentsForScore(score),mouthOpen:0,lookTarget:null,aiState:'forage',boostTrailTimer:0};
  const spacing=Math.max(3,worm.r*.45);
  for(let i=0;i<Math.max(30,worm.targetSegments*8);i++) worm.trail.push({x:x-Math.cos(angle)*i*spacing/7,y:y-Math.sin(angle)*i*spacing/7});
  return worm;
}

export function updateWormTrail(worm, dt, targetAngle, world, boost=false) {
  // Radius and length respond to the live score, while mass growth remains the
  // established gradual 0.01-per-food-point economy in Game.collectForWorm.
  worm.r = Math.max(wormRadiusForMass(worm.mass, worm.food || 0), wormRadiusForScore(worm.score || 0));
  worm.targetSegments = segmentsForScore(worm.score || 0);
  const turbo = Boolean(worm.powerups?.turbo);
  const turnRate = 4.3 / (1 + worm.r * 0.035) * (turbo ? 1.35 : 1);
  const turn = clamp(dt * turnRate, 0, 1);
  worm.angle = angleLerp(worm.angle,targetAngle,turn);
  const activeSpeed = worm.baseSpeed * (boost ? BOOST_SPEED_RATIO : 1) * (worm.powerups.speed?1.45:1) * (turbo?1.4:1) * (worm.powerups.super?2.05:1);
  worm.speed = activeSpeed;
  const step = activeSpeed*dt;
  worm.x += Math.cos(worm.angle)*step;
  worm.y += Math.sin(worm.angle)*step;
  worm.x = clamp(worm.x, 24, world.width-24);
  worm.y = clamp(worm.y, 24, world.height-24);
  worm.trail.unshift({x:worm.x,y:worm.y});
  const desired = worm.targetSegments;
  const keep = Math.max(100, desired*16+40);
  if(worm.trail.length>keep) worm.trail.length=keep;
}

// Sample the trail by physical distance so visual segment spacing scales with
// worm thickness instead of relying on a fixed number of history samples.
export function sampleWormTrail(worm, count = worm.targetSegments || segmentsForScore(worm.score || 0)) {
  const trail=worm.trail||[];
  if(!trail.length)return [{x:worm.x,y:worm.y}];
  const wanted=Math.max(2,Math.min(2600,count||15));
  const spacing=Math.max(3,(worm.r||14)*.45);
  const points=[{x:trail[0].x,y:trail[0].y}];
  let cumulative=0,nextDistance=spacing;
  for(let i=1;i<trail.length&&points.length<wanted;i++){
    const a=trail[i-1],b=trail[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<1e-6)continue;
    while(cumulative+d>=nextDistance&&points.length<wanted){
      const t=(nextDistance-cumulative)/d;
      points.push({x:a.x+dx*t,y:a.y+dy*t});
      nextDistance+=spacing;
    }
    cumulative+=d;
  }
  return points;
}

export function bodyPoints(worm) {
  return sampleWormTrail(worm).slice(1).reverse();
}

function skinColor(skin, index, count, time) {
  if(skin.pattern==='rainbow') return `hsl(${(time*.05+index*13)%360} 88% 62%)`;
  if(skin.pattern==='galaxy') return index%4===0?'#fff1be':(index%2?skin.a:skin.b);
  if(skin.pattern==='glow') return index%3===0?'#fff4a3':(index%2?skin.a:skin.b);
  if(skin.pattern==='stripe') return index%3===0?skin.b:skin.a;
  if(skin.pattern==='spots') return index%4===0?skin.b:skin.a;
  return index%5===0?skin.b:skin.a;
}

export function drawWorm(ctx,worm,skin,time,zoom=1,viewBounds=null) {
  const points=sampleWormTrail(worm).reverse();
  const count=points.length, radius=worm.r||wormRadiusForMass(worm.mass,worm.food||0);
  ctx.save();
  if(worm.player && Object.values(worm.powerups).some(Boolean)) {ctx.shadowBlur=18;ctx.shadowColor='#fff1a6';}
  for(let i=0;i<points.length;i++) {
    const p=points[i];
    if(viewBounds&&(p.x<viewBounds.left-radius||p.x>viewBounds.right+radius||p.y<viewBounds.top-radius||p.y>viewBounds.bottom+radius))continue;
    const pct=i/Math.max(1,count-1),r=radius*(.68+.32*Math.sin(pct*Math.PI*.65));
    const gradient=ctx.createRadialGradient(p.x-r*.28,p.y-r*.34,1,p.x,p.y,r*1.3);
    gradient.addColorStop(0,skin.pattern==='rainbow'?'#ffffff':skin.a);
    gradient.addColorStop(.42,skinColor(skin,i,count,time));
    gradient.addColorStop(1,skin.b);
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=gradient;ctx.shadowColor=skin.a;ctx.shadowBlur=Math.min(8,Math.max(2,r*.18));ctx.fill();ctx.shadowBlur=0;
    ctx.lineWidth=1.8;ctx.strokeStyle='rgba(8,16,30,.38)';ctx.stroke();
    ctx.beginPath();ctx.arc(p.x-r*.28,p.y-r*.35,r*.32,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fill();
    if(skin.pattern==='spots'&&i%4===0){ctx.beginPath();ctx.arc(p.x+r*.2,p.y,r*.22,0,Math.PI*2);ctx.fillStyle='rgba(65,42,25,.45)';ctx.fill();}
  }
  // Expressive head and pupils which glance toward the nearest food.
  ctx.translate(worm.x,worm.y);ctx.rotate(worm.angle);
  ctx.shadowColor=skin.a;ctx.shadowBlur=radius*.75;
  ctx.beginPath();ctx.ellipse(1,0,radius*1.1,radius*.96,0,0,Math.PI*2);ctx.fillStyle=skin.a;ctx.fill();
  ctx.shadowBlur=0;ctx.lineWidth=2;ctx.strokeStyle='rgba(8,18,28,.36)';ctx.stroke();
  let lookX=0,lookY=0;
  if(worm.lookTarget){const dx=worm.lookTarget.x-worm.x,dy=worm.lookTarget.y-worm.y;const a=-worm.angle;lookX=clamp((dx*Math.cos(a)-dy*Math.sin(a))/(Math.hypot(dx,dy)||1)*2.6,-2.6,2.6);lookY=clamp((dx*Math.sin(a)+dy*Math.cos(a))/(Math.hypot(dx,dy)||1)*2.6,-2.6,2.6);}
  for(const ey of [-1,1]) {
    ctx.beginPath();ctx.arc(5,ey*6,Math.max(3.6,radius*.22),0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    ctx.beginPath();ctx.arc(6.7+lookX,ey*6+lookY,Math.max(1.6,radius*.1),0,Math.PI*2);ctx.fillStyle='#172336';ctx.fill();
    ctx.beginPath();ctx.arc(6.2+lookX,ey*6+lookY-1,Math.max(.7,radius*.045),0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  }
  const mouth=Math.max(0,Math.min(1,worm.mouthOpen||0));
  ctx.beginPath();ctx.ellipse(radius*.72,0,radius*(.12+mouth*.18),radius*(.035+mouth*.13),0,0,Math.PI*2);ctx.fillStyle='#32101e';ctx.fill();
  if(mouth>.25){ctx.beginPath();ctx.ellipse(radius*.77,radius*.07,radius*.07,radius*.035,0,0,Math.PI*2);ctx.fillStyle='#ff83a6';ctx.fill();}
  ctx.restore();
  if(worm.name) {
    const labelVisible=!viewBounds||(worm.x>=viewBounds.left-120&&worm.x<=viewBounds.right+120&&worm.y>=viewBounds.top-160&&worm.y<=viewBounds.bottom+120);
    if(labelVisible){
      ctx.save();const label=String(worm.name).replace(/[<>]/g,'').slice(0,18);
      ctx.font=`800 ${worm.player?13:12}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
      const labelWidth=ctx.measureText(label).width+14,labelY=worm.y-radius-23;
      ctx.fillStyle=worm.player?'rgba(15,82,54,.88)':'rgba(12,24,40,.82)';
      ctx.beginPath();ctx.roundRect(worm.x-labelWidth/2,labelY-9,labelWidth,18,8);ctx.fill();
      ctx.fillStyle='#fff';ctx.fillText(label,worm.x,labelY);ctx.restore();
    }
  }
}
