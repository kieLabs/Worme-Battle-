import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseBotAngle } from '../js/ai.js';
import { createFood, foodAttract, getWormMouthPoint } from '../js/food.js';
import { bodyHitsTrail, touchesWorldWall } from '../js/collision.js';
import { activatePowerup, expirePowerups, powerupIsActive } from '../js/powerups.js';
import { createParticleBurst, stepParticles } from '../js/particles.js';
import { MISSIONS } from '../js/missions.js';
import { ACHIEVEMENTS } from '../js/achievements.js';
import { purchaseSkin, purchaseTheme } from '../js/shop.js';

test('food drops retain their value and move toward the worm mouth, not its center',()=>{
  const food=createFood(0,0,{value:20,color:'#f00'},0);
  assert.equal(food.r,8.666666666666666);
  const worm={x:100,y:0,angle:0,r:20};
  const mouth=getWormMouthPoint(worm);
  assert.ok(mouth.x>100);
  const before=food.x;
  assert.ok(foodAttract(food,mouth,150,.1)<150);
  assert.ok(food.x>before);
});

test('AI steering returns a finite direction toward food or away from a nearby rival',()=>{
  const bot={x:500,y:500,angle:0,mass:20,alive:true};
  const result=chooseBotAngle(bot,[bot], [{x:600,y:500}], {width:1000,height:1000});
  assert.ok(Number.isFinite(result));
  assert.ok(Math.abs(result)<.1);
});

test('body and self collision checks detect trail intersections but ignore distant trails',()=>{
  const owner={x:0,y:0,r:12,trail:Array.from({length:60},(_,i)=>({x:100+i,y:100}))};
  assert.equal(bodyHitsTrail({x:114,y:100,r:12},owner),true);
  assert.equal(bodyHitsTrail({x:0,y:0,r:12},owner),false);
});

test('power-ups activate, expire and stop applying after their timer',()=>{
  const worm={powerups:{}};
  activatePowerup(worm,{id:'magnet',duration:5000},10);
  assert.equal(powerupIsActive(worm,'magnet',12),true);
  expirePowerups(worm,16);
  assert.equal(powerupIsActive(worm,'magnet',16),false);
});

test('particle bursts are updated and expired particles are removed',()=>{
  const particles=createParticleBurst(10,10,'#fff',4);
  assert.equal(particles.length,4);
  stepParticles(particles,2);
  assert.equal(particles.length,0);
});

test('mission and achievement catalogs include the requested progression systems',()=>{
  assert.ok(MISSIONS.some(m=>m.id==='power3'));
  assert.ok(ACHIEVEMENTS.some(a=>a.id==='champion'));
});

test('shop purchases check coin balance and then unlock cosmetics',()=>{
  const save={coins:100,unlockedSkins:[0],selectedSkin:0,unlockedThemes:['meadow'],selectedTheme:'meadow'};
  assert.equal(purchaseSkin(save,{id:1,price:150}),'insufficient');
  assert.equal(purchaseSkin(save,{id:1,price:80}),'purchased');
  assert.equal(save.coins,20);
  assert.ok(save.unlockedSkins.includes(1));
  assert.equal(purchaseTheme(save,{id:'ocean',price:50}),'insufficient');
});

test('camera uses CSS-pixel viewport dimensions rather than high-DPI canvas backing dimensions',async()=>{
  const {Camera}=await import('../js/camera.js');
  const camera=new Camera();
  camera.follow({x:400,y:100},{width:1920,height:1080,clientWidth:960,clientHeight:540},{width:3200,height:2400},1,1);
  assert.equal(camera.x,480);
  assert.equal(camera.y,270);
});

test('camera centers the world when the viewport is larger than the world',async()=>{
  const {Camera}=await import('../js/camera.js');
  const camera=new Camera();
  camera.follow({x:100,y:100},{width:4000,height:2600,clientWidth:4000,clientHeight:2600},{width:3200,height:2400},1,1);
  assert.equal(camera.x,1600);
  assert.equal(camera.y,1200);
});

test('holding boost increases worm travel speed and releasing it restores normal speed',async()=>{
  const {createWorm,updateWormTrail}=await import('../js/worm.js');
  const normal=createWorm({x:100,y:100,angle:0,mass:40,player:true});
  const boosted=createWorm({x:100,y:100,angle:0,mass:40,player:true});
  updateWormTrail(normal,.1,0,{width:1000,height:1000},false);
  updateWormTrail(boosted,.1,0,{width:1000,height:1000},true);
  const normalDistance=normal.x-100;
  const boostedDistance=boosted.x-100;
  assert.ok(boostedDistance>normalDistance*1.7);
  assert.ok(Math.abs(normalDistance-15)<0.01);
});

