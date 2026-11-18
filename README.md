# WORMS BATTLE – GamerKie Edition

**Eat. Grow. Survive. Dominate!**

An original, offline-first 2D worm arena game built with HTML5 Canvas, CSS and vanilla JavaScript. It uses original procedural canvas graphics and does not copy Worms Zone.io artwork, source code, logos or assets. The playable arena is a 6,500-unit radius cyber-neon circle with a crimson boundary.

## Play locally

Open `index.html` in a modern browser. For the most reliable module loading, start a local static server from this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

1. Create a GitHub repository named `worms-battle` (or another name).
2. Upload the **contents** of this folder to the repository root. Do not upload the outer folder as an extra nested folder.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Open the Pages URL after GitHub finishes publishing.

No build command or backend is required. Keep `.nojekyll` in the root.

## Blogger

Use the separate `blogger-single.html` file from the ZIP. In Blogger, create a post, switch to HTML view, paste the complete file contents, and publish. Some Blogger themes sanitize full document tags; if that happens, paste the content inside `<body>` only and keep the `<style>` and `<script>` blocks. Test the published post on mobile.

## Controls

- **Desktop:** move the mouse to steer; hold left-click, `Space` or right-click to boost; arrow keys or WASD also steer; `Esc` pauses.
- **Mobile:** touch and drag on the left side to steer with the floating thumb pad; press and hold the glowing right-side ⚡ BOOST button to dash. Releasing stops the boost. Collect the 🔭 RADAR power-up for an extra 30% camera zoom-out.
- Collect food and power-ups. Avoid rival bodies and the arena boundary.

## Included features

- Five playable modes: Classic Endless, Battle Royale (last-worm-standing with no rival respawns), Time Challenge, Giant Worm and Survival Challenge.
- Procedurally rendered worm skins (Neon Cyan, Cyber Magenta, Toxic Green, Lava Gold and Electric Violet starter palettes), food, power-up drops and arena details, including cyber-neon hex/grid floor, glowing crimson circular wall, expressive eyes and food-reactive mouth.
- 25–30 uniquely named AI rival worms (adjusted by display size), forage/evade/opportunist/trap steering with look-ahead body and circular-wall avoidance plus short AI trap bursts, a live leaderboard, collision loot and player progression.
- Timed power-ups including 15-second Magnet (attracts food from 320px into the mouth), Radar Zoom (an extra 30% zoom-out beyond the normal zoom floor), 2x/5x Score Multiplier and 40% Turbo with sharper turning, plus the existing shields, coin/XP and other boosts. Normal boost drains 2 score points per frame at 60 FPS and drops crumbs; Turbo suspends that drain.
- Wardrobe with 30 original skin palettes, shop, unlockable arena themes and workshop settings.
- Missions, daily reward streak, achievements, profile, settings and local save data.
- Responsive phone controls and desktop keyboard/mouse support.

## Save data

Profile data is saved to browser `localStorage` on the device and browser where the game is played. It does not sync across devices and can be erased if browser site data is cleared. This is a local offline game; the leaderboard contains AI opponents, not real online players.

## Tests

The project includes fast unit tests for core geometry, collisions, circular arena rules, growth curves, spatial hashing, named AI/trap behavior, power-up timers, mobile boost control, particles, shop purchases and save data.

```bash
npm test
```

## Project structure

```text
worms-battle/
├── index.html
├── style.css
├── blogger-single.html
├── blogger-xml-post-snippet.html
├── README.md
├── package.json
├── build_single.py
├── .nojekyll
├── js/
│   ├── main.js
│   ├── game.js
│   ├── worm.js
│   ├── ai.js
│   ├── food.js
│   ├── collision.js
│   ├── powerups.js
│   ├── controls.js
│   ├── camera.js
│   ├── particles.js
│   ├── audio.js
│   ├── ui.js
│   ├── missions.js
│   ├── achievements.js
│   ├── storage.js
│   └── shop.js
├── tests/
│   ├── logic.test.js
│   └── systems.test.js
└── assets/
    ├── images/
    ├── skins/
    ├── food/
    ├── backgrounds/
    ├── icons/
    └── audio/
```

The AI, food, collision, power-up, particle, mission, achievement and shop rules are separated into their respective JavaScript modules. The `assets/` folders are intentionally optional: all current worm, food, arena and interface art is drawn in Canvas/CSS, so no image or audio files need to be downloaded. Empty folders contain small README notes in the ZIP to preserve the structure.

## Updated mobile and desktop controls

- On mobile, there are no fixed steering or boost buttons. Touch anywhere on the **left half** of the play area and drag the floating circular thumb to steer. The thumb pad appears exactly where the finger first touches.
- Touch and hold anywhere on the **right half** to boost. The worm accelerates while the finger remains down and returns to normal speed immediately after release. Both thumbs can be used together.
- New worms receive a **3-second spawn shield**. A glowing blue shield cover and 🛡️ icon remain visible during protection; collisions involving that new worm are ignored until the three seconds end.
- The arena uses a crimson circular boundary (6,500 world units radius) instead of rectangular arena edges. Camera framing now uses the screen's CSS-pixel size rather than the high-DPI canvas size, preventing the view from clipping or shifting on fullscreen phones.
- Phones request fullscreen and landscape orientation where the browser supports it. If automatic orientation lock is unavailable, the rotate-device prompt remains available. Desktop keeps mouse steering, right-click / Space boost, and WASD / Arrow-key steering.
- Neither player nor enemies die from touching their own body. Only another worm's body or the circular arena wall can eliminate them after spawn protection ends.

## Updated files

