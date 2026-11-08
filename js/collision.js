export function bodyHitsTrail(head, owner) {
  for (let i = 14; i < owner.trail.length; i += 4) {
    const point = owner.trail[i];
    if (Math.hypot(head.x - point.x, head.y - point.y) < (head.r || 12) + owner.r * .78) return true;
  }
  return false;
}
export function selfHitsTrail(worm) {
  for (let i = 22; i < worm.trail.length; i += 5) {
    const point = worm.trail[i];
    if (Math.hypot(worm.x - point.x, worm.y - point.y) < worm.r * 1.25) return true;
  }
  return false;
}
