export function createFood(x, y, type, phase = Math.random() * Math.PI * 2) {
  return { x, y, r: type.value > 35 ? 12 : 7 + Math.min(5, type.value / 12), type, phase };
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
