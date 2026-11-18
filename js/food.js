export function createFood(x, y, type, phase = Math.random() * Math.PI * 2) {
  // Small energy orbs intentionally roll between +1 and +5 score points.
  const actualType = type?.name === 'Energy Orb'
    ? { ...type, value: 1 + Math.floor(Math.random() * 5) }
    : type;
  return { x, y, r: actualType.value > 35 ? 12 : 7 + Math.min(5, actualType.value / 12), type: actualType, phase };
}
export function getWormMouthPoint(worm) {
  const offset = Math.max(8, (worm.r || 12) * .9);
  return { x: worm.x + Math.cos(worm.angle || 0) * offset, y: worm.y + Math.sin(worm.angle || 0) * offset };
}

export function foodAttract(food, target, radius, strength = .04) {
  const d = Math.hypot(target.x - food.x, target.y - food.y);
  if (d < radius && d > 18) {
    food.x += (target.x - food.x) * strength;
    food.y += (target.y - food.y) * strength;
  }
  return d;
}
