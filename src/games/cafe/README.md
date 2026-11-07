# Pocket Panic (Pillar 2: Save & Manage)

A boss fight where the boss is the month. One ₹600 month in Café Meherban: put the money in three jars, pay the bills that cannot be skipped, resist (or don't) the window sellers and the snack trolley, deal with a friend's loan request, and survive the rain. Design: `Pocket Panic Save & Manage Game Design Document.md` in the repo root.

Route: `/play/save` (`?demo` starts a fresh seeded month). Entry point: `PocketPanic.tsx` (`seed?`, `cohortCode`, `onComplete(GameResult)`, `onExit`).

## Layout

| Folder | What lives there |
| --- | --- |
| `engine/` | Pure TypeScript, no React. `(run, choice) → new run`. Economy, fizz pressure, tally, archetypes, reference bots. |
| `content/` | Numbers (`items.json`) and strings (`en.json`, `hi.json`, `te.json`). Same keys in all three, enforced by `tests/strings.test.ts`. |
| `state/` | `store.ts` (persisted run, key `money-mohalla-cafe-v1`), `stage.ts` (what the scene is showing right now). |
| `ui/` | Screens only call engine functions. `Scene.tsx` is the painted café, `kit.tsx` the dialogue box, HUD, source picker and notebook. |
| `tests/` | Engine behaviour including the five reference playstyles, and string consistency. |

## Art (`public/art/cafe/`, sliced from `new_graphics/`)

Backdrop `art/cafe-interior(.lite).webp`; Chacha poses, Teja poses, four window sellers, Yusuf, ramune bottle stages (fun and friends, five each), item icons, gullak, tumbler, rain, lightning, ledger, parchment, Quick Cash bolt, Big Night selfie. The player is the avatar chosen on the island. Lite mode uses the smaller backdrop and skips the rain.

## Rules the code keeps

- Every payment names its source (Spend, Save, Emergency, Quick Cash). Bills cannot be skipped; wants can.
- The fizz is shown as bottle stages, never a number. Nothing hides a timer: waiting runs on a visible saucer, and Pause freezes everything.
- All money is fictional and labelled so. Quick Cash is a made-up app.

## Tests

`npx vitest run src/games/cafe` (27 tests). The reference playstyles (shelf first, early spends, vault, cushion-light, quick cash) must keep landing on their documented endings.
