import { angleTo, angleLerp, random } from './logic.js';

// Lightweight rival steering: collect food, avoid nearby worms and bias away from the arena edges.
export function chooseBotAngle(bot, rivals, food, world) {
  let target = null, best = Infinity;
  for (let i = 0; i < food.length; i += 2) {
    const f = food[i];
    const d = (f.x - bot.x) ** 2 + (f.y - bot.y) ** 2;
    if (d < best) { best = d; target = f; }
  }
  let angle = target ? angleTo(bot, target) : bot.angle + random(-.8, .8);
  for (const other of rivals) {
    if (!other || other === bot || !other.alive) continue;
    const d = Math.hypot(bot.x - other.x, bot.y - other.y);
    if (d < 150) {
      const dangerous = other.mass > bot.mass * .65;
      const away = angleTo(other, bot);
      angle = angleLerp(angle, away, dangerous ? .8 : .25);
    }
  }
  const margin = 200;
  if (bot.x < margin) angle = angleLerp(angle, 0, .5);
  if (bot.x > world.width - margin) angle = angleLerp(angle, Math.PI, .5);
  if (bot.y < margin) angle = angleLerp(angle, Math.PI / 2, .5);
  if (bot.y > world.height - margin) angle = angleLerp(angle, -Math.PI / 2, .5);
  return angle;
}