`index.html`, `style.css`, `js/controls.js`, `js/game.js`, `js/logic.js`, `js/main.js`, `js/camera.js`, `js/worm.js`, `js/ui.js`, both test files, and `blogger-single.html` contain the updated controls and behavior.

## Latest arena HUD and food update
- The minimap is displayed at the upper-left and shows the player plus live AI worms across the full arena.
- A compact score card appears directly below the minimap on the upper-left; collected coins and gems appear underneath it. The upper-right live score list shows the first ten living worms at once; scroll inside it to see the remaining rivals.
- Worm body/head size and length scale from score using the requested score-curve formulas, with a 48px radius cap; the existing 0.01 mass-per-food-point economy remains intact.
- When a worm is defeated, its food drops trace the shape of its actual trail instead of appearing in a random circular pile.
- Nearby loose food gently drifts toward the closest worm's mouth; Magnet pulls food within 320 world units. Food collection and AI perception use spatial-hash grids, and off-screen food, potions, particles, grid cells and worm segments are culled from rendering.
- Power-up badges use safe text nodes; HTML entities are decoded and markup is stripped so code is never displayed. Every active power-up shows a live seconds-remaining countdown and timer bar along the top.
- Manual zoom buttons were removed. A collectible 🔭 ZOOM OUT power-up temporarily zooms the camera out.
- The full-screen app and canvas are constrained to the visible viewport and safe-area edges to prevent clipping.


## Growth balance, landscape results and rewarded continue

- Regular food now adds mass at a slower rate (0.01 mass per food point instead of 0.12); the temporary FEAST power-up still multiplies that growth.
- The live score panel shows ten rows at once. Scroll inside the panel to view the remaining living worms.
- In landscape, the game-over summary stays on the left and the action buttons move to the right. In portrait, the summary and buttons remain stacked vertically.
- A rewarded-continue button appears after collision or boundary deaths. It resumes the same worm at the death position and grants four seconds of spawn protection.
- **Rewarded-ad provider setup is required:** the game calls `window.gamerkieShowRewardedAd({placement: 'worm-revive', reward: 'continue'})`. Your ad SDK integration must return `true` or `{ rewarded: true }` only after the provider confirms that the user earned the reward. Without this integration, the button displays an explanatory message and does not grant a free revive. No ad network/account or ad-unit ID is bundled in this project.

## Install WORMS BATTLE like a mobile app (PWA)

The game does not display an install button. It runs as a website inside the browser or Blogger iframe.


## Growth balance

Normal food mass gain is now `0.01` per food-value point. A 20-point food adds 0.2 mass normally; FEAST temporarily doubles this to 0.4. Growth is deliberately slow and gradual.


## XML/Blogger website integration

Use `blogger-xml-post-snippet.html` in the HTML view of a Blogger post or inside the appropriate page container in your XML theme. It embeds the GitHub Pages game in a responsive iframe, so the theme's header, navigation, search, labels, comments and other Blogger functions remain outside the game and are not overwritten by game CSS/JavaScript. Keep the game project deployed at `https://kielabs.github.io/worms-battle/`, or change the iframe URL in the snippet to your actual GitHub Pages URL. The Blogger embed contains no install button and does not redirect visitors to the GitHub Pages URL.

Wardrobe, GamerKie Shop and Workshop colour palettes are rendered as visual swatches with DOM style properties. The hexadecimal colour values are not inserted into visible text labels.


## Enemy AI collision and name-label update
- AI worms ignore their own trail even when a wrapper/snapshot shares the same stable worm ID; self-overlap is never a lethal collision.
- AI worms are eliminated only by hitting another worm's body or reaching the arena wall. Rival checks are resolved pair-by-pair in both directions to avoid order-dependent collision results.
- Enemy nameplates display readable human first names (for example Alex, Sophia and Ethan) above each AI worm at all camera zoom levels. Names remain unique after the catalog is exhausted.
- Player and AI worms both visibly grow thicker and longer as they eat. The original economy remains at 0.01 mass per food-value point; each collected food also contributes a small visual growth increment.
- Run `npm test` to verify the collision, nameplate and food-growth regression tests.

## Cyber-neon gameplay additions

- Default arena: dark `#0b0e14` floor, `#1a2333` grid and hex mesh, and a neon crimson circular boundary with a 6,500-unit radius. Existing arena themes remain selectable.
- Score growth uses `floor(15 + score^0.58 × 1.4)` target segments and `min(48, 14 + score^0.32 × 0.65)` body radius. Body samples are spaced by `radius × 0.45`; the prior 0.01 mass-per-food-point progression remains unchanged.
- Player movement is based on 3.2 world units/frame at 60 FPS; holding boost raises it to 6.2 units/frame, drains 2 score points per frame, and drops glowing crumbs. The 15-second Turbo potion grants 40% extra speed and sharper turning without this drain.
- Magnet, Radar Zoom, Score Multiplier (2x/5x) and Turbo potions last 15 seconds. Worm eyes glance toward nearby food and their mouth animates open when food is within 80 units.
- `Worms-Battle-Single-File.html` is generated from the same source modules and contains the complete game with inlined CSS and JavaScript, no external scripts, stylesheets, images, audio files, manifest or service-worker requests. It can run as a standalone local HTML file; its PWA install control is intentionally omitted because a self-contained file has no hosted manifest/service worker.


## Run the standalone single-file build

Open `Worms-Battle-Single-File.html` directly in a modern browser. This version includes all game markup, styles and JavaScript in one file and does not load remote libraries, images, fonts or audio files. The main project `index.html` remains the GitHub Pages/PWA version with its original multi-file structure.

To regenerate the two bundled HTML outputs after editing source modules:

```bash
python build_single.py
```

The Blogger post snippet remains available separately in `blogger-xml-post-snippet.html`.
