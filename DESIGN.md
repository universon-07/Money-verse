# Design system

**Blend rule:** Cuphead-era *rendering* (inked outlines, flat cel colour, stepped bounce, film grain, vintage title cards)
+ the *warm saturated Indian-street palette* from the reference images. Mood and palette only; nothing is traced or copied.

## Palette (Tailwind tokens in `src/index.css`, JS mirror in `src/art/palette.ts`)

| Token | Hex | Use |
| --- | --- | --- |
| ink | `#2B1A17` | every outline, never pure black |
| terracotta | `#D9632E` | roofs, counters, pots |
| marigold | `#F28C28` | garlands, rangoli, glow |
| mustard | `#E8B04A` | primary button, signs |
| jasmine | `#FFF3D6` | paper, cards, awning stripes |
| sky | `#5BB5D6` | sky, secondary button |
| teal | `#2F6F73` | shop walls, shutters |
| sage | `#3F7A3A` | shutters, foliage |
| coral | `#D8503A` | accents, "DUE" stamp |
| pink | `#E5457A` | CTA, focus ring, selected state |
| gold | `#D9A520` | coins, lamps, frames |
| dusk | `#1E2A44` | night scenes, dark title cards |
| maroon | `#7A2A22` | arch interiors, sign lettering |

## Type

- **Display (Latin):** Chango (titles), Bowlby One (signboards, buttons).
- **Hindi display:** Rozha One. **Telugu display:** Noto Sans Telugu 900. **Body:** Noto Sans / Devanagari / Telugu 500-800.
- `.lang-fit` scales display text per script (hi 0.95, te 0.92). Letter-spacing is forced to normal for hi/te (tracking breaks conjuncts).

## Line, edge and shadow

- Outlines 2-4 px in ink, **uneven**: heavier on foreground, lighter on background. Limbs are noodle tubes (ink stroke under colour stroke).
- Hand-cut corners: UI uses asymmetric `border-radius` pairs so nothing looks like a perfect rounded rect.
- Shadows are **flat offset** (`4px 4px 0 ink`), never blurred. No gradients on UI except the goal-bar stripes.
- Buttons: chunky, inked, sign-board feel; hover lifts and tilts, press sinks.
- Title card: cream (or dusk) panel, 4 px ink border, inner gold rule, four corner flourishes (`TitleCard`).

## Motion

- Everything is **stepped, ~10 fps** (`steps(n)` in CSS, `stepped()` easing in Framer Motion). No buttery 60 fps tweens on characters.
- Reactions: squash-and-stretch pop (`anim-squash`), idle bob (`anim-bob`), sway (laundry, flags, lanterns), hop (pigeons), blink (fake OFFER sign).
- Scene changes use the **iris wipe** (`Iris.tsx`): circle closes, scene swaps, circle opens.
- Signboards unfurl from the top (`anim-unfurl`).
- Feedback is visual only; there is no audio.

## Film overlay (`FilmOverlay`)

Grain from four pre-rendered 128 px noise tiles swapped at 10 fps with a random offset, 3 flickering vertical scratches, and a soft vignette.
`pointer-events: none`. **Lite mode** (auto on `prefers-reduced-motion` or <= 4 cores, or manual toggle) removes grain, scratches and SVG
displacement filters; the static vignette stays.

## Art structure

Layered: sky and sun, far skyline, back row of buildings, ground with cobbles and rangoli, side walls, objects (y-sorted by base line),
the hero, then an overhead layer (wires, strung lights, bunting, laundry). Painted art overrides the procedural SVG through `ArtSlot`/manifest.
