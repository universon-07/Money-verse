# Pillar 4: Case Files, Mohalla Detective

## Moving it into a new map or theme

The module is self-contained (no imports from the host app). Mount it anywhere:

```tsx
const Pillar4 = lazy(() => import('./pillar4/Pillar4'))
<Pillar4 language={lang} setLanguage={setLang} onExit={() => goToMap()} onComplete={() => lightPillar4()} />
```

To re-theme, override the CSS variables on `.p4-root` (`--p4-bg`, `--p4-accent`, ...; see `ui/p4.css`). `getPillar4Status()` in `hub/adapter.ts` returns status, points, rank and safeguards for the host's map. Copy the folder, `public/sw.js` and `public/manifest.webmanifest` (optional, offline) and the `p4:*` scripts.

Single-player detective game for the "Stay Financially Safe" doorway (`/play/safe`). Source of truth: `Pillar4_Specification.pdf` (v1.0).

## Run / check

```bash
npm run dev            # play at /play/safe (the shared Play screen mounts this module lazily)
npm run p4:validate    # content validator (also runs first in `npm run build`)
npm run p4:test        # engine tests (node --test, no extra dependencies)
node --experimental-strip-types --no-warnings tools/p4-e2e.mjs        # plays every case + Master Board in a browser (needs Edge/Chrome)
node --experimental-strip-types --no-warnings tools/p4-e2e-hints.mjs  # hint ladder, wrong reason, herring, zoom
node --experimental-strip-types --no-warnings tools/p4-e2e-sweep.mjs  # taps EVERY zone of EVERY case through the phone UI and checks the feedback
node --experimental-strip-types --no-warnings tools/p4-e2e-mistakes.mjs # a player who makes mistakes and reloads mid-case
node --experimental-strip-types --no-warnings tools/p4-audit.mjs C1   # lists every zone with its role (for content review)
node --experimental-strip-types --no-warnings tools/p4-scan.mjs       # flags ordinary items that contain attack language
npm run build && npm run preview && node tools/p4-offline.mjs         # offline check
```

## Layout

```
engine/    pure logic: case indexing, report resolution, hints, scoring, board, fix, validator (no React)
content/   cases/*.json (data model, spec 11.3), strings/en/*.json, strings/te/*.json
ui/        phone, report sheet, notebook, Chacha, board, fix, replay, master board, playbook, screens
store.ts   zustand state, persisted on the device under `p4.v1`; analytics events are queued only when a class code is set
hub/       adapter for the hub contract (spec 4.4)
offline.ts registers public/sw.js (production only)
```

## Adding a case or a language

* A case is `content/cases/<id>.json` plus `content/strings/en/<id>.json`. Single-zone items use shorthand (`role`, `explainKey`, `linkKey` on the item; the zone id equals the item id). Run `npm run p4:validate`.
* Telugu: fill `content/strings/te/*.json` (any file name, flat `key: text`). `node --experimental-strip-types tools/p4-validate.mjs --emit-te` writes `te/_template.json` with every missing key. Until a key is translated the English text is shown. `--strict-te` turns missing Telugu into errors.

## Still to verify before release (spec Appendix D)

Helpline 1930 and the reporting portal wording, the "real police do not arrest over video call" wording, any pitch statistic, Telugu translations and font licence.
