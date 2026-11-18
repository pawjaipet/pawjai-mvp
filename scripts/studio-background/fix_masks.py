"""Hand-guided cut-out fixes for dogs whose v1.3 mask merged another dog or kept a hole.

For each dog: the reviewed v1.3 soft mask, plus hand-placed hints (boxes in work-image
pixels) for the other dog(s) to remove, seed an OpenCV GrabCut on the original photo.
The result only ever REMOVES area from the v1.3 mask (it never adds pixels), the cut is
softened with the same guided filter as the pipeline, and the fixed mask is written to
masks-fixed/<dog-id>/<source-sha1-12>.png, which run_pipeline.py prefers. A review overlay
is written next to it. Nothing is drawn onto the dog.
"""
import json, os, sys
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(__file__))
import studio_lib as S  # noqa: E402

ROOT = os.environ.get("PAWJAI_STUDIO_ROOT", os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study"))
INV = f"{ROOT}/inventory-2026-11-17"

# Boxes are [x0, y0, x1, y1] as fractions of the work image. "remove": the other dog(s);
# "keep": a core inside the listed dog that must stay; "holes": look for background seen
# through gaps inside the mask (e.g. a curled tail).
HINTS = {
    "เฮงเฮง (hong hong)": {"remove": [[0.46, 0.09, 0.61, 0.235]],
                           "keep": [[0.25, 0.36, 0.70, 0.74], [0.31, 0.245, 0.44, 0.30]]},
    "ยะลา (yala)": {"remove": [[0.615, 0.16, 0.745, 0.245]], "keep": [[0.36, 0.30, 0.64, 0.52], [0.64, 0.255, 0.72, 0.30]]},
    "Omega": {"remove": [[0.735, 0.35, 1.0, 0.86]], "keep": [[0.08, 0.36, 0.62, 0.62]]},
    "Jessica": {"remove": [[0.0, 0.31, 0.255, 0.47], [0.0, 0.0, 0.31, 0.58], [0.79, 0.09, 1.0, 0.17]],
                "keep": [[0.36, 0.26, 0.62, 0.62], [0.13, 0.25, 0.27, 0.30]], "keep_light_only": True},
    "Tua-tom": {"remove": [[0.88, 0.0, 1.0, 0.30], [0.66, 0.20, 0.80, 0.36]], "keep": [[0.30, 0.08, 0.66, 0.55], [0.72, 0.05, 0.85, 0.17]],
                "dilate": 0.012},
    "Gorya": {"colorkey": [[0.10, 0.12, 0.42, 0.40]], "key": [18.0, 38.0]},
    "แม่น้ำ (River)": {"ops": [
        {"op": "remove", "box": [0.195, 0.812, 0.296, 0.870], "bg": [{"L_max": 52, "b_max": 2}], "fg": [{"L_min": 60}, {"b_min": 22}]},
        {"op": "add", "box": [0.50, 0.855, 0.70, 0.900], "fg": [{"L_max": 40, "a_min": 8, "b_min": 8}, {"L_min": 82, "C_max": 12}], "bg": [{"C_max": 11, "b_max": 1}]},
        {"op": "add", "box": [0.0, 0.855, 0.215, 0.935], "fg": [{"b_min": 30, "a_min": 8}], "bg": [{"C_max": 10}]}]},
    "Butcher": {"ops": [
        {"op": "add", "box": [0.60, 0.715, 0.90, 0.80], "fg": [{"b_min": 30, "a_min": 8}], "bg": [{"C_max": 8, "L_min": 55}]},
        {"op": "remove", "box": [0.800, 0.752, 0.905, 0.80], "bg": [{"L_max": 60, "b_max": 22}], "fg": [{"b_min": 30, "a_min": 8}]},
        {"op": "add", "box": [0.435, 0.645, 0.525, 0.745], "fg": [{"C_min": 13, "L_min": 45}], "bg": [{"C_max": 8}]}]},
    "ตัวแดง (Tua Daang)": {"ops": [
        {"op": "remove", "box": [0.618, 0.190, 0.656, 0.228], "bg": [{"L_min": 72}], "fg": [{"L_max": 66}]}]},
    "Tua-lheung": {"ops": [
        {"op": "remove", "box": [0.768, 0.562, 0.808, 0.628], "bg": [{"C_max": 15, "L_max": 62}], "fg": [{"C_min": 22}]}]},
}


def box_px(b, W, H):
    return int(b[0] * W), int(b[1] * H), int(np.ceil(b[2] * W)), int(np.ceil(b[3] * H))


def colorkey_fix(src, alpha, boxes, sample=None, key_range=(16.0, 32.0)):
    """Remove the old wall colour seen through gaps inside the mask (e.g. a curled tail) and
    the blue fringe it leaves on soft fur, only inside the given boxes. Fur colours that are
    far from the wall colour are untouched."""
    H, W, _ = src.shape
    lab = S.skcolor.rgb2lab(src.astype(np.float64) / 255.0)
    region = np.zeros((H, W), bool)
    for b in boxes:
        x0, y0, x1, y1 = box_px(b, W, H)
        region[y0:y1, x0:x1] = True
    if sample:
        x0, y0, x1, y1 = box_px(sample, W, H)
        ring = np.zeros((H, W), bool); ring[y0:y1, x0:x1] = True
        ring &= alpha < 0.03
    else:
        ring = ndi.binary_dilation(region, iterations=40) & (alpha < 0.03)
    wall = np.median(lab[ring], axis=0)
    dist = np.linalg.norm(lab - wall[None, None, :], axis=2)
    lo, hi = key_range
    key = np.clip((hi - dist) / (hi - lo), 0, 1)  # 1 = old background colour, 0 = far from it
    new_alpha = np.where(region, alpha * (1 - key), alpha)
    return new_alpha.astype(np.float32), wall


def seeded_fix(src, alpha, box, bg_if, fg_if):
    """GrabCut inside one small box, seeded by colour: old-floor pixels (dark, bluish) are
    background seeds, leash/fur pixels (bright, or strongly orange) are foreground seeds.
    Outside the box nothing changes; inside it the mask can only lose area."""
    H, W, _ = src.shape
    x0, y0, x1, y1 = box_px(box, W, H)
    pad = 40
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    roi = src[Y0:Y1, X0:X1]
    a = alpha[Y0:Y1, X0:X1]
    lab = S.skcolor.rgb2lab(roi.astype(np.float64) / 255.0)
    inbox = np.zeros(a.shape, bool); inbox[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
    gc = np.where(a >= 0.5, cv2.GC_PR_FGD, cv2.GC_BGD).astype(np.uint8)
    gc[(a > 0.02) & (a < 0.5)] = cv2.GC_PR_BGD
    gc[~inbox & (a >= 0.5)] = cv2.GC_FGD
    bgs = inbox & (a >= 0.5) & (lab[..., 0] <= bg_if["L_max"]) & (lab[..., 2] <= bg_if["b_max"])
    fgs = inbox & (a >= 0.5) & ((lab[..., 0] >= fg_if["L_min"]) | (lab[..., 2] >= fg_if["b_min"]))
    gc[bgs] = cv2.GC_BGD
    gc[fgs] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(roi, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.float32)
    fg = ndi.gaussian_filter(fg, 1.0)
    new = alpha.copy()
    sub = new[Y0:Y1, X0:X1]
    sub[inbox] = np.minimum(sub[inbox], np.clip((fg[inbox] - 0.2) / 0.6, 0, 1))
    new[Y0:Y1, X0:X1] = sub
    return new.astype(np.float32), int(bgs.sum()), int(fgs.sum())


def _cond(lab, c):
    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(A, B)
    m = np.ones(L.shape, bool)
    for k, v in c.items():
        x = {"L": L, "a": A, "b": B, "C": C}[k.split("_")[0]]
        m &= (x >= v) if k.endswith("_min") else (x <= v)
    return m


def _any(lab, conds):
    m = np.zeros(lab.shape[:2], bool)
    for c in conds:
        m |= _cond(lab, c)
    return m


def seeded_op(src, alpha, op):
    """GrabCut inside one box, seeded by colour. 'remove' can only lower the mask there
    (old-background pixels kept by mistake); 'add' can only raise it (the dog's own tail or
    its leash that the first cut-out missed: original pixels, nothing drawn)."""
    H, W, _ = src.shape
    x0, y0, x1, y1 = box_px(op["box"], W, H)
    pad = 40
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    roi = src[Y0:Y1, X0:X1]
    a = alpha[Y0:Y1, X0:X1]
    lab = S.skcolor.rgb2lab(roi.astype(np.float64) / 255.0)
    inbox = np.zeros(a.shape, bool); inbox[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
    fgs = inbox & _any(lab, op["fg"])
    bgs = inbox & _any(lab, op["bg"]) & ~fgs
    if op["op"] == "remove":
        gc = np.where(a >= 0.5, cv2.GC_PR_FGD, cv2.GC_BGD).astype(np.uint8)
        gc[(a > 0.02) & (a < 0.5)] = cv2.GC_PR_BGD
        gc[~inbox & (a >= 0.5)] = cv2.GC_FGD
        gc[bgs & (a >= 0.5)] = cv2.GC_BGD
        gc[fgs & (a >= 0.5)] = cv2.GC_FGD
    else:
        gc = np.where(a >= 0.5, cv2.GC_FGD, cv2.GC_PR_BGD).astype(np.uint8)
        gc[~inbox & (a < 0.5)] = cv2.GC_BGD
        gc[inbox & (a < 0.5)] = cv2.GC_PR_BGD
        gc[fgs] = cv2.GC_FGD
        gc[bgs & (a < 0.5)] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(roi, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.float32)
    fg = ndi.gaussian_filter(fg, 1.0)
    soft = np.clip((fg - 0.2) / 0.6, 0, 1)
    new = alpha.copy()
    sub = new[Y0:Y1, X0:X1]
    if op["op"] == "remove":
        sub[inbox] = np.minimum(sub[inbox], soft[inbox])
    else:
        sub[inbox] = np.maximum(sub[inbox], soft[inbox])
    new[Y0:Y1, X0:X1] = sub
    return new.astype(np.float32), int(bgs.sum()), int(fgs.sum())


def fix(name, rec):
    hint = HINTS[name]
    if "ops" in hint:
        sha = rec["source_sha1"][:12]
        prev = f"{ROOT}/outputs/studio-bg-v1.3/{rec['dog_id']}/{sha}"
        im = Image.open(f"{ROOT}/{rec['source_path']}").convert("RGB")
        if max(im.size) > S.MAX_WORK_SIDE:
            sc = S.MAX_WORK_SIDE / max(im.size)
            im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
        src = np.asarray(im)
        alpha = np.asarray(Image.open(f"{prev}/mask.png").convert("L"), dtype=np.float32) / 255.0
        new_alpha = alpha.copy(); log = []
        for op in hint["ops"]:
            new_alpha, nb, nf = seeded_op(src, new_alpha, op)
            log.append(f"{op['op']} box {op['box']} (bg seeds {nb}, fg seeds {nf})")
        out_dir = f"{ROOT}/masks-fixed/{rec['dog_id']}"
        os.makedirs(out_dir, exist_ok=True)
        Image.fromarray(np.round(new_alpha * 255).astype(np.uint8)).save(f"{out_dir}/{sha}.png")
        added = (alpha < 0.5) & (new_alpha >= 0.5); removed = (alpha >= 0.5) & (new_alpha < 0.5)
        return {"name": name, "method": "colour-seeded GrabCut ops", "ops": log,
                "added_px": int(added.sum()), "removed_px": int(removed.sum())}
    if "seeded" in hint:
        sha = rec["source_sha1"][:12]
        prev = f"{ROOT}/outputs/studio-bg-v1.3/{rec['dog_id']}/{sha}"
        src = np.asarray(Image.open(f"{ROOT}/{rec['source_path']}").convert("RGB"))
        alpha = np.asarray(Image.open(f"{prev}/mask.png").convert("L"), dtype=np.float32) / 255.0
        new_alpha, nb, nf = seeded_fix(src, alpha, hint["seeded"], hint["bg_if"], hint["fg_if"])
        removed = (alpha >= 0.5) & (new_alpha < 0.5)
        out_dir = f"{ROOT}/masks-fixed/{rec['dog_id']}"
        os.makedirs(out_dir, exist_ok=True)
        Image.fromarray(np.round(new_alpha * 255).astype(np.uint8)).save(f"{out_dir}/{sha}.png")
        return {"name": name, "method": "colour-seeded GrabCut in one small box", "bg_seeds": nb, "fg_seeds": nf,
                "removed_fraction_of_v13_mask": round(float(removed.sum()) / max(1.0, float((alpha >= 0.5).sum())), 4)}
    if "colorkey" in hint:
        sha = rec["source_sha1"][:12]
        prev = f"{ROOT}/outputs/studio-bg-v1.3/{rec['dog_id']}/{sha}"
        im = Image.open(f"{ROOT}/{rec['source_path']}").convert("RGB")
        if max(im.size) > S.MAX_WORK_SIDE:
            sc = S.MAX_WORK_SIDE / max(im.size)
            im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
        src = np.asarray(im)
        alpha = np.asarray(Image.open(f"{prev}/mask.png").convert("L"), dtype=np.float32) / 255.0
        new_alpha, wall = colorkey_fix(src, alpha, hint["colorkey"], hint.get("sample"), tuple(hint.get("key", (16.0, 32.0))))
        removed = (alpha >= 0.5) & (new_alpha < 0.5)
        out_dir = f"{ROOT}/masks-fixed/{rec['dog_id']}"
        os.makedirs(out_dir, exist_ok=True)
        Image.fromarray(np.round(new_alpha * 255).astype(np.uint8)).save(f"{out_dir}/{sha}.png")
        a3 = new_alpha[..., None]
        ov = src.astype(np.float32) * (0.3 + 0.7 * a3) + np.array([0, 90, 255]) * (1 - a3) * 0.5
        ov = np.where(removed[..., None], ov * 0.5 + np.array([255, 40, 40]) * 0.5, ov)
        Image.fromarray(np.clip(ov, 0, 255).astype(np.uint8)).save(f"{out_dir}/{sha}-review.jpg", quality=88)
        return {"name": name, "method": "colour key of the wall inside the tail area", "wall_lab": [round(float(v), 1) for v in wall],
                "removed_fraction_of_v13_mask": round(float(removed.sum()) / max(1.0, float((alpha >= 0.5).sum())), 4)}
    sha = rec["source_sha1"][:12]
    prev = f"{ROOT}/outputs/studio-bg-v1.3/{rec['dog_id']}/{sha}"
    im = Image.open(f"{ROOT}/{rec['source_path']}").convert("RGB")
    if max(im.size) > S.MAX_WORK_SIDE:
        sc = S.MAX_WORK_SIDE / max(im.size)
        im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
    src = np.asarray(im)
    H, W, _ = src.shape
    alpha = np.asarray(Image.open(f"{prev}/mask.png").convert("L"), dtype=np.float32) / 255.0
    # GrabCut at ~1100 px long side
    f = min(1.0, 1100.0 / max(H, W))
    small = cv2.resize(src, (round(W * f), round(H * f)), interpolation=cv2.INTER_AREA)
    a_s = cv2.resize(alpha, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_AREA)
    h, w = a_s.shape
    gc = np.full((h, w), cv2.GC_BGD, np.uint8)
    gc[a_s >= 0.5] = cv2.GC_PR_FGD
    gc[(a_s > 0.02) & (a_s < 0.5)] = cv2.GC_PR_BGD
    for b in hint.get("remove", []):
        x0, y0, x1, y1 = box_px(b, w, h)
        region = gc[y0:y1, x0:x1]
        region[region == cv2.GC_PR_FGD] = cv2.GC_PR_BGD
        core_bg = np.zeros((h, w), bool)
        cx0, cy0 = x0 + (x1 - x0) // 4, y0 + (y1 - y0) // 4
        cx1, cy1 = x1 - (x1 - x0) // 4, y1 - (y1 - y0) // 4
        core_bg[cy0:cy1, cx0:cx1] = True
        gc[core_bg & (a_s >= 0.5)] = cv2.GC_BGD
    keep = np.zeros((h, w), bool)
    for b in hint.get("keep", []):
        x0, y0, x1, y1 = box_px(b, w, h)
        keep[y0:y1, x0:x1] = True
    lab_s = S.skcolor.rgb2lab(small.astype(np.float64) / 255.0)
    if hint.get("keep_light_only"):
        keep &= lab_s[..., 0] > 40  # light-coated dog next to a black dog: never seed the black fur as "keep"
    core = keep & ndi.binary_erosion(a_s >= 0.5, iterations=6)
    gc[core] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = (gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)
    # keep the component(s) connected to the listed dog's core
    lab, n = ndi.label(fg)
    ids = set(np.unique(lab[core])) - {0}
    fg = np.isin(lab, list(ids)) if ids else fg
    if not hint.get("holes"):
        fg = ndi.binary_fill_holes(fg)
    fg = ndi.binary_opening(fg, iterations=1)
    big = cv2.resize(fg.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
    big = ndi.gaussian_filter(big, 1.2)
    cut = np.clip((big - 0.25) / 0.5, 0, 1)
    # removal is only allowed around the hand-marked other dog(s) / hole area, never elsewhere
    allowed = np.zeros((H, W), bool)
    for b in hint.get("remove", []) + hint.get("allow", []):
        x0, y0, x1, y1 = box_px(b, W, H)
        allowed[y0:y1, x0:x1] = True
    allowed = ndi.binary_dilation(allowed, iterations=max(4, int(hint.get("dilate", 0.03) * min(H, W))))
    new_alpha = np.where(allowed, np.minimum(alpha, cut), alpha)  # only ever removes area from the reviewed mask
    removed = (alpha >= 0.5) & (new_alpha < 0.5)
    # soften only where the cut is new, with the pipeline's guided filter
    near_cut = ndi.binary_dilation(removed, iterations=6)
    refined = S.refine_alpha(src, new_alpha)
    new_alpha = np.where(near_cut, np.minimum(refined, alpha), new_alpha).astype(np.float32)
    out_dir = f"{ROOT}/masks-fixed/{rec['dog_id']}"
    os.makedirs(out_dir, exist_ok=True)
    Image.fromarray(np.round(new_alpha * 255).astype(np.uint8)).save(f"{out_dir}/{sha}.png")
    a3 = new_alpha[..., None]
    ov = src.astype(np.float32) * (0.3 + 0.7 * a3) + np.array([0, 90, 255]) * (1 - a3) * 0.5
    rem = removed[..., None]
    ov = np.where(rem, ov * 0.5 + np.array([255, 40, 40]) * 0.5, ov)
    Image.fromarray(np.clip(ov, 0, 255).astype(np.uint8)).save(f"{out_dir}/{sha}-review.jpg", quality=88)
    frac = float(removed.sum()) / max(1.0, float((alpha >= 0.5).sum()))
    return {"name": name, "removed_fraction_of_v13_mask": round(frac, 4), "size": [W, H]}


if __name__ == "__main__":
    recs = {r["name"]: r for r in json.load(open(f"{INV}/sources.json"))}
    only = sys.argv[1:] or list(HINTS)
    for n in only:
        print(json.dumps(fix(n, recs[n]), ensure_ascii=False))
