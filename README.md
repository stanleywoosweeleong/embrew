# 益菌坊 EM Brew Lab

Offline-first bilingual PWA for brewing effective microbes — ingredient scaling,
fermentation tracking and dilution calculation.

## Deploy on GitHub Pages

1. Push this folder to a repo (files at the repo root, not inside a subfolder).
2. Settings → Pages → Source: `Deploy from a branch` → branch `main`, folder `/ (root)`.
3. Open `https://<user>.github.io/<repo>/`.

All paths are relative (`./`), so it works at a project-page subpath without changes.
`.nojekyll` is included so Pages serves every file as-is.

## Installing on a phone

- **iOS/Safari** — Share → Add to Home Screen. Launches standalone with the dark status bar.
- **Android/Chrome** — the install prompt appears, or menu → Install app.

## After every change

Bump `CACHE_VERSION` in **both** `sw.js` and the `<script>` block in `index.html`,
then push. The old cache is deleted on activate and the new build is live on the
next launch.

```
node --check sw.js
```

## Files

```
index.html              the whole app — markup, styles, logic
sw.js                   service worker, precaches the shell
manifest.webmanifest    install metadata
icons/                  192 / 512 / maskable / apple-touch / favicons
.nojekyll               stop Pages from running Jekyll
```

## Notes

- State is stored in `localStorage` under the `embrew.` prefix, with an in-memory
  fallback if storage is blocked.
- No network calls, no analytics, no API keys. It runs fully offline after first load.
