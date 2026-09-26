# Downloads a local copy of each card's Wikimedia image ("image" field) into images/<theme>/<id>.<ext>
# and sets the "pic" field in the 3 events files. Usage: python3 tools/download_images.py <theme-dir, e.g. space>
import json, os, re, sys, time, urllib.request, urllib.error
R = os.path.join(os.path.dirname(__file__), '..')
theme = sys.argv[1]
data = os.path.join(R, 'data', theme); out = os.path.join(R, 'images', theme); os.makedirs(out, exist_ok=True)
UA = {'User-Agent': 'Christianism-History-timeline/1.0 (https://github.com/Bolotaure/Christianism-History)'}
pics = {}
for e in json.load(open(os.path.join(data, 'events.json'))):
    u = e.get('image')
    if not u: continue
    ext = (re.search(r'\.(jpe?g|png|gif|webp)$', u, re.I) or [None, 'jpg'])[1].lower().replace('jpeg', 'jpg')
    f = os.path.join(out, f"{e['id']}.{ext}")
    if not (os.path.exists(f) and os.path.getsize(f) > 300):
        for url in [u.replace('/330px-', '/500px-'), u]:
            ok = False
            for a in range(5):
                try:
                    b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
                    if len(b) > 300: open(f, 'wb').write(b); ok = True
                    break
                except urllib.error.HTTPError as x:
                    if x.code == 429: time.sleep(15 * (a + 1)); continue
                    break
                except Exception: time.sleep(5)
            time.sleep(2)
            if ok: break
        print(e['id'], 'ok' if os.path.exists(f) else 'FAIL', flush=True)
    if os.path.exists(f): pics[e['id']] = f"images/{theme}/{os.path.basename(f)}"
for sfx in ['', '.fr', '.ja']:
    p = os.path.join(data, f'events{sfx}.json'); ev = json.load(open(p))
    for e in ev:
        if e['id'] in pics: e['pic'] = pics[e['id']]
    json.dump(ev, open(p, 'w'), ensure_ascii=False, indent=1)
print('pics:', len(pics))
