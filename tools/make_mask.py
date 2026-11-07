"""Builds src/content/walkmask.json from the plain terrain painting: walkable = sand, stone and grass;
not walkable = water, rock, cliff faces, empty. Re-run after changing island-terrain art:  python tools/make_mask.py"""
import json, numpy as np
from PIL import Image
W, H, T = 2400, 2040, 24
im = Image.open('public/art/island-terrain.webp').convert('RGBA').resize((W // 4, H // 4), Image.LANCZOS)
a = np.array(im).astype(float) / 255
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
mx, mn = a[..., :3].max(2), a[..., :3].min(2)
sat = (mx - mn) / (mx + 1e-6)
d = mx - mn + 1e-6
hue = (np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60) % 360
solid = al > .5
water = (hue > 170) & (hue < 250) & (sat > .3)
sand = (hue >= 20) & (hue < 62) & (sat < .42) & (mx > .8)
pink = (hue > 330) | (hue < 20)
pink = pink & (sat > .08) & (sat < .45) & (mx > .82)
grass = (hue >= 55) & (hue < 105) & (sat > .42) & (mx > .68)
walk = solid & (sand | pink | grass) & ~water
from scipy import ndimage as ndi
walk = ndi.binary_opening(walk, iterations=2)       # drop speckles on rocks
walk = ndi.binary_closing(walk, iterations=3)       # fill small gaps (swirls, grass tufts)
walk = ndi.binary_erosion(walk, iterations=2)       # keep feet off the cliff lip
C, R = W // T, H // T
cell = (H // 4) // R
out = []
for rr in range(R):
    row = ''
    for cc in range(C):
        blk = walk[rr * 6:(rr + 1) * 6, cc * 6:(cc + 1) * 6] if False else walk[int(rr * T / 4):int((rr + 1) * T / 4), int(cc * T / 4):int((cc + 1) * T / 4)]
        row += '1' if blk.size and blk.mean() > .6 else '0'
    out.append(row)
json.dump({'t': T, 'rows': out}, open('src/content/walkmask.json', 'w'))
print(sum(r.count('1') for r in out), 'walkable cells of', C * R)
Image.fromarray((walk * 255).astype(np.uint8)).save('C:/Users/maith/AppData/Local/Temp/claude/c--Users-maith-Downloads-meg26-van/68009b78-9fe6-4e64-8c18-7bdca8663c9c/scratchpad/mask.png')
