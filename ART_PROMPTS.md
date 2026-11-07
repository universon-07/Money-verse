# Art prompts: calm island version

**Shared style line (paste at the end of every prompt):**
> Hand-painted watercolour and gouache on cream paper, high isometric three-quarter view (about 30 degrees down), thin warm-brown ink outline, muted warm palette (cream stone, terracotta, ochre, sage, pale blue water, granite grey-mauve), soft paper texture, 1930s cartoon background style, calm and uncluttered. No text, no lettering, no logos, no signage words, no people larger than a few tiny figures.

**Delivery rules for every asset:** transparent background PNG (or flat #00FF00 green to cut out), nothing cropped at the canvas edge, soft contact shadow baked under the object, same light direction everywhere (sun from upper left). File-name keywords matter: see the table at the bottom.

## 1. Whole island (single image, the main one)
Hand-painted watercolour and gouache illustration of a single floating island seen from a high isometric three-quarter view, on pale blue water with faint ripples. Muted warm palette, cream stone paths, thin warm-brown ink outlines, paper texture. In the centre, a small cream-stone four-minaret monument with pointed arches on a round paved plaza. Around it: a bangle market with striped awnings (north-west), a small chai cafe (north-east), a pearl jeweller's shop (south-west), a phone-recharge kiosk (south-east), a wooden dock with a boat (bottom-left), and a modest college gate on a raised granite ledge at the back. Rounded trees, low boulders, lamp posts, layered rock cliff edge with moss. No text, no signage lettering, no people larger than a few tiny figures, no characters. Calm, uncluttered, 1930s cartoon background style.

Canvas 2400x2000. File name: `island background.png`.

## 2. Island terrain only (recommended: lets us place buildings as separate layers)
Same island as above but completely empty: only the grass top, cream stone paths curving from a round central plaza to five spots (north-west, north-east, south-west, south-east, and a short stair up to a raised granite ledge at the back), layered grey-brown cliff edge with moss, soft shadow on the water, faint ripples, two tiny islets. No buildings, no trees, no props, no people, no text. + shared style line.

## 3. Landmarks (one image each, transparent background, isometric, same scale)
- **Charminar plaza:** small cream-stone monument with four slender minarets, pointed central arch and a row of smaller arches, on a round paved plaza with three shallow steps and a couple of lamp posts. Recognisable but simple. + style
- **Bangle market:** three tiny market stalls with striped cream-and-terracotta awnings, rows of coloured bangles hanging on rods, a low wooden counter, one tiny figure behind a stall. + style
- **Irani chai cafe:** small corner cafe with an open arched front, two round marble-top tables with bentwood chairs, a brass kettle on a counter, a thin wisp of steam, a checkered tile strip along the base. + style
- **Pearl jeweller's shop:** small stone shop with an arched wooden door, a brass balance scale hanging by the door, a window with a soft warm glow and a few pearl strings visible, a small velvet-red awning. + style
- **Phone-recharge kiosk:** small teal-grey kiosk with a counter, a shelf of phone cases, a phone icon on a plain board (no words), one small coral exclamation-mark sign, quiet and tidy. + style
- **College gate:** modest cream-stone gate with a pointed arch and two pillars, a small flag on top, on a raised granite ledge with a short stair in front. Version A closed and dim, version B open with warm light inside. + style
- **Arrival dock:** wooden jetty with a bollard, a coil of rope and one small red-and-cream boat tied alongside. + style

## 4. Scenery sheets (several items per sheet, spaced apart, transparent)
- **Trees:** ten round-canopy trees in three greens, varied heights, some with a pale highlight, plus five shrubs. + style
- **Rocks:** eight low granite boulders in grey-mauve, some with moss, varied sizes. + style
- **Small props:** four street lamps (iron post, warm lantern), three short sections of low stone wall, a small round pond with a stone rim, three marigold flower patches, a wooden bench. + style
- **Map markers:** a level flag on a pole in two states side by side: plain white flag, and antique-gold flag with a small tick mark. + style
- **Water tile:** seamless pale blue watercolour water with a few thin white ripple strokes, 1024x1024, no objects.
- **Paper texture:** seamless cream watercolour paper, very subtle fibres, 1024x1024, no objects.

## 5. Story illustrations (flat view, not isometric)
- **Dawn:** the island from far above-front at dawn, pink and pale gold sky wash, mist over the water, calm, no text.
- **Grandmother's flower stall (vignette):** small watercolour vignette on paper of a flower stall with jasmine strings, marigold garlands, a brass scale, warm glow; the grandmother is NOT drawn (she is added as a character). No text.
- **Fee letter:** a plain old paper fee receipt with a ribbon and a paperclip, empty fields (amounts are lettered in code), a faint round stamp area. No text.

---

# Characters (new look, different from the old sheets)

**Character style line (paste on every character prompt):**
> Mid-century Indian storybook illustration, flat gouache shapes with a thin warm-brown line, soft cheeks, simple faces, slightly rounded 3-heads-tall proportions, muted warm palette matching a pale-blue-water island map, plain background, full body, no text.

**Sheet rules:** poses separated by clear empty space (so they can be cut automatically), same scale in every pose, transparent or flat green background.

- **Hero token (walk set, the most important):** a young Indian student, small friendly figure, shown in 4 directions (front, back, left, right), 2 walking frames each, 8 figures in a 4x2 grid, identical size, readable at 60px tall. Three outfit variants as separate sheets: school uniform with a backpack; college kurta with a tote bag; first-job smart-casual with a small lunch bag. + character style
- **Portrait set for persona cards:** the same three students, head-and-shoulders, neutral, 512x512 each. + character style
- **Nani (grandmother):** warm elderly woman, silver bun, thick round glasses, soft pink cotton saree, standing and holding out a small cloth bundle; second pose smiling and proud. + character style
- **Bangle seller:** woman at a stall, one idle pose arranging bangles, one pose holding a bangle up and laughing. + character style
- **Irani cafe customer:** young man seated at a small table, one pose worried checking a wallet, one pose relieved sipping chai. + character style
- **Pearl merchant:** older man in a white cap with round glasses and a white moustache, one pose stringing pearls, one pose holding a single pearl up to the light. + character style
- **Kiosk keeper:** young person behind a counter, calm and neutral (no sunglasses, no hood, nothing menacing), idle on a phone; second pose waving a customer over. + character style
- **Tiny island figures (max 5 on the map):** five different villagers, standing, one walking, each about 40px tall at map scale, simple silhouettes. + character style

---

## File names the importer understands (`npm run art`)
| Keyword in file name | Becomes |
| --- | --- |
| `island background` / `island-bg` / `floating island` | full-island backdrop (`island-bg`) |
| `flower` | story flower-stall vignette |
| `receipt` | story fee letter |
| `... character sheet` | cut into poses (pose boxes go in `tools/import_art.py`) |

Hotspot positions live in `src/content/island.json` (percent of the 2400x2000 world), so after dropping in a new `island-bg`, nudge the numbers; no code changes.