test('active power-ups expose a positive countdown in seconds',async()=>{
  const {getPowerupTimeLeft}=await import('../js/powerups.js');
  assert.equal(getPowerupTimeLeft(17.8,10),8);
  assert.equal(getPowerupTimeLeft(9,10),0);
});

test('zoom power pickup exists and is timed',async()=>{
  const {POWERUPS}=await import('../js/config.js');
  const zoom=POWERUPS.find(power=>power.id==='zoom');
  assert.ok(zoom);
  assert.equal(zoom.duration,9000);
});

test('a rewarded revive resumes the same worm at its death location with temporary protection',async()=>{
  const {Game}=await import('../js/game.js');
  const game=Object.create(Game.prototype);
  Object.assign(game,{state:'gameover',elapsed:42,boost:true,last:0,player:{x:321,y:654,spawnProtectedUntil:0},lastSummary:{reason:'collision'},runFinalized:false,onUpdate:()=>{},onNotice:()=>{},getStats:()=>({score:123})});
  assert.equal(game.continueAfterReward(),true);
  assert.equal(game.state,'playing');
  assert.equal(game.player.x,321);
  assert.equal(game.player.y,654);
  assert.equal(game.player.spawnProtectedUntil,46);
  assert.equal(game.boost,false);
  assert.equal(game.lastSummary,null);
});

test('finalizing a run commits its rewards once, not when a revive is offered',async()=>{
  const {Game}=await import('../js/game.js');
  const game=Object.create(Game.prototype);
  const save={gamesPlayed:0,totalFood:0,totalKills:0,totalScore:0,coins:0,xp:0,bestScore:0,longestWorm:0,bestTime:0};
  Object.assign(game,{state:'gameover',save,player:{mass:30},foodEaten:4,kills:2,totalScore:100,coinsEarned:10,elapsed:20,lastSummary:{score:100,mass:30,length:20,time:20,kills:2,food:4,coins:10},runFinalized:false});
  assert.ok(game.finalizeRun());
  assert.equal(game.finalizeRun(),null);
  assert.equal(save.gamesPlayed,1);
  assert.equal(save.totalScore,100);
  assert.equal(save.coins,10);
});


test('game-over markup supports stacked portrait and side-by-side landscape actions',async()=>{
  const {readFile}=await import('node:fs/promises');
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
  assert.match(html,/class="modal-card gameover-card"/);
  assert.match(html,/id="continue-ad-button"/);
  assert.match(css,/grid-template-areas:"summary actions"/);
  assert.match(css,/\.live-score-list\{height:220px/);
});


test('enemy worms are not eliminated for touching their own trail, only world-edge contact is a wall hit',async()=>{
  const worm={x:100,y:100,r:12,trail:[{x:100,y:100},{x:102,y:100}]};
  assert.equal(touchesWorldWall(worm,{width:1000,height:800}),false);
  assert.equal(touchesWorldWall({...worm,x:24},{width:1000,height:800}),true);
  assert.equal(touchesWorldWall({...worm,y:776},{width:1000,height:800}),true);
  const gameSource=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../js/game.js',import.meta.url),'utf8'));
  assert.doesNotMatch(gameSource,/selfHitsTrail\(bot\)/);
});

test('enemy name labels are rendered at every zoom level',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../js/worm.js',import.meta.url),'utf8');
  assert.match(source,/if\(worm\.name\)/);
  assert.doesNotMatch(source,/worm\.player \|\| zoom/);
});

test('a worm can never collide with its own trail, even when the head overlaps it',()=>{
  const worm={x:100,y:100,r:20,trail:Array.from({length:80},()=>({x:100,y:100}))};
  assert.equal(bodyHitsTrail(worm,worm),false);
});

test('bot names stay human-readable and unique when the bot count exceeds the name catalog',async()=>{
  const {Game}=await import('../js/game.js');
  const game=Object.create(Game.prototype);
  Object.assign(game,{mode:'classic',elapsed:0});
  const first=game.makeBot(0), repeated=game.makeBot(40);
  assert.ok(first.name && !/[<>]/.test(first.name));
  assert.notEqual(first.name,repeated.name);
});

test('player and bot body radius and trail capacity grow as mass increases',async()=>{
  const {createWorm,updateWormTrail}=await import('../js/worm.js');
  const {wormRadiusForMass,segmentsForMass}=await import('../js/logic.js');
  for (const player of [true,false]) {
    const worm=createWorm({x:500,y:500,angle:0,mass:30,player});
    const initialSegments=segmentsForMass(worm.mass);
    worm.mass=900;
    updateWormTrail(worm,.016,0,{width:2000,height:2000});
    assert.ok(wormRadiusForMass(worm.mass)>wormRadiusForMass(30));
    assert.ok(Math.max(40,segmentsForMass(worm.mass)*5+20)>initialSegments*5+20);
  }
});

