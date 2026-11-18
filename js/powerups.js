export function activatePowerup(worm, powerup, elapsed) {
  worm.powerups[powerup.id] = elapsed + powerup.duration / 1000;
  if(powerup.id==='multiplier')worm.powerups.multiplierValue=Math.random()<.25?5:2;
  if(powerup.id==='double')worm.powerups.doubleValue=2;
  return worm.powerups[powerup.id];
}
export function expirePowerups(worm, elapsed) {
  for (const id of Object.keys(worm.powerups)) {
    if(id.endsWith('Value'))continue;
    if (worm.powerups[id] && worm.powerups[id] <= elapsed) {
      delete worm.powerups[id];
      if(id==='multiplier')delete worm.powerups.multiplierValue;
      if(id==='double')delete worm.powerups.doubleValue;
    }
  }
}
export function powerupIsActive(worm, id, elapsed) {
  return Boolean(worm?.powerups?.[id] > elapsed);
}

export function getPowerupTimeLeft(expiry, elapsed) {
  return Math.max(0, Math.ceil(Number(expiry) - Number(elapsed)));
}
