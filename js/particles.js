import { random } from './logic.js';
export function createParticleBurst(x, y, color, count = 8) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = random(0, Math.PI * 2), speed = random(25, 150), life = random(.35, .8);
    out.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, max: .8, color, r: random(2, 5) });
  }
  return out;
}
export function stepParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
