# VANTYR — Blood Codex

**Mobile web edition v3.0**, the private D&D character companion for Vantyr.

## Open the application

This repository contains the complete web source in its root:

- `index.html` — the app
- `style.css`, `mobile.css` — styling
- `app.js`, `curses.js`, `future.js`, `ascendants.js`, `spells.js`, `racial.js`, `vecna.js`, `layout.js`, `mobile.js` — mechanics and interface
- `assets/` — portrait, Vecna illustration, app icons
- `manifest.webmanifest` and `sw.js` — install/offline support

To run it on your PC now: **Code → Download ZIP**, extract it, and open `index.html` in a browser.

All changes to these files can be reviewed via the GitHub **Commits** tab and **Files changed** views.

## Web preview builds

Every push to `main` produces a downloadable web preview package under **Actions → Web Preview → latest successful run → Artifacts**. Extract the artifact and open `index.html`.

This repository is **private**. GitHub's repository file viewer is not a live website. Publishing a permanent web URL would require configuring hosting (and GitHub Pages availability for private repositories depends on your GitHub plan). Keep the repo private unless you explicitly choose otherwise.

## Android later

The Android Studio packaging is not part of this web-only upload. We can add it when you're ready.

## Saves and backups

Game state uses local browser storage. GitHub stores **source code**, not live character saves. Switching devices/browsers or clearing app storage does not transfer your character progress.

The portrait has been compressed for web performance; no character identity/artwork was substituted.
