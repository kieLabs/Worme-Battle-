import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('home screen does not expose an install button', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.doesNotMatch(html, /install-app-button|INSTALL APP/i);
  assert.match(html, /data-view="profile"/);
});

test('PWA manifest has standalone display, relative scope and both required icon sizes', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.deepEqual(manifest.icons.map(icon => icon.sizes).sort(), ['192x192', '512x512']);
});

test('service worker precaches the game shell for offline launches', async () => {
  const sw = await readFile(new URL('sw.js', root), 'utf8');
  assert.match(sw, /addAll\(APP_SHELL\)/);
  assert.match(sw, /caches\.match\(event\.request\)/);
  assert.match(sw, /clients\.claim\(\)/);
});


test('game scripts contain no install-button or iframe-redirect behavior', async () => {
  const main = await readFile(new URL('js/main.js', root), 'utf8');
  assert.doesNotMatch(main, /install-app-button|beforeinstallprompt|appinstalled|isEmbeddedGame|window\.open/);
});

test('colour values are used as visual swatch styles, not visible text in wardrobe/shop cards', async () => {
  const ui = await readFile(new URL('js/ui.js', root), 'utf8');
  assert.match(ui, /preview\.style\.background=/);
  assert.match(ui, /swatch\.style\.backgroundColor=/);
  assert.doesNotMatch(ui, /<small>\$\{s\.a\}|textContent\s*=\s*s\.a/);
});
