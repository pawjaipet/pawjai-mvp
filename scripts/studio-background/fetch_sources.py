"""Fetch (or reuse from cache) the primary still photo for every dog.

Primary still = the resolved cover if it is a photo; for video-first dogs, the
first photo in the app's resolved media order (the video cover is preserved).
Reuses the October cache when B2's x-bz-content-sha1 matches. Resumable: an
existing source file whose sha1 matches the live header is never re-downloaded.
Public URLs only; no credentials.
"""
import hashlib, json, os, shutil, ssl, sys, urllib.request
try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()
ROOT = os.environ.get("PAWJAI_STUDIO_ROOT", os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study"))
RES = json.load(open(f'{ROOT}/inventory-2026-11-17/resolved-media.json'))
OLD = {c['id']: c for c in json.load(open(f'{ROOT}/cover-inventory.json'))}
SAMPLES = {p['public_url'].replace('media.pawjai.co.th', 'media.pawjaipet.com'): f'{ROOT}/original-{i}.jpg'
           for i, p in enumerate(json.load(open(f'{ROOT}/photos.json')))}
UA = {'User-Agent': 'pawjai-studio-pipeline/1.0'}
os.makedirs(f'{ROOT}/sources', exist_ok=True)

def sha(path, algo):
    h = hashlib.new(algo)
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()

def head(url):
    req = urllib.request.Request(url, method='HEAD', headers=UA)
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return {k.lower(): v for k, v in r.headers.items()}, r.status

out = []
for d in RES:
    media = d['media']
    cover = d['cover']
    still = cover if cover['type'] == 'photo' else next((m for m in media if m['type'] == 'photo' and m.get('publicUrl')), None)
    rec = {'dog_id': d['id'], 'name': d['name'], 'adoption_status': d['adoption_status'], 'shelter_name': d['shelter_name'],
           'cover_type': cover['type'], 'cover_item_id': cover['id'], 'cover_url': cover['publicUrl'],
           'cover_poster_url': cover.get('posterUrl'), 'media_count': len(media)}
    if not still:
        rec.update(status='missing_source', reason='no still photograph in resolved media'); out.append(rec); continue
    url = still['publicUrl']
    rec.update(still_item_id=still['id'], still_url=url, still_is_cover=(still is cover))
    try:
        h, status = head(url)
    except Exception as e:
        rec.update(status='missing_source', reason=f'HEAD failed: {type(e).__name__}'); out.append(rec); continue
    live_sha1 = h.get('x-bz-content-sha1')
    ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic'}.get(h.get('content-type', '').split(';')[0], 'bin')
    dest_dir = f"{ROOT}/sources/{d['id']}"; os.makedirs(dest_dir, exist_ok=True)
    dest = f"{dest_dir}/{(live_sha1 or 'nosha')[:12]}.{ext}"
    origin = 'already-present'
    if not (os.path.exists(dest) and live_sha1 and sha(dest, 'sha1') == live_sha1):
        cands = []
        if d['id'] in OLD and OLD[d['id']].get('url') == url and OLD[d['id']].get('local'): cands.append(f"{ROOT}/{OLD[d['id']]['local']}")
        if url in SAMPLES: cands.append(SAMPLES[url])
        hit = next((c for c in cands if os.path.exists(c) and live_sha1 and sha(c, 'sha1') == live_sha1), None)
        if hit:
            shutil.copy2(hit, dest); origin = 'reused-cache:' + os.path.relpath(hit, ROOT)
        else:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60, context=CTX) as r, open(dest + '.part', 'wb') as f: shutil.copyfileobj(r, f)
            got = sha(dest + '.part', 'sha1')
            if live_sha1 and got != live_sha1:
                os.remove(dest + '.part'); rec.update(status='missing_source', reason='sha1 mismatch after download'); out.append(rec); continue
            os.replace(dest + '.part', dest); origin = 'downloaded'
    rec.update(status='source_ok', source_path=os.path.relpath(dest, ROOT), source_sha1=live_sha1,
               source_sha256=sha(dest, 'sha256'), source_bytes=os.path.getsize(dest), content_type=h.get('content-type'),
               b2_file_id=h.get('x-bz-file-id'), b2_upload_ts=h.get('x-bz-upload-timestamp'), origin=origin)
    out.append(rec)
    print(f"{d['name'][:24]:24} {rec['cover_type']:5} {origin[:40]:40} {rec.get('source_bytes',0):>8}")
json.dump(out, open(f'{ROOT}/inventory-2026-11-17/sources.json', 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(Counter(r['status'] for r in out), Counter(r.get('origin','-').split(':')[0] for r in out))
