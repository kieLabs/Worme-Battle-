import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, distance, normalizeAngle, angleTo, circleHit, segmentsForMass, weightedPick, makeDefaultSave, formatNumber } from '../js/logic.js';

test('clamp keeps a value inside both boundaries',()=>{
  assert.equal(clamp(12,0,10),10);
  assert.equal(clamp(-2,0,10),0);
  assert.equal(clamp(5,0,10),5);
});

test('distance and angle helpers calculate geometry correctly',()=>{
  assert.equal(distance({x:0,y:0},{x:3,y:4}),5);
  assert.equal(angleTo({x:0,y:0},{x:0,y:2}),Math.PI/2);
  assert.ok(Math.abs(normalizeAngle(Math.PI*3)-Math.PI)<1e-10);
});

test('circle collision includes both radii and optional padding',()=>{
  assert.equal(circleHit({x:0,y:0,r:5},{x:9,y:0,r:5}),true);
  assert.equal(circleHit({x:0,y:0,r:5},{x:11,y:0,r:5}),false);
  assert.equal(circleHit({x:0,y:0,r:5},{x:11,y:0,r:5},2),true);
});

test('worm segments grow with mass and have a starter body',()=>{
  assert.equal(segmentsForMass(0),12);
  assert.ok(segmentsForMass(100)>segmentsForMass(25));
  assert.ok(segmentsForMass(10000)>segmentsForMass(100));
});

test('weighted pick can deterministically select from weighted items',()=>{
  const items=[{id:'a',weight:1},{id:'b',weight:3}];
  assert.equal(weightedPick(items,()=>0).id,'a');
  assert.equal(weightedPick(items,()=>.99).id,'b');
});

test('default save contains persistent profile and gameplay state',()=>{
  const save=makeDefaultSave();
  assert.equal(save.version,1);
  assert.ok(save.unlockedSkins.includes(0));
  assert.equal(save.coins,250);
  assert.equal(save.settings.joystick,true);
});

test('number formatting is safe for missing and fractional score values',()=>{
  assert.equal(formatNumber(1234.8),'1,234');
  assert.equal(formatNumber(undefined),'0');
});

test('zoom level is clamped to a useful mobile and desktop range', async()=>{
  const {clampZoom}=await import('../js/logic.js');
  assert.equal(clampZoom(0.1),0.65);
  assert.equal(clampZoom(3),1.65);
  assert.equal(clampZoom(1.2),1.2);
});

test('spawn protection lasts exactly three seconds and suppresses collisions involving either protected worm', async()=>{
  const {spawnProtectionRemaining,canWormsCollide}=await import('../js/logic.js');
  const fresh={spawnProtectedUntil:3};
  const veteran={spawnProtectedUntil:0};
  assert.equal(spawnProtectionRemaining(fresh,0),3);
  assert.equal(canWormsCollide(fresh,veteran,2.99),false);
  assert.equal(canWormsCollide(fresh,veteran,3),true);
  assert.equal(canWormsCollide(veteran,veteran,3),true);
});

test('touch input splits the screen into left steering and right boost zones', async()=>{
  const {getTouchControlSide}=await import('../js/logic.js');
  assert.equal(getTouchControlSide(120,0,400),'steer');
  assert.equal(getTouchControlSide(200,0,400),'boost');
  assert.equal(getTouchControlSide(390,0,400),'boost');
});

test('worm body radius scales visibly with mass while fresh worms start small', async()=>{
  const {wormRadiusForMass,newWormSpawnMass}=await import('../js/logic.js');
  assert.ok(wormRadiusForMass(100)>wormRadiusForMass(25)+2);
  assert.ok(wormRadiusForMass(10000)>wormRadiusForMass(100)+8);
  assert.ok(wormRadiusForMass(1)>=10);
  assert.ok(newWormSpawnMass(0)>=14);
  assert.ok(newWormSpawnMass(1)<=34);
  assert.ok(newWormSpawnMass(.5)<40);
});

test('death food positions follow the defeated worm trail curve', async()=>{
  const {trailFoodPositions}=await import('../js/logic.js');
  const worm={trail:[{x:0,y:0},{x:10,y:20},{x:20,y:40},{x:30,y:60}]};
  const drops=trailFoodPositions(worm,3);
  assert.deepEqual(drops,[{x:0,y:0},{x:20,y:40},{x:30,y:60}]);
  assert.deepEqual(trailFoodPositions({trail:[]},4),[]);
});

test('display text decodes HTML entities and strips markup instead of showing code',async()=>{
  const {displayText}=await import('../js/logic.js');
  assert.equal(displayText('&#x1F9F2; <b>MAGNET</b> &amp; SHIELD'),'🧲 MAGNET & SHIELD');
});

test('normal food growth uses a slower mass conversion while FEAST remains a temporary multiplier',async()=>{
  const {foodMassGain}=await import('../js/logic.js');
  assert.ok(Math.abs(foodMassGain(20)-0.2)<1e-10);
  assert.ok(Math.abs(foodMassGain(20,2)-0.4)<1e-10);
});

test('rewarded continue only succeeds after the ad provider confirms a reward',async()=>{
  const {rewardedAdCompleted}=await import('../js/logic.js');
  assert.equal(rewardedAdCompleted(true),true);
  assert.equal(rewardedAdCompleted({rewarded:true}),true);
  assert.equal(rewardedAdCompleted(false),false);
  assert.equal(rewardedAdCompleted({closed:true}),false);
});

test('normal food growth is gradual and FEAST only doubles the reduced base gain',async()=>{
  const {foodMassGain}=await import('../js/logic.js');
  assert.ok(Math.abs(foodMassGain(20)-0.2)<1e-10);
  assert.ok(Math.abs(foodMassGain(20,2)-0.4)<1e-10);
});


test('normal worm growth uses exactly 0.01 mass per food point and FEAST doubles only that base',async()=>{
  const {MASS_PER_FOOD_POINT,foodMassGain}=await import('../js/logic.js');
  assert.equal(MASS_PER_FOOD_POINT,0.01);
  assert.ok(Math.abs(foodMassGain(50)-0.5)<1e-10);
  assert.ok(Math.abs(foodMassGain(50,2)-1)<1e-10);
});
