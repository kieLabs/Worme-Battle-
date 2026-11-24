export function bodyHitsTrail(head, owner) {
  // A worm head is never a valid collision target for its own body.
  // Compare stable identity as well as object identity: snapshots/wrappers of
  // the same worm must never be mistaken for a rival worm.
  if (!head || !owner || head === owner || (head.id && owner.id && head.id === owner.id)) return false;
  for (let i = 14; i < owner.trail.length; i += 4) {
    const point = owner.trail[i];
    if (Math.hypot(head.x - point.x, head.y - point.y) < (head.r || 12) + owner.r * .78) return true;
  }
  return false;
}
export function touchesWorldWall(worm, world, margin = 24) {
  return worm.x <= margin || worm.y <= margin ||
    worm.x >= world.width - margin || worm.y >= world.height - margin;
}
