export function activatePowerup(worm, powerup, elapsed) {
  worm.powerups[powerup.id] = elapsed + powerup.duration / 1000;
  return worm.powerups[powerup.id];
}
export function expirePowerups(worm, elapsed) {
  for (const id of Object.keys(worm.powerups)) {
    if (worm.powerups[id] && worm.powerups[id] <= elapsed) delete worm.powerups[id];
  }
}
export function powerupIsActive(worm, id, elapsed) {
  return Boolean(worm?.powerups?.[id] > elapsed);
}

export function getPowerupTimeLeft(expiry, elapsed) {
  return Math.max(0, Math.ceil(Number(expiry) - Number(elapsed)));
}
