# How the hero moves and how zoom works

The game feel is unchanged by the art swap: free roaming like an overworld, not a menu of buttons.
Everything below is in `src/island/IslandMap.tsx` (loop, input, camera) and `src/island/walk.ts` (collision and pathfinding).

## Where the hero can walk
`src/content/island.json` describes the walkable world in percent of the 2400x2040 map:
- `edges`: the road network between waypoints and the seven places (each road has a half-width, `roadHalfWidth`).
- `areas`: open cream spaces (plaza ring, landing, shop fronts) as ellipses.
- `blockers`: things you cannot walk through (the Charminar base).
`walk.ts` rasterises that into a 24px grid (the walk mask). Open `/?debug` to see the mask in red, a 5% grid, and the door circles.
When the art changes, only these numbers are retuned; no game code changes.

## Three ways to move (all can be used at any time)
1. **Joystick** (touch devices and narrow windows): analog, speed follows how far you push. Bottom-left, thumb zone.
2. **Keyboard**: arrow keys or WASD, 8 directions, same speed.
3. **Tap or drag**: tap the ground and the hero walks there by A* pathfinding over the mask (EasyStar); drag to keep steering.
Free movement uses axis-separated collision, so the hero slides along walls instead of sticking.
Stepping on any input cancels the path. Facing (down / up / left / right) follows the heading; frames alternate at ~6/s while moving.

## Going into a place
- Walk within 120 world px of a place's door (or tap the place): a small paper card opens with the name, a one-line hook and **Enter**. Enter goes to the pillar screen with a cross-fade.
- Back (or Esc) closes the card and it will not reopen until you step away and return.
- The gate shows a locked message until all four pillars are complete, then opens and shows "Goal reached".
- Keyboard users can Tab to a place and press Enter to be taken there.
- The hero keeps its position when you come back from a pillar.

## Depth
Hero z-order follows its y, so the Charminar (a separate overlay) hides the hero when walking behind it and not in front of it.

## Camera and zoom
- **Fit:** on desktop the whole island fits and the camera stays still. On phones it fits by height, and the camera follows the hero sideways (hero held a bit below the middle), smoothed.
- **Zoom range:** from fit (1x) up to a cap that depends on how sharp the painting is: `cap = (art pixels / world pixels) x screen pixel ratio / fit scale`, clamped to 1-3x. Today's 1344px painting gives roughly 1.3-2x. A bigger painting automatically allows deeper zoom, with no code change.
- **Inputs:** mouse wheel, + / - buttons (desktop), + / - keys, two-finger pinch (touch). Zoom eases smoothly; when zoomed the camera follows the hero on any screen.
- Place labels counter-scale so they stay readable at every zoom.
- A second finger cancels a walk and becomes a pinch, so zooming never walks the hero by accident.

## Idle motion and lite mode
Flags flutter and the hero breathes (stepped). Lite mode and reduced-motion turn all idle motion and grain off; movement and zoom still work.
