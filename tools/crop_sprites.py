import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sheet = Image.open('art-source/character-sheet.png')

def largest(img):
    a = np.array(img)[..., 3] > 0
    lab, n = ndi.label(ndi.binary_dilation(a, iterations=4))
    if n == 0: return img
    sizes = ndi.sum(a, lab, range(1, n + 1))
    keep = lab == (1 + int(np.argmax(sizes)))
    arr = np.array(img); arr[..., 3] = np.where(keep & (arr[..., 3] > 0), arr[..., 3], 0)
    out = Image.fromarray(arr, 'RGBA'); return out.crop(out.getbbox())

def grab(box):
    return largest(sheet.crop(box))

# chibi frames: (x0,y0,x1,y1) loose boxes
R1, R2 = (432, 540), (535, 632)
frames = {
 'down_0': (1068, 432, 1135, 540), 'down_1': (1062, 535, 1130, 632),
 'up_0':   (1140, 432, 1208, 540), 'up_1':   (1140, 535, 1205, 632),
 'left_0': (1364, 432, 1433, 540), 'left_1': (1368, 535, 1434, 632),
 'right_0':(1437, 432, 1510, 540), 'right_1':(1442, 535, 1512, 632),
}
CW, CH = 84, 104
for k, box in frames.items():
    s = grab(box)
    s.thumbnail((CW, CH - 2), Image.LANCZOS)
    c = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    c.alpha_composite(s, ((CW - s.width) // 2, CH - s.height))
    c.save(f'public/art/chibi/{k}.png')
# hero full body
grab((5, 0, 218, 458)).save('public/art/hero/front.png')
grab((222, 0, 372, 458)).save('public/art/hero/side.png')
# reading seated pose & tote bag for story
grab((370, 630, 590, 840)).save('public/art/hero/reading.png')
# faces 3x5
xs = [862, 1018, 1150, 1283, 1405, 1536]; ys = [0, 150, 292, 440]
names = [['neutral','calm','glance','laugh','wink'],['smirk','soft','pleased','cheer','sleepy'],['coy','shut','grin','tease','shock']]
for r in range(3):
    for c in range(5):
        grab((xs[c], ys[r], xs[c+1], ys[r+1])).save(f'public/art/faces/{names[r][c]}.png')
print('ok')
