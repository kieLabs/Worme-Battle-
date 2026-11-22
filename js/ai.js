import { angleTo, angleLerp, random } from './logic.js';

const wrap = angle => Math.atan2(Math.sin(angle),Math.cos(angle));

function nearestFoodTarget(bot, food) {
  let target=null,best=Infinity;
  for(let i=0;i<food.length;i+=2){
    const f=food[i],value=f.type?.value||1;
    const d=Math.hypot(f.x-bot.x,f.y-bot.y)/(1+Math.min(80,value)*.018);
    if(d<best){best=d;target=f;}
  }
  return target;
}

function obstacleRisk(bot, angle, rivals, world) {
  const lookDistances=[90,170,270,390];
  let risk=0;
  for(const distanceAhead of lookDistances){
    const x=bot.x+Math.cos(angle)*distanceAhead,y=bot.y+Math.sin(angle)*distanceAhead;
    if(Number.isFinite(world.arenaRadius)){
      const cx=world.centerX??world.width/2,cy=world.centerY??world.height/2;
      const edge=world.arenaRadius-Math.hypot(x-cx,y-cy);
      if(edge<(bot.r||14)+50)risk+=Math.max(0,((bot.r||14)+50-edge))*18;
    }else if(x<80||y<80||x>world.width-80||y>world.height-80)risk+=2200;
    for(const other of rivals){
      if(!other||other===bot||!other.alive||!Array.isArray(other.trail))continue;
      const separation=(bot.r||14)+(other.r||14)+42;
      for(let i=8;i<other.trail.length;i+=10){
        const point=other.trail[i],d=Math.hypot(x-point.x,y-point.y);
        if(d<separation){risk+=((separation-d)/separation)*1100;break;}
      }
    }
  }
  return risk;
}

export function chooseBotAngle(bot, rivals, food, world, powerItems = []) {
  let desired=bot.angle||0;
  let state='forage';
  const target=nearestFoodTarget(bot,food);
  if(target)desired=angleTo(bot,target);

  // Large rivals try short intercept cuts against smaller worms; the candidate
  // steering still passes through the same safety raycasts before acceptance.
  let prey=null,preyDistance=Infinity;
  for(const other of rivals){
    if(!other||other===bot||!other.alive||other.player)continue;
    const d=Math.hypot(other.x-bot.x,other.y-bot.y);
    if((bot.score||bot.mass*2)>(other.score||other.mass*2)*1.3&&d<760&&d<preyDistance){prey=other;preyDistance=d;}
  }
  if(prey){
    state=preyDistance<420?'trap':'opportunist';
    const lead=Math.min(240,preyDistance*.35);
    desired=Math.atan2(prey.y+Math.sin(prey.angle||0)*lead-bot.y,prey.x+Math.cos(prey.angle||0)*lead-bot.x);
  }

  // Potions are valuable secondary targets, especially when a bot is not in
  // immediate danger. Their attraction is intentionally weaker than food.
  let potionTarget=null,potionScore=Infinity;
  for(const item of powerItems){const d=Math.hypot(item.x-bot.x,item.y-bot.y);if(d<620&&d<potionScore){potionScore=d;potionTarget=item;}}
  if(potionTarget&&!prey&&(!target||potionScore<Math.hypot(target.x-bot.x,target.y-bot.y)*.8))desired=angleTo(bot,potionTarget);

  const offsets=[-1.05,-.55,0,.55,1.05];
  let bestAngle=desired,bestScore=-Infinity,directRisk=obstacleRisk(bot,desired,rivals,world);
  for(const offset of offsets){
    const angle=wrap(desired+offset);
    const risk=obstacleRisk(bot,angle,rivals,world);
    const progress=Math.cos(wrap(angle-desired))*100;
    const smoothness=Math.abs(wrap(angle-(bot.angle||0)))*-5;
    const score=progress-risk+smoothness;
    if(score>bestScore){bestScore=score;bestAngle=angle;}
  }
  if(directRisk>80)state='evade';
  bot.aiState=state;
  if(state==='trap')bot.aiBurstUntil=performance.now()+480;
  return angleLerp(bot.angle||bestAngle,bestAngle,random(.72,.98));
}