test('same worm identity can never be treated as a rival collision target',()=>{
  const worm={id:'worm-identity',x:100,y:100,r:16,trail:Array.from({length:80},()=>({x:100,y:100}))};
  const headSnapshot={...worm};
  assert.equal(bodyHitsTrail(headSnapshot,worm),false);
});

test('enemy survives self-overlapping trail but dies when its head enters a rival body',async()=>{
  const {Game}=await import('../js/game.js');
  const game=Object.create(Game.prototype);
  const player={id:'player',x:1000,y:1000,r:12,mass:30,trail:Array.from({length:80},(_,i)=>({x:1000+i,y:1000})),spawnProtectedUntil:0};
  const selfCrossingBot={id:'bot-self',x:400,y:400,r:12,mass:30,alive:true,trail:Array.from({length:80},()=>({x:400,y:400})),spawnProtectedUntil:0};
  Object.assign(game,{player,bots:[selfCrossingBot],elapsed:5,frame:1,state:'playing',isSpawnProtected:()=>false,isPowerActive:()=>false,addParticles:()=>{},onNotice:()=>{},killBot:bot=>{bot.alive=false;},end:reason=>{game.endReason=reason;}});
  game.checkCollisions();
  assert.equal(selfCrossingBot.alive,true);

  player.trail=Array.from({length:80},(_,i)=>({x:i===22?400:1000+i,y:i===22?400:1000}));
  game.checkCollisions();
  assert.equal(selfCrossingBot.alive,false);
});

test('AI enemies use readable human first names, with unique suffixes beyond the catalog',async()=>{
  const {BOT_NAMES}=await import('../js/config.js');
  assert.ok(BOT_NAMES.includes('Alex'));
  assert.ok(BOT_NAMES.includes('Sophia'));
  const {Game}=await import('../js/game.js');
  const game=Object.create(Game.prototype);
  Object.assign(game,{mode:'classic',elapsed:0});
  const first=game.makeBot(0), repeated=game.makeBot(BOT_NAMES.length);
  assert.match(first.name,/^[A-Z][a-z]+$/);
  assert.notEqual(first.name,repeated.name);
});

test('food eaten by either player or AI visibly increases body thickness and length',async()=>{
  const {wormRadiusForMass,segmentsForMass}=await import('../js/logic.js');
  const baseRadius=wormRadiusForMass(30,0),fedRadius=wormRadiusForMass(30.2,1);
  const baseLength=segmentsForMass(30,0),fedLength=segmentsForMass(30.2,4);
  assert.ok(fedRadius>=baseRadius+0.1);
  assert.ok(fedLength>baseLength);
});

test('player and AI gain body growth each time they consume food',async()=>{
  const {Game}=await import('../js/game.js');
  const game=Object.create(Game.prototype);
  const meal={x:100,y:100,r:5,type:{value:20,color:'#ff5555'}};
  Object.assign(game,{food:[{...meal}],elapsed:2,lastCollectSound:0,totalScore:0,foodEaten:0,coinsEarned:0,save:{xp:0},isPowerActive:()=>false,addParticles:()=>{},onSound:()=>{}});
  const player={x:100,y:100,r:14,mass:30,food:0,score:0};
  game.collectForWorm(player,true);
  assert.equal(player.food,1);
  assert.ok(Math.abs(player.mass-30.2)<1e-10);

  game.food=[{...meal}];
  const enemy={x:100,y:100,r:14,mass:30,food:0,score:0};
  game.collectForWorm(enemy,false);
  assert.equal(enemy.food,1);
  assert.ok(Math.abs(enemy.mass-30.2)<1e-10);
});

test('AI is eliminated at the arena wall and the death is recorded as a wall hit',async()=>{
  const {Game}=await import('../js/game.js');
  const {createWorm}=await import('../js/worm.js');
  const game=Object.create(Game.prototype);
  const bot=createWorm({x:24,y:300,angle:Math.PI,name:'WallBot',mass:30});
  bot.targetAngle=Math.PI;bot.think=1;
  Object.assign(game,{elapsed:5,isSpawnProtected:()=>false,collectForWorm:()=>{},killBot:(worm,_credited,reason)=>{worm.alive=false;worm.deathReason=reason;}});
  game.updateBot(bot,.016);
  assert.equal(bot.alive,false);
  assert.equal(bot.deathReason,'wall');
});
