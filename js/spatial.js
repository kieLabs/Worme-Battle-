// Uniform spatial hash for nearby food, potions, and AI perception queries.
export class SpatialHash {
  constructor(cellSize = 240) { this.cellSize = Math.max(16, Number(cellSize) || 240); this.cells = new Map(); this.items = []; }
  key(x, y) { return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`; }
  clear() { this.cells.clear(); this.items = []; }
  insert(item) {
    if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.y)) return;
    const key = this.key(item.x, item.y);
    let bucket = this.cells.get(key); if (!bucket) this.cells.set(key, bucket = []);
    bucket.push(item); this.items.push(item);
  }
  rebuild(items = []) { this.clear(); for (const item of items) this.insert(item); return this; }
  query(x, y, radius = this.cellSize) {
    const minX = Math.floor((x - radius) / this.cellSize), maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize), maxY = Math.floor((y + radius) / this.cellSize);
    const out = [];
    for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) {
      const bucket = this.cells.get(`${cx},${cy}`); if (!bucket) continue;
      for (const item of bucket) if (Math.hypot(item.x - x, item.y - y) <= radius) out.push(item);
    }
    return out;
  }
}
