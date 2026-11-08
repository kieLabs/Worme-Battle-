import { WORLD, FOOD_TYPES, POWERUPS, SKINS, THEMES, BOT_NAMES, MODES } from './config.js';
import { clamp, clampZoom, distance, angleTo, angleLerp, random, weightedPick, segmentsForMass, formatNumber, spawnProtectionRemaining, canWormsCollide, trailFoodPositions, newWormSpawnMass, displayText, foodMassGain } from './logic.js';
import { createWorm, updateWormTrail, bodyPoints, drawWorm } from './worm.js';
import { Camera } from './camera.js';
import { chooseBotAngle } from './ai.js';
import { createFood, foodAttract, getWormMouthPoint } from './food.js';
import { bodyHitsTrail, selfHitsTrail } from './collision.js';
import { activatePowerup, expirePowerups, powerupIsActive } from './powerups.js';
import { createParticleBurst, stepParticles } from './particles.js';

export class Game {
  constructor(canvas, {onUpdate=()=>{}, onGameOver=()=>{}, onNotice=()=>{}, onSound=()=>{}}={}) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.onUpdate=onUpdate;this.onGameOver=onGameOver;this.onNotice=onNotice;this.onSound=onSound;
    this.camera=new Camera();this.state='menu';this.mode='classic';this.save=null;this.player=null;this.bots=[];this.food=[];this.powerItems=[];this.coins=[];this.particles=[];
    this.elapsed=0;this.last=0;this.acc=0;this.raf=0;this.viewZoom=1;this.frame=0;this.timeLeft=180;this.arenaRadius=1120;this.totalScore=0;this.startedAt=0;this.bestMass=0;this.kills=0;this.foodEaten=0;this.coinsEarned=0;this.gemsEarned=0;this.powerupsCollected=0;this.lastCollectSound=0;this.boost=false;this.pointerAngle=0;this.lastBoostDrop=0;this.notifyTimer=0;this.currentTheme=THEMES[0];this.lastSummary=null;this.runFinalized=false;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    this.resize();
  }
  resize(){
    const rect=this.canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);
    this.canvas.width=Math.max(1,Math.floor(rect.width*dpr));this.canvas.height=Math.max(1,Math.floor(rect.height*dpr));
    this.ctx.setTransform(dpr,0,0,dpr,0,0);this.cssWidth=rect.width;this.cssHeight=rect.height;
  }
  start(mode='classic',save){
    this.mode=mode;this.save=save;this.state='playing';this.elapsed=0;this.timeLeft=180;this.arenaRadius=1120;this.totalScore=0;this.kills=0;this.foodEaten=0;this.coinsEarned=0;this.gemsEarned=0;this.powerupsCollected=0;this.lastCollectSound=0;this.bestMass=0;this.frame=0;this.particles=[];this.coins=[];this.lastSummary=null;this.runFinalized=false;
    this.currentTheme=THEMES.find(t=>t.id===save.selectedTheme)||THEMES[0];
    const mass=mode==='giant'?360:30;
    this.player=createWorm({x:WORLD.width/2,y:WORLD.height/2,angle:Math.random()*Math.PI*2,name:save.username||'Player',skin:SKINS[save.selectedSkin]||SKINS[0],player:true,mass});
    this.player.spawnProtectedUntil=this.elapsed+3;
    const botCount=Math.min(45,Math.max(30,Math.floor((this.cssWidth*this.cssHeight)/22000)));
    this.bots=[];
    for(let i=0;i<botCount;i++) this.bots.push(this.makeBot(i));
    this.food=[];for(let i=0;i<560;i++)this.spawnFood();
    this.powerItems=[];for(let i=0;i<13;i++)this.spawnPower();
    this.camera.x=this.player.x;this.camera.y=this.player.y;this.startedAt=performance.now();
    this.onNotice(MODES.find(m=>m.id===mode)?.name||'Classic Endless');
    this.onUpdate(this.getStats());
    if(!this.raf)this.loop();
  }
  makeBot(index){
    const angle=random(0,Math.PI*2),rad=random(230,900);const x=clamp(WORLD.width/2+Math.cos(angle)*rad,100,WORLD.width-100);const y=clamp(WORLD.height/2+Math.sin(angle)*rad,100,WORLD.height-100);
    const skin=SKINS[Math.floor(Math.random()*SKINS.length)];
    const bot=createWorm({x,y,angle:random(-Math.PI,Math.PI),name:BOT_NAMES[index%BOT_NAMES.length],skin,player:false,mass:this.mode==='giant'?random(60,130):newWormSpawnMass(),ai:index});
    bot.r=random(11,14);bot.think=Math.random();bot.spawnProtectedUntil=this.elapsed+3;return bot;
  }
  spawnFood(x=random(70,WORLD.width-70),y=random(70,WORLD.height-70),forcedType=null){
    const type=forcedType||weightedPick(FOOD_TYPES);
    this.food.push(createFood(x,y,type,Math.random()*6.28));
  }
  spawnPower(){
    const type=POWERUPS[Math.floor(Math.random()*POWERUPS.length)];
    this.powerItems.push({x:random(100,WORLD.width-100),y:random(100,WORLD.height-100),r:19,type,phase:Math.random()*6.28});
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
  pause(){if(this.state==='playing'){this.state='paused';this.onUpdate(this.getStats());}}
  resume(){if(this.state==='paused'){this.state='playing';this.last=performance.now();}}
  setSteering(angle){if(Number.isFinite(angle))this.pointerAngle=angle;}
  setBoost(active){this.boost=!!active;}
  setZoom(value){this.viewZoom=clampZoom(value);return this.viewZoom;}
  zoomBy(delta){return this.setZoom(this.viewZoom+delta);}
  getStats(){return {score:this.totalScore,mass:this.player?.mass||0,length:this.player?segmentsForMass(this.player.mass):0,rank:this.getRank(),time:this.elapsed,kills:this.kills,food:this.foodEaten,coins:this.coinsEarned,gems:this.gemsEarned,timeLeft:this.timeLeft,mode:this.mode,powerups:this.player?.powerups||{},powerupsCollected:this.powerupsCollected};}
  getRank(){if(!this.player)return 0;return 1+this.bots.filter(b=>b.alive&&b.mass>this.player.mass).length;}
  isPowerActive(id){return powerupIsActive(this.player,id,this.elapsed);}
  update(dt){
    this.elapsed+=dt;this.frame++;
    if(this.mode==='time'){this.timeLeft=Math.max(0,180-this.elapsed);if(this.timeLeft<=0){this.end('time');return;}}
    if(this.mode==='battle'){
      this.arenaRadius=Math.max(300,1120-this.elapsed*5.3);
      const d=Math.hypot(this.player.x-WORLD.width/2,this.player.y-WORLD.height/2);
      if(d>this.arenaRadius){this.damagePlayer('arena');if(this.state!=='playing')return;}
    }
    if(this.mode==='survival'&&this.elapsed>45){for(const b of this.bots)b.baseSpeed=Math.min(190,b.baseSpeed+dt*.25);}
    this.updatePlayer(dt);
    for(const bot of this.bots){if(bot.alive)this.updateBot(bot,dt);else if(this.mode!=='battle'&&this.elapsed>bot.respawnAt){const idx=this.bots.indexOf(bot);this.bots[idx]=this.makeBot(idx);}}
    if(this.mode==='battle'&&this.bots.every(bot=>!bot.alive)){this.end('victory');return;}
    this.updateFood();this.updatePowerups();this.updateCoins(dt);this.updateParticles(dt);this.checkCollisions();
    if(this.state!=='playing')return;
    if(this.food.length<650){for(let i=0;i<Math.min(8,650-this.food.length);i++)this.spawnFood();}
    if(this.powerItems.length<15&&Math.random()<dt*.8)this.spawnPower();
    const cameraZoom=this.isPowerActive('zoom')?Math.max(.65,this.viewZoom*.84):this.viewZoom;
    this.camera.follow(this.player,this.canvas,{width:WORLD.width,height:WORLD.height},dt,cameraZoom);
    this.bestMass=Math.max(this.bestMass,this.player.mass);
    if(this.frame%8===0)this.onUpdate(this.getStats());
  }
  steerAwayFromWalls(worm,angle){
    const margin=200;let desired=angle;
    if(worm.x<margin)desired=angleLerp(desired,0,.5);
    if(worm.x>WORLD.width-margin)desired=angleLerp(desired,Math.PI,.5);
    if(worm.y<margin)desired=angleLerp(desired,Math.PI/2,.5);
    if(worm.y>WORLD.height-margin)desired=angleLerp(desired,-Math.PI/2,.5);
    return desired;
  }
  updatePlayer(dt){
    const p=this.player;if(!p)return;
    const useBoost=this.boost&&p.mass>18&&this.elapsed-p.lastDrop>.08;
    if(useBoost){p.mass=Math.max(18,p.mass-dt*5);if(this.elapsed-p.lastDrop>.55){this.spawnFood(p.x-Math.cos(p.angle)*20,p.y-Math.sin(p.angle)*20,{name:'Boost Crumb',emoji:'✨',color:'#fff1a6',value:8,weight:1});p.lastDrop=this.elapsed;}}
    const target=this.steerAwayFromWalls(p,this.pointerAngle);
    updateWormTrail(p,dt,target,WORLD,useBoost);
    this.collectForWorm(p,true);
    expirePowerups(p,this.elapsed);
  }
  updateBot(bot,dt){
    bot.think-=dt;
    if(bot.think<=0){
      bot.think=random(.18,.5);
      bot.targetAngle=chooseBotAngle(bot,[this.player,...this.bots],this.food,WORLD);
    }
    updateWormTrail(bot,dt,bot.targetAngle||bot.angle,WORLD,Math.random()<.006&&bot.mass>24);
    if(!this.isSpawnProtected(bot)&&selfHitsTrail(bot)){this.killBot(bot,false);return;}
    this.collectForWorm(bot,false);
  }
  collectForWorm(worm,isPlayer){
    const magnet=isPlayer&&this.isPowerActive('magnet');
    const range=magnet?180:worm.r+14;
    for(let i=this.food.length-1;i>=0;i--){const f=this.food[i];const d=distance(worm,f);
      if(d<range+(f.r||6)){
        this.food.splice(i,1);const mult=isPlayer&&this.isPowerActive('food')?2:1;const scoreMult=isPlayer&&this.isPowerActive('double')?2:1;
        worm.mass+=foodMassGain(f.type.value,mult);worm.score+=f.type.value*scoreMult;worm.food++;
        if(isPlayer){this.totalScore+=f.type.value*scoreMult;this.foodEaten++;this.coinsEarned+=Math.max(1,Math.round(f.type.value/30));if(this.elapsed%5<.1){this.save.xp+=Math.round(f.type.value/8)*(this.isPowerActive('xp')?2:1);}this.addParticles(f.x,f.y,f.type.color,5);if(this.elapsed-this.lastCollectSound>.12){this.onSound('collect');this.lastCollectSound=this.elapsed;}}
      }
    }
    // Gold fever turns a few regular drops into golden food while active.
    if(isPlayer&&this.isPowerActive('gold')&&Math.random()<.003){this.spawnFood(worm.x+random(-180,180),worm.y+random(-180,180),FOOD_TYPES[15]);}
  }
  updateFood(){
    const livingWorms=[this.player,...this.bots.filter(bot=>bot.alive)].filter(Boolean);
    for(const food of this.food){
      food.phase+=.03;
      let nearest=null,nearestDistance=Infinity,nearestMouth=null;
      for(const worm of livingWorms){
        const mouth=getWormMouthPoint(worm);
        const d=distance(mouth,food);
        if(d<nearestDistance){nearest=worm;nearestDistance=d;nearestMouth=mouth;}
      }
      if(!nearest||!nearestMouth)continue;
      const magnet=nearest.player&&this.isPowerActive('magnet');
      const range=magnet?520:290;
      if(nearestDistance<range)foodAttract(food,nearestMouth,range,magnet?.095:.055);
    }
  }
  updatePowerups(){
    for(let i=this.powerItems.length-1;i>=0;i--){const item=this.powerItems[i];item.phase+=.04;
      if(distance(this.player,item)<this.player.r+item.r){this.powerItems.splice(i,1);activatePowerup(this.player,item.type,this.elapsed);this.powerupsCollected++;if(item.type.id==='xp')this.gemsEarned++;this.onSound('power');this.addParticles(item.x,item.y,item.type.color,18);this.onNotice(`${displayText(item.type.name)} ACTIVATED`);if(this.powerItems.length<9)this.spawnPower();}
    }
  }
  updateCoins(dt){
    const coinMag=this.isPowerActive('coin');
    for(let i=this.coins.length-1;i>=0;i--){const c=this.coins[i];c.life-=dt;if(coinMag&&distance(c,this.player)<230){c.x+=(this.player.x-c.x)*.08;c.y+=(this.player.y-c.y)*.08;}if(distance(c,this.player)<20){this.coinsEarned+=c.value;this.addParticles(c.x,c.y,'#ffda54',6);this.coins.splice(i,1);}else if(c.life<=0)this.coins.splice(i,1);}
  }
  updateParticles(dt){stepParticles(this.particles,dt);}
  bodyCollision(head,owner){return bodyHitsTrail(head,owner);}
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
    const p=this.player;
    // Player self-contact is intentionally non-lethal: only enemy bodies and arena walls can end a run.
    for(const b of this.bots){if(!b.alive)continue;
      if(!canWormsCollide(p,b,this.elapsed))continue;
      if(this.bodyCollision(p,b)){
        if(this.isPowerActive('shield')){delete p.powerups.shield;this.addParticles(p.x,p.y,'#7ceaff',20);this.onNotice('SHIELD BLOCKED A HIT');}
        else {this.end('collision');return;}
      }
      if(this.bodyCollision(b,p)){this.killBot(b,true);continue;}
    }
    // Bot-versus-bot body impacts keep the arena populated and create food bursts.
    if(this.frame%2===0){for(let i=0;i<this.bots.length;i++){const a=this.bots[i];if(!a.alive)continue;for(let j=0;j<this.bots.length;j++){if(i===j)continue;const b=this.bots[j];if(b.alive&&canWormsCollide(a,b,this.elapsed)&&this.bodyCollision(a,b)){this.killBot(a,false);break;}}}}
    if(!this.isSpawnProtected(p)&&(p.x<28||p.y<28||p.x>WORLD.width-28||p.y>WORLD.height-28)){this.end('wall');}
  }
  killBot(bot,credited){
    if(!bot.alive)return;bot.alive=false;bot.respawnAt=this.elapsed+1.4;
    // Death loot follows the exact curve of the defeated worm instead of a circular scatter.
    const drops=Math.min(46,Math.max(10,Math.floor(segmentsForMass(bot.mass)*.78)));
    const trailDrops=trailFoodPositions(bot,drops);
    trailDrops.forEach((point,i)=>this.spawnFood(point.x,point.y,i%11===0?FOOD_TYPES[15]:null));
    this.coins.push({x:bot.x,y:bot.y,value:8+Math.floor(bot.mass/35),life:18});this.addParticles(bot.x,bot.y,bot.skin.a,22);
    if(credited){this.kills++;this.player.kills++;this.onNotice('ENEMY ELIMINATED + COINS');}
  }
  damagePlayer(reason){if(this.isSpawnProtected(this.player)){this.onNotice('SPAWN SHIELD ACTIVE');return;}if(this.isPowerActive('shield')){delete this.player.powerups.shield;this.onNotice('SHIELD BLOCKED ARENA DAMAGE');this.player.x=clamp(this.player.x,WORLD.width/2-this.arenaRadius+60,WORLD.width/2+this.arenaRadius-60);this.player.y=clamp(this.player.y,WORLD.height/2-this.arenaRadius+60,WORLD.height/2+this.arenaRadius-60);}else this.end(reason);}
  end(reason){
    if(this.state!=='playing')return;
    this.state='gameover';this.boost=false;
    const summary={score:this.totalScore,mass:this.player.mass,length:segmentsForMass(this.player.mass),time:this.elapsed,kills:this.kills,food:this.foodEaten,coins:this.coinsEarned,powerups:this.powerupsCollected,reason,mode:this.mode};
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
  render(now){
    if(!this.ctx)return;const ctx=this.ctx,w=this.cssWidth,h=this.cssHeight;
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=this.currentTheme?.bg||'#92c96b';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    const dpr=Math.min(window.devicePixelRatio||1,2);ctx.setTransform(dpr,0,0,dpr,0,0);
    const camera=this.player?this.camera:{x:WORLD.width/2,y:WORLD.height/2};
    const zoom=this.isPowerActive('zoom')?Math.max(.65,this.viewZoom*.84):this.viewZoom;
    ctx.save();ctx.translate(w/2-camera.x*zoom,h/2-camera.y*zoom);ctx.scale(zoom,zoom);
    this.drawArena(ctx);
    // Food items use vector graphics plus emoji for recognizable variety.
    for(const f of this.food){const pulse=1+Math.sin(now*.003+f.phase)*.08;const foodStyle=this.save?.workshop?.foodStyle||'classic';ctx.save();ctx.translate(f.x,f.y);ctx.scale(pulse,pulse);if(foodStyle==='sparkle'){ctx.shadowBlur=13;ctx.shadowColor='#fff4a8';}if(foodStyle==='fruit party'){ctx.beginPath();ctx.arc(0,0,f.r+4,0,Math.PI*2);ctx.fillStyle='rgba(255,111,178,.25)';ctx.fill();}ctx.beginPath();ctx.arc(0,2,f.r+2,0,Math.PI*2);ctx.fillStyle='rgba(48,67,42,.16)';ctx.fill();ctx.beginPath();ctx.arc(0,0,f.r,0,Math.PI*2);ctx.fillStyle=f.type.color;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.stroke();ctx.font=`${Math.max(10,f.r*1.45)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(f.type.emoji,0,1);ctx.restore();}
    for(const c of this.coins){ctx.beginPath();ctx.arc(c.x,c.y,9,0,Math.PI*2);ctx.fillStyle='#ffcf42';ctx.fill();ctx.strokeStyle='#fff2a6';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#946117';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('$',c.x,c.y+4);}
    for(const item of this.powerItems){const bob=Math.sin(now*.004+item.phase)*5;ctx.save();ctx.translate(item.x,item.y+bob);ctx.shadowBlur=16;ctx.shadowColor=item.type.color;ctx.beginPath();ctx.arc(0,0,item.r+3,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.86)';ctx.fill();ctx.beginPath();ctx.arc(0,0,item.r,0,Math.PI*2);ctx.fillStyle=item.type.color;ctx.fill();ctx.font='20px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(displayText(item.type.icon),0,1);ctx.restore();}
    for(const bot of this.bots)if(bot.alive){drawWorm(ctx,bot,bot.skin,now,zoom);this.drawSpawnShield(ctx,bot,now);}
    if(this.player){drawWorm(ctx,this.player,this.player.skin,now,zoom);this.drawSpawnShield(ctx,this.player,now);ctx.save();ctx.font='17px system-ui';ctx.textAlign='center';ctx.fillText(this.save?.workshop?.emoji||'🐛',this.player.x+29,this.player.y-24);ctx.restore();}
    if(this.save?.workshop?.particles!==false){for(const p of this.particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();}}ctx.globalAlpha=1;
    if(this.mode==='battle'){ctx.beginPath();ctx.arc(WORLD.width/2,WORLD.height/2,this.arenaRadius,0,Math.PI*2);ctx.strokeStyle='rgba(255,70,70,.8)';ctx.lineWidth=5;ctx.setLineDash([16,12]);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
    if(this.state==='menu')this.drawIdle(ctx,w,h,now);
    if(this.state==='paused'){ctx.fillStyle='rgba(15,29,37,.48)';ctx.fillRect(0,0,w,h);}
  }
  drawArena(ctx){
    const theme=this.currentTheme||THEMES[0];ctx.fillStyle=theme.bg;ctx.fillRect(0,0,WORLD.width,WORLD.height);
    ctx.strokeStyle=theme.grid;ctx.lineWidth=1;ctx.globalAlpha=.35;
    for(let x=0;x<=WORLD.width;x+=90){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD.height);ctx.stroke();}
    for(let y=0;y<=WORLD.height;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD.width,y);ctx.stroke();}ctx.globalAlpha=1;
    // Sparse decorative meadow details are deterministic and cheap to draw.
    for(let i=0;i<150;i++){const x=(i*197+73)%WORLD.width,y=(i*313+119)%WORLD.height;ctx.fillStyle=i%3===0?'rgba(255,255,255,.22)':'rgba(44,110,50,.17)';ctx.beginPath();ctx.arc(x,y,i%5===0?4:2,0,Math.PI*2);ctx.fill();}
    // Thick inset frame keeps all four edges visible instead of clipping half the stroke off-screen.
    ctx.save();ctx.shadowBlur=24;ctx.shadowColor='#fff36a';ctx.strokeStyle='#ffe84a';ctx.lineWidth=42;ctx.strokeRect(24,24,WORLD.width-48,WORLD.height-48);
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(13,71,43,.98)';ctx.lineWidth=7;ctx.strokeRect(48,48,WORLD.width-96,WORLD.height-96);
    ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=3;ctx.strokeRect(54,54,WORLD.width-108,WORLD.height-108);ctx.restore();
  }
  drawIdle(ctx,w,h,now){
    ctx.save();ctx.translate(w/2,h/2);ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.arc(0,0,Math.min(w,h)*.29,0,Math.PI*2);ctx.fill();
    const t=now*.0004;for(let i=0;i<8;i++){const a=t+i*Math.PI/4,x=Math.cos(a)*Math.min(w,h)*.18,y=Math.sin(a)*Math.min(w,h)*.18;ctx.beginPath();ctx.arc(x,y,12+Math.sin(t*4+i)*3,0,Math.PI*2);ctx.fillStyle=['#ff9b50','#72d9a0','#73c8ff','#f3db54'][i%4];ctx.fill();}
    ctx.restore();
  }
}
