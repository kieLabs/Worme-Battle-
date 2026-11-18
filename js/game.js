import { WORLD, FOOD_TYPES, POWERUPS, SKINS, THEMES, BOT_NAMES, MODES } from './config.js';
import { clamp, clampZoom, distance, angleTo, angleLerp, random, weightedPick, segmentsForMass, segmentsForScore, wormRadiusForScore, wormRadiusForMass, autoZoomForRadius, boostScoreDrain, formatNumber, spawnProtectionRemaining, canWormsCollide, trailFoodPositions, newWormSpawnMass, displayText, foodMassGain } from './logic.js';
import { createWorm, updateWormTrail, bodyPoints, drawWorm } from './worm.js';
import { Camera } from './camera.js';
import { chooseBotAngle } from './ai.js';
import { createFood, foodAttract, getWormMouthPoint } from './food.js';
import { bodyHitsTrail, touchesWorldWall } from './collision.js';
import { activatePowerup, expirePowerups, powerupIsActive } from './powerups.js';
import { createParticleBurst, stepParticles } from './particles.js';
import { SpatialHash } from './spatial.js';

export class Game {
  constructor(canvas, {onUpdate=()=>{}, onGameOver=()=>{}, onNotice=()=>{}, onSound=()=>{}}={}) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.onUpdate=onUpdate;this.onGameOver=onGameOver;this.onNotice=onNotice;this.onSound=onSound;
    this.camera=new Camera();this.state='menu';this.mode='classic';this.save=null;this.player=null;this.bots=[];this.food=[];this.powerItems=[];this.coins=[];this.particles=[];
    this.elapsed=0;this.last=0;this.acc=0;this.raf=0;this.viewZoom=1;this.frame=0;this.timeLeft=180;this.arenaRadius=WORLD.arenaRadius;this.foodGrid=new SpatialHash(280);this.wormGrid=new SpatialHash(420);this.bodyGrids=new Map();this.boostAudioOn=false;this.totalScore=0;this.startedAt=0;this.bestMass=0;this.kills=0;this.foodEaten=0;this.coinsEarned=0;this.gemsEarned=0;this.powerupsCollected=0;this.lastCollectSound=0;this.boost=false;this.pointerAngle=0;this.lastBoostDrop=0;this.notifyTimer=0;this.currentTheme=THEMES[0];this.lastSummary=null;this.runFinalized=false;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    this.resize();
  }
  resize(){
    const rect=this.canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);
    this.canvas.width=Math.max(1,Math.floor(rect.width*dpr));this.canvas.height=Math.max(1,Math.floor(rect.height*dpr));
    this.ctx.setTransform(dpr,0,0,dpr,0,0);this.cssWidth=rect.width;this.cssHeight=rect.height;
  }
  start(mode='classic',save){
    this.mode=mode;this.save=save;this.state='playing';this.elapsed=0;this.timeLeft=180;this.arenaRadius=WORLD.arenaRadius;this.foodGrid.clear();this.wormGrid.clear();this.bodyGrids.clear();this.boostAudioOn=false;this.totalScore=0;this.kills=0;this.foodEaten=0;this.coinsEarned=0;this.gemsEarned=0;this.powerupsCollected=0;this.lastCollectSound=0;this.bestMass=0;this.frame=0;this.particles=[];this.coins=[];this.lastSummary=null;this.runFinalized=false;
    this.currentTheme=THEMES.find(t=>t.id===save.selectedTheme)||THEMES[0];
    const mass=mode==='giant'?360:30;
    this.player=createWorm({x:WORLD.centerX,y:WORLD.centerY,angle:Math.random()*Math.PI*2,name:save.username||'Player',skin:SKINS[save.selectedSkin]||SKINS[0],player:true,mass});
    this.player.spawnProtectedUntil=this.elapsed+3;
    const botCount=Math.min(30,Math.max(25,Math.floor((this.cssWidth*this.cssHeight)/22000)));
    this.bots=[];
    for(let i=0;i<botCount;i++) this.bots.push(this.makeBot(i));
    this.food=[];for(let i=0;i<2200;i++)this.spawnFood();
    this.foodGrid.rebuild(this.food);
    this.powerItems=[];for(let i=0;i<24;i++)this.spawnPower();
    this.camera.x=this.player.x;this.camera.y=this.player.y;this.startedAt=performance.now();
    this.onNotice(MODES.find(m=>m.id===mode)?.name||'Classic Endless');
    this.onUpdate(this.getStats());
    if(!this.raf)this.loop();
  }
  makeBot(index){
    const angle=random(0,Math.PI*2),rad=Math.sqrt(random(.025,.78))*(WORLD.arenaRadius-850);const x=clamp(WORLD.centerX+Math.cos(angle)*rad,100,WORLD.width-100);const y=clamp(WORLD.centerY+Math.sin(angle)*rad,100,WORLD.height-100);
    const skin=SKINS[Math.floor(Math.random()*SKINS.length)];
    const bot=createWorm({x,y,angle:random(-Math.PI,Math.PI),name:`${BOT_NAMES[index%BOT_NAMES.length]}${index>=BOT_NAMES.length?` ${Math.floor(index/BOT_NAMES.length)+1}`:''}`,skin,player:false,mass:this.mode==='giant'?random(60,130):newWormSpawnMass(),ai:index});
    bot.r=bot.r;bot.think=Math.random();bot.spawnProtectedUntil=this.elapsed+3;return bot;
  }
  spawnFood(x=null,y=null,forcedType=null){
    if(x===null||y===null){const a=random(0,Math.PI*2),r=Math.sqrt(Math.random())*(WORLD.arenaRadius-100);x=WORLD.centerX+Math.cos(a)*r;y=WORLD.centerY+Math.sin(a)*r;}
    const type=forcedType||weightedPick(FOOD_TYPES);
    this.food.push(createFood(x,y,type,Math.random()*6.28));
  }
  spawnPower(){
    const type=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
    const a=random(0,Math.PI*2),r=Math.sqrt(Math.random())*(WORLD.arenaRadius-200);
    this.powerItems.push({x:WORLD.centerX+Math.cos(a)*r,y:WORLD.centerY+Math.sin(a)*r,r:19,type,phase:Math.random()*6.28});
  }
  addParticles(x,y,color,count=8){
    if(this.save?.workshop?.particles===false)return;
    this.particles.push(...createParticleBurst(x,y,color,count));
  }
  loop=(now=performance.now())=>{
    if(!this.raf&&this.state==='menu') return;
    const dt=Math.min(.035,Math.max(0,(now-(this.last||now))/1000));this.last=now;
    if(this.state==='playing') this.update(dt);
    this.render(now);this.raf=requestAnimationFrame(this.loop);
  }
  stopLoop(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
  pause(){if(this.state==='playing'){this.state='paused';this.boost=false;if(this.boostAudioOn){this.boostAudioOn=false;this.onSound('boostStop');}this.onUpdate(this.getStats());}}
  resume(){if(this.state==='paused'){this.state='playing';this.last=performance.now();}}
  setSteering(angle){if(Number.isFinite(angle))this.pointerAngle=angle;}
  setBoost(active){this.boost=!!active;}
  setZoom(value){this.viewZoom=clampZoom(value);return this.viewZoom;}
  zoomBy(delta){return this.setZoom(this.viewZoom+delta);}
  getStats(){return {score:this.totalScore,mass:this.player?.mass||0,length:this.player?(this.player.targetSegments||segmentsForScore(this.player.score||0)):0,rank:this.getRank(),time:this.elapsed,kills:this.kills,food:this.foodEaten,coins:this.coinsEarned,gems:this.gemsEarned,timeLeft:this.timeLeft,mode:this.mode,powerups:this.player?.powerups||{},powerupsCollected:this.powerupsCollected};}
  getRank(){if(!this.player)return 0;return 1+this.bots.filter(b=>b.alive&&(b.score||0)>(this.player.score||this.totalScore)).length;}
  isPowerActive(id){return powerupIsActive(this.player,id,this.elapsed);}
  update(dt){
    this.elapsed+=dt;this.frame++;
    if(this.mode==='time'){this.timeLeft=Math.max(0,180-this.elapsed);if(this.timeLeft<=0){this.end('time');return;}}
    if(this.mode==='battle'){
      this.arenaRadius=Math.max(300,WORLD.arenaRadius-this.elapsed*5.3);
      const d=Math.hypot(this.player.x-WORLD.centerX,this.player.y-WORLD.centerY);
      if(d>this.arenaRadius){this.damagePlayer('arena');if(this.state!=='playing')return;}
    }
    if(this.mode==='survival'&&this.elapsed>45){for(const b of this.bots)b.baseSpeed=Math.min(190,b.baseSpeed+dt*.25);}
    this.updatePlayer(dt);
    for(const bot of this.bots){if(bot.alive)this.updateBot(bot,dt);else if(this.mode!=='battle'&&this.elapsed>bot.respawnAt){const idx=this.bots.indexOf(bot);this.bots[idx]=this.makeBot(idx);}}
    if(this.mode==='battle'&&this.bots.every(bot=>!bot.alive)){this.end('victory');return;}
    this.updateFood();this.updatePowerups();this.updateCoins(dt);this.updateParticles(dt);this.checkCollisions();
    if(this.state!=='playing')return;
    if(this.food.length<2300){for(let i=0;i<Math.min(8,2300-this.food.length);i++)this.spawnFood();}
    if(this.powerItems.length<24&&Math.random()<dt*1.2)this.spawnPower();
    this.foodGrid.rebuild(this.food);
    const cameraZoom=this.getCameraZoom();
    this.camera.follow(this.player,this.canvas,{width:WORLD.width,height:WORLD.height},dt,cameraZoom);
    this.bestMass=Math.max(this.bestMass,this.player.mass);
    if(this.frame%8===0)this.onUpdate(this.getStats());
  }
  steerAwayFromWalls(worm,angle){
    const cx=WORLD.centerX,cy=WORLD.centerY,dx=worm.x-cx,dy=worm.y-cy;
    const radial=Math.hypot(dx,dy),margin=580;
    if(radial>this.arenaRadius-margin)return angleLerp(angle,Math.atan2(-dy,-dx),clamp((radial-(this.arenaRadius-margin))/margin,.35,.92));
    return angle;
  }
  updatePlayer(dt){
    const p=this.player;if(!p)return;
    const turbo=this.isPowerActive('turbo');
    const useBoost=this.boost&&(this.totalScore>20||turbo);
    p.boosting=useBoost;
    if(useBoost&&!turbo){
      const drain=boostScoreDrain(dt); // 2 score points per frame at 60 FPS.
      this.totalScore=Math.max(0,this.totalScore-drain);p.score=this.totalScore;
      p.mass=Math.max(18,p.mass-foodMassGain(drain));
      if(this.elapsed-p.lastDrop>.55){this.spawnFood(p.x-Math.cos(p.angle)*Math.max(14,p.r*.8),p.y-Math.sin(p.angle)*Math.max(14,p.r*.8),{name:'Boost Crumb',emoji:'✦',color:'#b9f7ff',value:3,weight:1});p.lastDrop=this.elapsed;}
    }
    if(useBoost&&this.elapsed-(p.lastBoostParticle||0)>.035){this.addParticles(p.x-Math.cos(p.angle)*p.r,p.y-Math.sin(p.angle)*p.r,p.skin.a,2);p.lastBoostParticle=this.elapsed;}
    const target=this.steerAwayFromWalls(p,this.pointerAngle);
    updateWormTrail(p,dt,target,{...WORLD,arenaRadius:this.arenaRadius},useBoost);
    this.collectForWorm(p,true);
    expirePowerups(p,this.elapsed);
    if(this.boostAudioOn!==useBoost){this.boostAudioOn=useBoost;this.onSound(useBoost?'boostStart':'boostStop');}
  }
  updateBot(bot,dt){
    bot.think-=dt;
    if(bot.think<=0){
      bot.think=random(.12,.28);
      bot.targetAngle=chooseBotAngle(bot,[this.player,...this.bots],this.food,{...WORLD,arenaRadius:this.arenaRadius},this.powerItems);
    }
    const trapBurst=bot.aiState==='trap'&&performance.now()<(bot.aiBurstUntil||0);
    const boost=trapBurst||(Math.random()<.008&&bot.score>80);
    bot.boosting=boost;
    updateWormTrail(bot,dt,bot.targetAngle||bot.angle,{...WORLD,arenaRadius:this.arenaRadius},boost);
    if(!this.isSpawnProtected(bot)&&touchesWorldWall(bot,{...WORLD,arenaRadius:this.arenaRadius},24)){this.killBot(bot,false,'wall');return;}
    this.collectForWorm(bot,false);
    expirePowerups(bot,this.elapsed);
  }
  collectForWorm(worm,isPlayer){
    const magnet=powerupIsActive(worm,'magnet',this.elapsed);
    const range=magnet?320:(worm.r||14)+24;
    const candidates=this.foodGrid?.query(worm.x,worm.y,range+28)||this.food.slice();
    for(const f of candidates){
      const index=this.food.indexOf(f);if(index<0)continue;
      if(distance(worm,f)<range+(f.r||6)){
        this.food.splice(index,1);
        const growthMult=isPlayer&&this.isPowerActive('food')?2:1;
        const scoreMult=powerupIsActive(worm,'multiplier',this.elapsed)?(worm.powerups.multiplierValue||2):powerupIsActive(worm,'double',this.elapsed)?2:1;
        worm.mass+=foodMassGain(f.type.value,growthMult);
        worm.score=(worm.score||0)+f.type.value*scoreMult;worm.food++;
        worm.r=Math.max(wormRadiusForScore(worm.score),wormRadiusForMass(worm.mass,worm.food));worm.targetSegments=segmentsForScore(worm.score);
        if(isPlayer){
          this.totalScore+=f.type.value*scoreMult;worm.score=this.totalScore;this.foodEaten++;
          this.coinsEarned+=Math.max(1,Math.round(f.type.value/30));
          if(this.elapsed%5<.1){this.save.xp+=Math.round(f.type.value/8)*(this.isPowerActive('xp')?2:1);}
          this.addParticles(f.x,f.y,f.type.color,5);
          if(this.elapsed-this.lastCollectSound>.12){this.onSound('collect');this.lastCollectSound=this.elapsed;}
        }
      }
    }
    if(isPlayer&&this.isPowerActive('gold')&&Math.random()<.003)this.spawnFood(worm.x+random(-180,180),worm.y+random(-180,180),FOOD_TYPES[FOOD_TYPES.length-1]);
  }
  updateFood(){
    const livingWorms=[this.player,...this.bots.filter(bot=>bot.alive)].filter(Boolean);
    this.wormGrid.rebuild(livingWorms);
    for(const food of this.food){
      food.phase+=.03;
      let nearest=null,nearestDistance=Infinity,nearestMouth=null;
      const possible=this.wormGrid.query(food.x,food.y,560);
      for(const worm of possible){
        const mouth=getWormMouthPoint(worm),d=distance(mouth,food);
        if(d<nearestDistance){nearest=worm;nearestDistance=d;nearestMouth=mouth;}
      }
      if(!nearest||!nearestMouth)continue;
      const magnet=powerupIsActive(nearest,'magnet',this.elapsed);
      const range=magnet?320:210;
      if(nearestDistance<range)foodAttract(food,nearestMouth,range,magnet?.12:.045);
    }
    this.foodGrid.rebuild(this.food);
  }
  updatePowerups(){
    const living=[this.player,...this.bots.filter(bot=>bot.alive)].filter(Boolean);
    for(let i=this.powerItems.length-1;i>=0;i--){
      const item=this.powerItems[i];item.phase+=.04;
      const collector=living.find(worm=>distance(worm,item)<worm.r+item.r);
      if(!collector)continue;
      this.powerItems.splice(i,1);activatePowerup(collector,item.type,this.elapsed);
      if(collector===this.player){
        this.powerupsCollected++;if(item.type.id==='xp')this.gemsEarned++;
        this.onSound('power');this.addParticles(item.x,item.y,item.type.color,18);
        const extra=item.type.id==='multiplier'?` ×${collector.powerups.multiplierValue}`:'';
        this.onNotice(`${displayText(item.type.name)}${extra} ACTIVATED`);
      }
      if(this.powerItems.length<18)this.spawnPower();
    }
  }
  updateCoins(dt){
    const coinMag=this.isPowerActive('coin');
    for(let i=this.coins.length-1;i>=0;i--){const c=this.coins[i];c.life-=dt;if(coinMag&&distance(c,this.player)<230){c.x+=(this.player.x-c.x)*.08;c.y+=(this.player.y-c.y)*.08;}if(distance(c,this.player)<20){this.coinsEarned+=c.value;this.addParticles(c.x,c.y,'#ffda54',6);this.coins.splice(i,1);}else if(c.life<=0)this.coins.splice(i,1);}
  }
  updateParticles(dt){stepParticles(this.particles,dt);}
  bodyCollision(head,owner){return bodyHitsTrail(head,owner,this.bodyGrids?.get(owner)||null);}
  rebuildCollisionGrids(){
    if(!this.bodyGrids)this.bodyGrids=new Map();
    const living=[this.player,...(this.bots||[]).filter(bot=>bot.alive)].filter(Boolean);
    const active=new Set(living);
    for(const owner of living){let grid=this.bodyGrids.get(owner);if(!grid){grid=new SpatialHash(128);this.bodyGrids.set(owner,grid);}const points=[];for(let i=14;i<owner.trail.length;i+=4)points.push(owner.trail[i]);grid.rebuild(points);}
    for(const owner of this.bodyGrids.keys())if(!active.has(owner))this.bodyGrids.delete(owner);
  }
  isSpawnProtected(worm){return spawnProtectionRemaining(worm,this.elapsed)>0;}
  drawSpawnShield(ctx,worm,now){
    if(!this.isSpawnProtected(worm))return;
    const points=[...bodyPoints(worm),{x:worm.x,y:worm.y}];
    const pulse=1+Math.sin(now*.012)*.045;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowBlur=17;ctx.shadowColor='#6ce8ff';
    ctx.beginPath();points.forEach((point,index)=>index?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));
    ctx.strokeStyle='rgba(93,220,255,.38)';ctx.lineWidth=(worm.r+7)*2*pulse;ctx.stroke();
    ctx.beginPath();ctx.arc(worm.x,worm.y,(worm.r+12)*pulse,0,Math.PI*2);
    ctx.fillStyle='rgba(112,229,255,.14)';ctx.fill();ctx.strokeStyle='rgba(218,250,255,.95)';ctx.lineWidth=2.5;ctx.stroke();
    ctx.shadowBlur=0;ctx.font='17px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🛡️',worm.x+25,worm.y-25);
    ctx.restore();
  }
  checkCollisions(){
    const p=this.player;this.rebuildCollisionGrids?.();
    // Player self-contact is intentionally non-lethal: only enemy bodies and arena walls can end a run.
    for(const b of this.bots){if(!b.alive)continue;
      if(!canWormsCollide(p,b,this.elapsed))continue;
      if(this.bodyCollision(p,b)){
        if(this.isPowerActive('shield')){delete p.powerups.shield;this.addParticles(p.x,p.y,'#7ceaff',20);this.onNotice('SHIELD BLOCKED A HIT');}
        else {this.end('collision');return;}
      }
      if(this.bodyCollision(b,p)){this.killBot(b,true,'rival');continue;}
    }
    // Check each rival pair once. A worm is only tested against a DIFFERENT
    // worm's body; its own trail is never a lethal target.
    if(this.frame%2===0){
      for(let i=0;i<this.bots.length;i++){
        const a=this.bots[i];if(!a.alive)continue;
        for(let j=i+1;j<this.bots.length;j++){
          const b=this.bots[j];if(!b.alive||!canWormsCollide(a,b,this.elapsed))continue;
          const aHitsB=this.bodyCollision(a,b);
          const bHitsA=this.bodyCollision(b,a);
          if(aHitsB)this.killBot(a,false,'rival');
          if(bHitsA)this.killBot(b,false,'rival');
          if(!a.alive)break;
        }
      }
    }
    if(!this.isSpawnProtected(p)&&touchesWorldWall(p,{...WORLD,arenaRadius:this.arenaRadius},24)){this.end('wall');}
  }
  killBot(bot,credited,reason='rival'){
    if(!bot.alive)return;bot.alive=false;bot.deathReason=reason;bot.respawnAt=this.elapsed+1.4;
    // Death loot follows the exact curve of the defeated worm instead of a circular scatter.
    const drops=clamp(Math.floor((bot.targetSegments||segmentsForScore(bot.score||0))*.18),12,240);
    const trailDrops=trailFoodPositions(bot,drops);
    trailDrops.forEach((point,i)=>this.spawnFood(point.x,point.y,{name:'Plasma Loot',emoji:'✦',color:i%2?'#35eaff':'#b34dff',value:clamp(50+Math.floor(bot.mass/Math.max(1,drops)*7)+i%7*12,50,300),weight:1}));
    this.coins.push({x:bot.x,y:bot.y,value:8+Math.floor(bot.mass/35),life:18});this.addParticles(bot.x,bot.y,bot.skin.a,22);
    if(credited){this.kills++;this.player.kills++;this.onNotice('ENEMY ELIMINATED + COINS');}
  }
  damagePlayer(reason){if(this.isSpawnProtected(this.player)){this.onNotice('SPAWN SHIELD ACTIVE');return;}if(this.isPowerActive('shield')){delete this.player.powerups.shield;this.onNotice('SHIELD BLOCKED ARENA DAMAGE');const dx=this.player.x-WORLD.centerX,dy=this.player.y-WORLD.centerY,d=Math.hypot(dx,dy)||1,limit=this.arenaRadius-90;this.player.x=WORLD.centerX+dx/d*Math.min(d,limit);this.player.y=WORLD.centerY+dy/d*Math.min(d,limit);}else this.end(reason);}
  end(reason){
    if(this.state!=='playing')return;
    this.state='gameover';this.boost=false;if(this.boostAudioOn){this.boostAudioOn=false;this.onSound('boostStop');}
    const summary={score:this.totalScore,mass:this.player.mass,length:this.player.targetSegments||segmentsForScore(this.player.score||0),time:this.elapsed,kills:this.kills,food:this.foodEaten,coins:this.coinsEarned,powerups:this.powerupsCollected,reason,mode:this.mode};
    this.lastSummary=summary;
    this.onGameOver(summary);
  }
  continueAfterReward(){
    if(this.state!=='gameover'||!this.player||!this.lastSummary||!['collision','wall','arena'].includes(this.lastSummary.reason))return false;
    this.state='playing';this.boost=false;this.player.spawnProtectedUntil=this.elapsed+4;
    this.lastSummary=null;this.runFinalized=false;this.last=performance.now();
    this.onNotice('REVIVED · 4s SPAWN SHIELD');this.onUpdate(this.getStats());
    return true;
  }
  finalizeRun(){
    if(this.state!=='gameover'||!this.lastSummary||this.runFinalized||!this.save)return null;
    const summary=this.lastSummary;this.runFinalized=true;
    this.save.gamesPlayed++;this.save.totalFood+=this.foodEaten;this.save.totalKills+=this.kills;this.save.totalScore+=this.totalScore;
    this.save.coins+=this.coinsEarned+Math.floor(this.totalScore/180);this.save.xp+=Math.floor(this.totalScore/5)+Math.floor(this.elapsed);
    this.save.bestScore=Math.max(this.save.bestScore,this.totalScore);this.save.longestWorm=Math.max(this.save.longestWorm,summary.length);this.save.bestTime=Math.max(this.save.bestTime,this.elapsed);
    return summary;
  }
  getCameraZoom(){
    const growth=autoZoomForRadius(this.player?.r||14);
    const radar=this.isPowerActive('zoom');
    return clamp(this.viewZoom*growth*(radar?.7:1),radar?.294:.42,1.65);
  }
  isVisible(point,bounds,padding=80){return point.x>=bounds.left-padding&&point.x<=bounds.right+padding&&point.y>=bounds.top-padding&&point.y<=bounds.bottom+padding;}
  updateWormFace(worm){
    const candidates=this.foodGrid?.query(worm.x,worm.y,360)||[];
    let target=null,best=Infinity;
    for(const food of candidates){const d=distance(worm,food);if(d<best){best=d;target=food;}}
    worm.lookTarget=target&&best<360?target:null;
    const desired=best<80?clamp((80-best)/80,0,1):0;
    worm.mouthOpen+=(desired-worm.mouthOpen)*.28;
  }
  drawFoodItem(ctx,food,now){
    const pulse=1+Math.sin(now*.003+food.phase)*.1,r=food.r;
    const name=String(food.type.name||'').toLowerCase();
    ctx.save();ctx.translate(food.x,food.y);ctx.scale(pulse,pulse);ctx.shadowColor=food.type.color;ctx.shadowBlur=food.type.value>35?18:11;
    if(name.includes('energy')||name.includes('plasma')||name.includes('crumb')){
      const g=ctx.createRadialGradient(-r*.3,-r*.4,1,0,0,r*1.5);g.addColorStop(0,'#ffffff');g.addColorStop(.25,food.type.color);g.addColorStop(1,'rgba(20,90,160,.12)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*.95,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bdfaff';ctx.lineWidth=1.2;ctx.stroke();
    }else if(name.includes('cheese')){
      ctx.beginPath();ctx.moveTo(-r,-r*.75);ctx.lineTo(r*1.2,r*.2);ctx.lineTo(-r,r*.8);ctx.closePath();ctx.fillStyle='#ffc83d';ctx.fill();ctx.strokeStyle='#fff0a2';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#ffe98a';for(const [x,y,rr] of [[-.3*r,-.12*r,.14*r],[.25*r,.1*r,.12*r],[-.1*r,.36*r,.1*r]]){ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill();}
    }else if(name.includes('burger')){
      ctx.fillStyle='#e9a14b';ctx.beginPath();ctx.ellipse(0,-r*.25,r*1.15,r*.58,0,Math.PI,0);ctx.fill();ctx.fillRect(-r*1.1,-r*.18,r*2.2,r*.3);
      ctx.fillStyle='#62d56b';ctx.fillRect(-r*1.1,r*.08,r*2.2,r*.16);ctx.fillStyle='#70402d';ctx.fillRect(-r*1.1,r*.22,r*2.2,r*.24);ctx.fillStyle='#f0c06b';ctx.beginPath();ctx.ellipse(0,r*.48,r*1.12,r*.28,0,0,Math.PI);ctx.fill();
      ctx.fillStyle='#fff0c3';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(i*r*.32,-r*.45,1.3,2,0,0,Math.PI*2);ctx.fill();}
    }else if(name.includes('donut')){
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.arc(0,0,r*.38,0,Math.PI*2,true);ctx.fillStyle='#d987c9';ctx.fill('evenodd');ctx.strokeStyle='#ffc2ec';ctx.lineWidth=2;ctx.stroke();
      for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.fillStyle=['#fff080','#83f2ff','#ff8e65'][i%3];ctx.fillRect(-1,-r*.78,2,4);ctx.restore();}
    }else if(name.includes('candy')){
      ctx.fillStyle=food.type.color;ctx.beginPath();ctx.moveTo(-r*1.4,0);ctx.lineTo(-r*.8,-r*.55);ctx.lineTo(-r*.8,r*.55);ctx.closePath();ctx.fill();ctx.beginPath();ctx.ellipse(0,0,r*.85,r*.58,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(r*1.4,0);ctx.lineTo(r*.8,-r*.55);ctx.lineTo(r*.8,r*.55);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
    }else if(name.includes('apple')){
      ctx.fillStyle=food.type.color;ctx.beginPath();ctx.arc(-r*.22,r*.08,r*.68,0,Math.PI*2);ctx.arc(r*.28,r*.08,r*.68,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffb4c0';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#7dff65';ctx.beginPath();ctx.ellipse(r*.25,-r*.72,r*.42,r*.2,-.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#93602d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-r*.5);ctx.lineTo(r*.08,-r*.95);ctx.stroke();
    }else{
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=food.type.color;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.4;ctx.stroke();ctx.font=`${Math.max(10,r*1.4)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(displayText(food.type.emoji),0,1);
    }
    ctx.restore();
  }
  drawPotionItem(ctx,item,now){
    const bob=Math.sin(now*.004+item.phase)*5,color=item.type.color,label=({magnet:'MAG',zoom:'RADAR',double:'2X',multiplier:'2/5X',turbo:'TURBO',speed:'SPD'})[item.type.id]||item.type.name.slice(0,5);
    ctx.save();ctx.translate(item.x,item.y+bob);ctx.shadowColor=color;ctx.shadowBlur=24;
    ctx.fillStyle=color+'33';ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#eaffff';ctx.fillRect(-5,-17,10,7);ctx.strokeStyle='#eaffff';ctx.lineWidth=1.5;ctx.strokeRect(-5,-17,10,7);
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-9,-10);ctx.lineTo(9,-10);ctx.lineTo(12,9);ctx.quadraticCurveTo(0,22,-12,9);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='900 8px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,0,4);ctx.font='900 8px system-ui';ctx.fillText(label,0,34);ctx.restore();
  }
  render(now){
    if(!this.ctx)return;const ctx=this.ctx,w=this.cssWidth,h=this.cssHeight;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#070910';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const camera=this.player?this.camera:{x:WORLD.centerX,y:WORLD.centerY};
    const zoom=this.state==='playing'?this.getCameraZoom():1;
    const bounds={left:camera.x-w/(2*zoom),right:camera.x+w/(2*zoom),top:camera.y-h/(2*zoom),bottom:camera.y+h/(2*zoom)};
    ctx.save();ctx.translate(w/2-camera.x*zoom,h/2-camera.y*zoom);ctx.scale(zoom,zoom);
    this.drawArena(ctx,bounds);
    const visibleFood=this.foodGrid.query(camera.x,camera.y,Math.hypot(w/(2*zoom),h/(2*zoom))+90);
    for(const f of visibleFood)if(this.isVisible(f,bounds,40))this.drawFoodItem(ctx,f,now);
    for(const c of this.coins)if(this.isVisible(c,bounds,40)){ctx.beginPath();ctx.arc(c.x,c.y,9,0,Math.PI*2);ctx.fillStyle='#ffcf42';ctx.fill();ctx.strokeStyle='#fff2a6';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#603e0d';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('G',c.x,c.y+4);}
    for(const item of this.powerItems)if(this.isVisible(item,bounds,45))this.drawPotionItem(ctx,item,now);
    const living=[...this.bots.filter(bot=>bot.alive),...(this.player?[this.player]:[])];
    for(const worm of living){if(!this.isVisible(worm,bounds,Math.max(220,(worm.r||14)*2)))continue;this.updateWormFace(worm);drawWorm(ctx,worm,worm.skin,now,zoom,bounds);this.drawSpawnShield(ctx,worm,now);}
    if(this.player){ctx.save();ctx.font='17px system-ui';ctx.textAlign='center';ctx.fillText(this.save?.workshop?.emoji||'🐛',this.player.x+29,this.player.y-24);ctx.restore();}
    if(this.save?.workshop?.particles!==false){for(const particle of this.particles){if(!this.isVisible(particle,bounds,30))continue;ctx.globalAlpha=clamp(particle.life/particle.max,0,1);ctx.beginPath();ctx.arc(particle.x,particle.y,particle.r,0,Math.PI*2);ctx.fillStyle=particle.color;ctx.shadowColor=particle.color;ctx.shadowBlur=9;ctx.fill();}}ctx.globalAlpha=1;ctx.shadowBlur=0;
    ctx.restore();
    if(this.state==='menu')this.drawIdle(ctx,w,h,now);
    if(this.state==='paused'){ctx.fillStyle='rgba(15,29,37,.48)';ctx.fillRect(0,0,w,h);}
  }
  drawArena(ctx,bounds){
    const cx=WORLD.centerX,cy=WORLD.centerY,radius=this.arenaRadius;
    const theme=this.currentTheme||THEMES[0],cyber=theme.id==='meadow';
    const left=Math.max(cx-radius,bounds.left-100),right=Math.min(cx+radius,bounds.right+100);
    const top=Math.max(cy-radius,bounds.top-100),bottom=Math.min(cy+radius,bounds.bottom+100);
    ctx.save();ctx.fillStyle='#070910';ctx.fillRect(bounds.left-100,bounds.top-100,bounds.right-bounds.left+200,bounds.bottom-bounds.top+200);
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();
    const floor=ctx.createRadialGradient(cx,cy,100,cx,cy,radius);floor.addColorStop(0,cyber?'#111a27':theme.bg);floor.addColorStop(.78,cyber?'#0b0e14':theme.bg);floor.addColorStop(1,cyber?'#080b12':theme.grid);ctx.fillStyle=floor;ctx.fillRect(left,top,right-left,bottom-top);
    ctx.strokeStyle=cyber?'#1a2333':theme.grid;ctx.lineWidth=1;ctx.globalAlpha=.82;
    const step=90;for(let x=Math.floor(left/step)*step;x<=right;x+=step){ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();}
    for(let y=Math.floor(top/step)*step;y<=bottom;y+=step){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();}ctx.globalAlpha=1;
    // Subtle procedural hex mesh, limited to the active camera viewport.
    const hexStep=180,hexR=39;for(let row=Math.floor(top/hexStep)-1;row<=Math.ceil(bottom/hexStep)+1;row++){
      const y=row*hexStep;for(let col=Math.floor(left/hexStep)-1;col<=Math.ceil(right/hexStep)+1;col++){
        const x=col*hexStep+(row%2)*90;ctx.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k;const px=x+Math.cos(a)*hexR,py=y+Math.sin(a)*hexR;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.strokeStyle=cyber?'rgba(31,55,79,.24)':'rgba(255,255,255,.12)';ctx.lineWidth=1;ctx.stroke();
      }
    }
    ctx.restore();
    ctx.save();ctx.shadowColor='#ff174f';ctx.shadowBlur=32;ctx.strokeStyle='#ff234f';ctx.lineWidth=16;ctx.beginPath();ctx.arc(cx,cy,radius-4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=12;ctx.strokeStyle='#ff8ba3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,radius-4,0,Math.PI*2);ctx.stroke();ctx.restore();
    if(this.mode==='battle'){ctx.save();ctx.strokeStyle='rgba(255,70,95,.85)';ctx.lineWidth=4;ctx.setLineDash([18,12]);ctx.beginPath();ctx.arc(cx,cy,this.arenaRadius-35,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  drawIdle(ctx,w,h,now){
    ctx.save();ctx.translate(w/2,h/2);ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.arc(0,0,Math.min(w,h)*.29,0,Math.PI*2);ctx.fill();
    const t=now*.0004;for(let i=0;i<8;i++){const a=t+i*Math.PI/4,x=Math.cos(a)*Math.min(w,h)*.18,y=Math.sin(a)*Math.min(w,h)*.18;ctx.beginPath();ctx.arc(x,y,12+Math.sin(t*4+i)*3,0,Math.PI*2);ctx.fillStyle=['#ff9b50','#72d9a0','#73c8ff','#f3db54'][i%4];ctx.fill();}
    ctx.restore();
  }
}
