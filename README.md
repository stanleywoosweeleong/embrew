# 益菌坊 EM Brew Lab

Offline-first trilingual (中文 / English / Bahasa Melayu) PWA for brewing effective microbes — ingredient scaling,
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

Just push. There is no version number to bump.

The service worker opens the app instantly from its saved copy, then checks the
server on every launch and whenever the app returns to the foreground. If
`index.html` has changed, the new copy is saved and a toast offers a refresh;
it is also live on the next launch regardless. The footer shows the date of the
copy currently running.

GitHub Pages can take a minute or two to publish a push.

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
