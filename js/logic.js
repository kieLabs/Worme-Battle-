export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function displayText(value) {
  const source=String(value??'').replace(/<[^>]*>/g,'');
  return source.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(match,entity)=>{
    const key=entity.toLowerCase();
    if(key==='amp')return '&'; if(key==='lt')return '<'; if(key==='gt')return '>'; if(key==='quot')return '"'; if(key==='apos')return "'";
    const code=key.startsWith('#x')?parseInt(key.slice(2),16):Number(key.slice(1));
    try{return Number.isFinite(code)&&code>=0&&code<=0x10ffff?String.fromCodePoint(code):'';}catch{return '';}
  });
}
export const clampZoom = value => clamp(Number(value) || 1, 0.65, 1.65);
export const spawnProtectionRemaining = (worm, elapsed) => Math.max(0, (worm?.spawnProtectedUntil || 0) - elapsed);
export const canWormsCollide = (a, b, elapsed) => spawnProtectionRemaining(a, elapsed) <= 0 && spawnProtectionRemaining(b, elapsed) <= 0;
export const getTouchControlSide = (clientX, left, width) => clientX < left + width / 2 ? 'steer' : 'boost';
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const normalizeAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const angleLerp = (from, to, amount) => from + normalizeAngle(to - from) * amount;
export const circleHit = (a, b, padding = 0) => distance(a, b) < (a.r || 0) + (b.r || 0) + padding;
export const random = (min, max, rng = Math.random) => min + (max - min) * rng();
export const formatNumber = value => Math.floor(value || 0).toLocaleString('en-IN');
export const segmentsForMass = mass => Math.max(12, Math.floor(12 + Math.sqrt(Math.max(0, mass)) * 1.5));
export const MASS_PER_FOOD_POINT = 0.01;
export const foodMassGain = (value, multiplier = 1) => Math.max(0, Number(value) || 0) * MASS_PER_FOOD_POINT * Math.max(0, Number(multiplier) || 0);
export const rewardedAdCompleted = result => result === true || result?.rewarded === true;
export function weightedPick(items, rng = Math.random) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) { roll -= item.weight; if (roll <= 0) return item; }
  return items[items.length - 1];
}
export function makeDefaultSave() {
  return {
    version: 1, username: 'Player', coins: 250, xp: 0, selectedSkin: 0, unlockedSkins: [0,1,2,3],
    selectedTheme: 'meadow', unlockedThemes: ['meadow'], gamesPlayed: 0, totalFood: 0, totalKills: 0,
    bestScore: 0, longestWorm: 0, bestTime: 0, totalScore: 0, missions: {}, achievements: [],
    lastDailyClaim: '', dailyStreak: 0, settings: {sound:true,music:true,quality:'auto',joystick:true},
    workshop: {foodStyle:'classic',particles:true,emoji:'😎'}
  };
}

export const wormRadiusForMass = mass => clamp(8 + Math.sqrt(Math.max(1, Number(mass) || 1)) * 1.2, 10, 42);
export const newWormSpawnMass = (roll = Math.random()) => 14 + clamp(Number(roll) || 0, 0, 1) * 20;
export function trailFoodPositions(worm, count) {
  const trail = Array.isArray(worm?.trail) ? worm.trail : [];
  if (!trail.length || count <= 0) return [];
  const positions = [];
  for (let i = 0; i < count; i++) {
    const index = Math.min(trail.length - 1, Math.round((i / Math.max(1, count - 1)) * (trail.length - 1)));
    const point = trail[index];
    positions.push({ x: point.x, y: point.y });
  }
  return positions;
}
