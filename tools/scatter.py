"""Scatters the painted trees, rocks and bushes onto grass cells of the walk mask, away from roads and doors.
Writes the 'decor' list in src/content/island.json:  python tools/scatter.py  (seeded, repeatable; tweak counts below)."""
import json, math, random
random.seed(11)
d = json.load(open('src/content/island.json'))
W, H = d['world']['w'], d['world']['h']
mask = json.load(open('src/content/walkmask.json')); T = mask['t']; rows = mask['rows']
man = json.load(open('public/art/manifest.json'))
pts = {n['id']: (n['x'] / 100 * W, n['y'] / 100 * H) for n in d['nodes'] + d['waypoints']}
segs = [(pts[a], pts[b]) for a, b in d['edges']]
def dseg(p, a, b):
    vx, vy = b[0] - a[0], b[1] - a[1]; t = max(0, min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy or 1)))
    return math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy)
def near_road(p): return min(dseg(p, a, b) for a, b in segs)
def open_at(x, y): r, c = int(y // T), int(x // T); return 0 <= r < len(rows) and 0 <= c < len(rows[0]) and rows[r][c] == '1'
def edge_dist(x, y):
    best = 999
    for dx in range(-96, 97, 24):
        for dy in range(-96, 97, 24):
            if not open_at(x + dx, y + dy): best = min(best, math.hypot(dx, dy))
    return best
cells = [((c + .5) * T, (r + .5) * T) for r, row in enumerate(rows) for c, v in enumerate(row) if v == '1']
plaza = (0.51 * W, 0.56 * H, 0.17 * W, 0.13 * H)
def ok(p, minroad, minnode):
    if ((p[0] - plaza[0]) / plaza[2]) ** 2 + ((p[1] - plaza[1]) / plaza[3]) ** 2 < 1: return False
    if near_road(p) < minroad: return False
    if any(math.hypot(p[0] - q[0], p[1] - q[1]) < minnode for q in pts.values()): return False
    if any(abs(p[0] - q[0]) < 230 and -40 < p[1] - q[1] < 330 for q in [pts[k] for k in ('plan', 'save', 'invest', 'safe', 'gate')]): return False
    if any(((p[0] - b[0] / 100 * W) / (b[2] / 100 * W + 70)) ** 2 + ((p[1] - b[1] / 100 * H) / (b[3] / 100 * H + 60)) ** 2 < 1 for b in d['blockers']): return False
    gb = d['gateBlock']
    if gb[0] / 100 * W - 60 < p[0] < gb[2] / 100 * W + 60 and p[1] < gb[3] / 100 * H + 140: return False
    return True
placed = []
def put(kind, art_names, n, w_range, minroad, minnode, rim=False, spacing=150):
    tries = 0; got = 0
    while got < n and tries < 4000:
        tries += 1
        p = random.choice(cells)
        if not ok(p, minroad, minnode): continue
        e = edge_dist(*p)
        if rim and not (30 < e < 80): continue
        if not rim and e < 60: continue
        if any(math.hypot(p[0] - q['wx'], p[1] - q['wy']) < spacing for q in placed): continue
        a = random.choice(art_names); w = random.uniform(*w_range)
        placed.append(dict(art=a, wx=p[0], wy=p[1], x=round(p[0] / W * 100, 2), y=round(p[1] / H * 100, 2), w=round(w), kind=kind)); got += 1
names = lambda pre, ids=None: [k for k in man if k.startswith(pre) and (ids is None or int(k.split('-')[-1]) in ids)]
put('tree', names('deco-tree', [2, 3, 5, 6, 1, 4, 7]), 6, (210, 280), 105, 170, spacing=260)
put('tree', ['deco-tree-0'], 1, (360, 400), 170, 230, spacing=300)
put('rock', names('deco-rock'), 9, (150, 230), 85, 150, rim=True, spacing=170)
put('bush', names('deco-bush', [0, 1, 2, 3, 4, 5, 6, 7, 11, 12, 13]), 22, (110, 170), 80, 130, spacing=95)
put('bush', names('deco-bush', [8, 9, 10, 14, 15, 16, 17, 18]), 10, (100, 150), 85, 140, spacing=110)
for p in placed:
    h = p['w'] * man[p['art']]['h'] / man[p['art']]['w']
    p['solid'] = [round(p['w'] * (0.14 if p['kind'] == 'tree' else 0.3) / W * 100, 2), round(p['w'] * (0.05 if p['kind'] == 'tree' else 0.1) / H * 100, 2)] if p['kind'] != 'bush' else None
    del p['wx'], p['wy']
d['decor'] = placed
json.dump(d, open('src/content/island.json', 'w'), indent=1)
print(len(placed), 'decor items')
