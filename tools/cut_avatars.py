"""Cuts new_graphics/avatars/*Outfits*.png (3 rows = school, college, earner; 10 poses per row) into
public/art/avatar/<persona>-<n>.webp plus <persona>-face.webp and sizes.json.
Slots: 0 front idle, 1 back idle, 2-3 side walk (facing right), 4-5 front walk, 6-7 back walk, 8 side right, 9 side left."""
import glob, json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.ndimage import gaussian_filter1d
import os
os.makedirs('public/art/avatar', exist_ok=True)
for f in glob.glob('public/art/avatar/*'): os.remove(f)
SHEETS = {'girl': glob.glob('new_graphics/avatars/*Outfits*.png')[0], 'boy': glob.glob('new_graphics/avatars/Boy*.png')[0]}
rows = [(0, 340), (340, 680), (680, 1024)]
sizes = {}
for g, src in SHEETS.items():
  im = Image.open(src).convert('RGBA')
  A = np.array(im.getchannel('A')) > 12
  names = [f'{g}-school', f'{g}-college', f'{g}-earner']
  for ri, (y0, y1) in enumerate(rows):
      col = gaussian_filter1d(A[y0:y1].sum(0).astype(float), 5)
      cand = sorted([(col[x], x) for x in range(30, 1506) if col[x] <= col[x - 1] and col[x] <= col[x + 1]])
      cuts = []
      for v, x in cand:
          if all(abs(x - c) > 90 for c in cuts): cuts.append(x)
          if len(cuts) == 9: break
      edges = [0] + sorted(cuts) + [1536]
      for k in range(10):
          sub = A[y0:y1, edges[k]:edges[k + 1]]
          lab, n = ndi.label(ndi.binary_dilation(sub, iterations=3))
          keep = lab == (1 + int(np.argmax(ndi.sum(sub, lab, range(1, n + 1)))))
          arr = np.array(im.crop((edges[k], y0, edges[k + 1], y1)))
          arr[..., 3] = np.where(keep & sub, arr[..., 3], 0)
          c = Image.fromarray(arr, 'RGBA'); c = c.crop(c.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox())
          c.save(f'public/art/avatar/{names[ri]}-{k}.webp', 'WEBP', quality=90, method=6)
          sizes[f'{names[ri]}-{k}'] = [c.width, c.height]
          if k == 0:
              face = c.crop((0, 0, c.width, int(c.height * 0.4))); face = face.crop(face.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox())
              face.save(f'public/art/avatar/{names[ri]}-face.webp', 'WEBP', quality=90, method=6)
json.dump(sizes, open('public/art/avatar/sizes.json', 'w'))
print('ok', len(sizes))
