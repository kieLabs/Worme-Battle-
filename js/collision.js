export function bodyHitsTrail(head, owner, spatialGrid = null) {
  // A worm head is never a valid collision target for its own body.
  // Compare stable identity as well as object identity: snapshots/wrappers of
  // the same worm must never be mistaken for a rival worm.
  if (!head || !owner || head === owner || (head.id && owner.id && head.id === owner.id)) return false;
  const threshold=(head.r||12)+owner.r*.78;
  if(spatialGrid){
    return spatialGrid.query(head.x,head.y,threshold).some(point=>Math.hypot(head.x-point.x,head.y-point.y)<threshold);
  }
  for (let i = 14; i < owner.trail.length; i += 4) {
    const point = owner.trail[i];
    if (Math.hypot(head.x - point.x, head.y - point.y) < threshold) return true;
  }
  return false;
}
export function touchesWorldWall(worm, world, margin = 24) {
  if (Number.isFinite(world?.arenaRadius)) {
    const cx = Number.isFinite(world.centerX) ? world.centerX : world.width / 2;
    const cy = Number.isFinite(world.centerY) ? world.centerY : world.height / 2;
    return Math.hypot(worm.x - cx, worm.y - cy) >= world.arenaRadius - margin;
  }
  return worm.x <= margin || worm.y <= margin ||
    worm.x >= world.width - margin || worm.y >= world.height - margin;
}
