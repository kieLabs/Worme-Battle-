# WORMS BATTLE – GamerKie Edition

**Eat. Grow. Survive. Dominate!**

An original, offline-first 2D worm arena game built with HTML5 Canvas, CSS and vanilla JavaScript. It uses original procedural canvas graphics and does not copy Worms Zone.io artwork, source code, logos or assets.

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

- **Desktop:** move the mouse to steer; hold `Space` or right-click to boost; arrow keys or WASD also steer; `Esc` pauses.
- **Mobile:** touch and drag anywhere on the left half to steer with a floating thumb pad; press and hold anywhere on the right half to boost; releasing stops the boost. Collect the new 🔭 ZOOM OUT power-up to temporarily pull the camera back.
- Collect food and power-ups. Avoid rival bodies and the arena boundary.

## Included features

- Five playable modes: Classic Endless, Battle Royale (last-worm-standing with no rival respawns), Time Challenge, Giant Worm and Survival Challenge.
- Procedurally rendered worm skins, food, power-up drops and arena details.
- 30–45 AI rival worms (adjusted by display size), a live leaderboard, collisions, food drops after eliminations and player progression.
- Ten timed power-ups, boost with mass consumption, coins and XP.
- Wardrobe with 30 original skin palettes, shop, unlockable arena themes and workshop settings.
- Missions, daily reward streak, achievements, profile, settings and local save data.
- Responsive phone controls and desktop keyboard/mouse support.

## Save data

Profile data is saved to browser `localStorage` on the device and browser where the game is played. It does not sync across devices and can be erased if browser site data is cleared. This is a local offline game; the leaderboard contains AI opponents, not real online players.

## Tests

The project includes 37 fast unit tests for core geometry, collisions, growth, weighted food selection, AI steering, power-up timers, particles, shop purchases and save data.

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
- The arena has a thick yellow frame along all four sides. Camera framing now uses the screen's CSS-pixel size rather than the high-DPI canvas size, preventing the view from clipping or shifting on fullscreen phones.
- Phones request fullscreen and landscape orientation where the browser supports it. If automatic orientation lock is unavailable, the rotate-device prompt remains available. Desktop keeps mouse steering, right-click / Space boost, and WASD / Arrow-key steering.
- The player worm does not die from touching its own body. Enemy-body collisions and arena-wall collisions remain lethal after spawn protection ends.

## Updated files

`index.html`, `style.css`, `js/controls.js`, `js/game.js`, `js/logic.js`, `js/main.js`, `js/camera.js`, `js/worm.js`, `js/ui.js`, both test files, and `blogger-single.html` contain the updated controls and behavior.

## Latest arena HUD and food update
- The minimap is displayed at the upper-left and shows the player plus live AI worms across the full arena.
- A compact score card appears directly below the minimap on the upper-left; collected coins and gems appear underneath it. The upper-right live score list shows the first ten living worms at once; scroll inside it to see the remaining rivals.
- Worm body/head size now scales with mass; larger worms look visibly larger while starter worms stay compact.
- When a worm is defeated, its food drops trace the shape of its actual trail instead of appearing in a random circular pile.
- Nearby loose food gently drifts toward the closest worm's mouth; the Magnet power-up increases the attraction range and strength.
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

The home screen now has an **INSTALL APP** button beside PROFILE. On supported Android browsers (Chrome/Edge), tap it when it becomes enabled and confirm the browser's native install prompt. The app is installed directly from the website; no Play Store listing is needed.

PWA files included in this project:
- `manifest.webmanifest` — standalone app name, icon, orientation and start URL.
- `sw.js` — app-shell caching for repeat/offline launches.
- `assets/icons/icon-192.png` and `assets/icons/icon-512.png` — install icons.

Important:
- Deploy the complete project to GitHub Pages (HTTPS), keeping `manifest.webmanifest`, `sw.js`, `index.html`, `js/`, `style.css`, and `assets/` together at the same repository site root.
- Open the GitHub Pages site in Chrome. Tap **INSTALL APP** and accept the prompt. The button opens the native browser install confirmation when Chrome has made the site installable. The website cannot silently install an app or skip browser confirmation; the `beforeinstallprompt` API is Chromium-specific and is not supported in iOS Safari.
- Browser and device rules control whether the native install prompt is available. A website cannot silently install itself or bypass the browser's confirmation. An HTML game embedded inside a Blogger post cannot install the Blogger page as a standalone app; install the GitHub Pages game URL directly.
- The service worker is registered only on HTTPS or localhost. GitHub Pages provides HTTPS.

## Growth balance

Normal food mass gain is now `0.01` per food-value point. A 20-point food adds 0.2 mass normally; FEAST temporarily doubles this to 0.4. Growth is deliberately slow and gradual.


## XML/Blogger website integration

Use `blogger-xml-post-snippet.html` in the HTML view of a Blogger post or inside the appropriate page container in your XML theme. It embeds the GitHub Pages game in a responsive iframe, so the theme's header, navigation, search, labels, comments and other Blogger functions remain outside the game and are not overwritten by game CSS/JavaScript. Keep the game project deployed at `https://kielabs.github.io/worms-battle/`, or change the iframe URL in the snippet to your actual GitHub Pages URL. When the INSTALL APP button is tapped inside the embed, it opens the hosted game in a top-level tab. On that top-level page the button invokes the browser-native install confirmation as soon as Chrome makes it available. A cross-origin iframe cannot directly install itself or bypass browser confirmation.

Wardrobe, GamerKie Shop and Workshop colour palettes are rendered as visual swatches with DOM style properties. The hexadecimal colour values are not inserted into visible text labels.
