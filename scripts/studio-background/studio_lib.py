"""PAWJAI studio-background pipeline: local, free, pixel-preserving.

Mask -> composite -> QA. The dog's own pixels are kept: every pixel the mask
marks fully opaque is copied byte-for-byte from the original. Only the
background is replaced (procedural off-white seamless sweep calibrated to the
founder's two real studio references) and only semi-transparent edge pixels are
decontaminated (old background colour removed from fur edges).

No generative model touches the dog. Segmentation: Apple Vision subject lift
(VNGenerateForegroundInstanceMaskRequest) + VNRecognizeAnimalsRequest (to pick
the dog instance) + VNDetectHumanRectanglesRequest (to flag hands/people).
"""
from __future__ import annotations

import hashlib
import math

import numpy as np
from scipy import ndimage as ndi
from skimage import color as skcolor

import os as _os
# v1.3: smooth paper sweep (shipped 17 Nov, superseded). v2.0: matte off-white tarp with
# irregular tone, faint fabric ripples/creases shaded by the light, light direction
# measured on the dog, contact shadows plus a restrained cast shadow (owner brief, 17 Nov).
PIPELINE_VERSION = _os.environ.get("PAWJAI_STUDIO_PIPELINE", "studio-bg-v3.3")
MAX_WORK_SIDE = 2400  # long side; matches the import pipeline (1800x2400 max)

# Calibrated from reference-white.jpg (genuine founder studio photo; it is the
# live cover of one listed dog). Values are CIELAB L*/a*/b* medians measured
# in background strips at 10 vertical bands (see STUDIO-AB-LOG.md).
WHITE_PROFILE = {
    # position keys: 'top', 'above' (0.2H above sweep), 'sweep', 'front' (bright floor
    # just in front of the sweep), 'near' (further in front), 'bottom'
    "top": (86.3, 0.8, -1.5),
    "above": (88.4, 0.9, 0.4),
    "sweep": (90.6, 0.9, 1.6),
    "front": (94.2, 0.7, 2.6),
    "near": (94.8, 0.6, 2.8),
    "bottom": (89.6, 0.6, 2.6),
}
# reference-warm.jpg is a darker, warmer cream paper (L*~60, b*~+11..+21). For
# an off-white result we keep its chroma direction but lift it toward the white
# reference; `warmth` interpolates between the two.
WARM_PROFILE = {
    "top": (80.5, 0.2, 9.5),
    "above": (82.0, 0.4, 11.0),
    "sweep": (83.0, 0.6, 12.5),
    "front": (86.5, 0.6, 14.5),
    "near": (87.0, 0.5, 15.0),
    "bottom": (83.5, 0.3, 13.5),
}


def seed_for(*parts: str) -> int:
    return int(hashlib.sha256("|".join(parts).encode()).hexdigest()[:8], 16)


def srgb_to_linear(c: np.ndarray) -> np.ndarray:
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c: np.ndarray) -> np.ndarray:
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- Vision ----

def _pixelbuffer_to_np(pb):
    import Quartz
    Quartz.CVPixelBufferLockBaseAddress(pb, 1)
    try:
        w = Quartz.CVPixelBufferGetWidth(pb)
        h = Quartz.CVPixelBufferGetHeight(pb)
        bpr = Quartz.CVPixelBufferGetBytesPerRow(pb)
        fmt = Quartz.CVPixelBufferGetPixelFormatType(pb)
        buf = Quartz.CVPixelBufferGetBaseAddress(pb).as_buffer(bpr * h)
        if fmt == Quartz.kCVPixelFormatType_OneComponent32Float:
            return np.frombuffer(buf, dtype=np.float32).reshape(h, bpr // 4)[:, :w].copy()
        if fmt == Quartz.kCVPixelFormatType_OneComponent8:
            return np.frombuffer(buf, dtype=np.uint8).reshape(h, bpr)[:, :w].copy()
        raise RuntimeError(f"unexpected pixel format {fmt}")
    finally:
        Quartz.CVPixelBufferUnlockBaseAddress(pb, 1)


def _box_px(bb, W, H):
    """Vision normalized bbox (origin bottom-left) -> pixel (x0, y0, x1, y1) top-left origin."""
    x0 = bb.origin.x * W
    x1 = (bb.origin.x + bb.size.width) * W
    y1 = (1 - bb.origin.y) * H
    y0 = (1 - bb.origin.y - bb.size.height) * H
    return [float(x0), float(y0), float(x1), float(y1)]


def segment(path: str, W: int, H: int) -> dict:
    """Run Vision once; return per-instance full-res soft masks and detections."""
    import Vision
    from Foundation import NSURL, NSIndexSet

    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(path), {})
    fg = Vision.VNGenerateForegroundInstanceMaskRequest.alloc().init()
    animals = Vision.VNRecognizeAnimalsRequest.alloc().init()
    humans = Vision.VNDetectHumanRectanglesRequest.alloc().init()
    ok, err = handler.performRequests_error_([fg, animals, humans], None)
    if not ok:
        raise RuntimeError(f"Vision failed: {err}")
    out = {"instances": [], "animals": [], "humans": []}
    for a in animals.results() or []:
        labels = [(str(l.identifier()), float(l.confidence())) for l in a.labels()]
        out["animals"].append({"labels": labels, "box": _box_px(a.boundingBox(), W, H)})
    for h in humans.results() or []:
        out["humans"].append({"confidence": float(h.confidence()), "box": _box_px(h.boundingBox(), W, H)})
    results = fg.results() or []
    if not results:
        return out
    obs = results[0]
    inst = obs.allInstances()
    idx = inst.firstIndex()
    while idx != Foundation_NSNotFound():
        pb, err = obs.generateScaledMaskForImageForInstances_fromRequestHandler_error_(
            NSIndexSet.indexSetWithIndex_(idx), handler, None)
        if pb is None:
            raise RuntimeError(f"mask failed: {err}")
        m = _pixelbuffer_to_np(pb).astype(np.float32)
        if m.shape != (H, W):
            raise RuntimeError(f"mask shape {m.shape} != image {(H, W)}")
        out["instances"].append({"index": int(idx), "mask": np.clip(m, 0, 1)})
        idx = inst.indexGreaterThanIndex_(idx)
    return out


def Foundation_NSNotFound():
    import Foundation
    return Foundation.NSNotFound


# ------------------------------------------------------ instance selection --

def _box_area(b):
    return max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])


def _mask_frac_in_box(mask, box):
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    H, W = mask.shape
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(W, x1), min(H, y1)
    total = float(mask.sum()) or 1.0
    return float(mask[y0:y1, x0:x1].sum()) / total


def select_dog(seg: dict, W: int, H: int) -> dict:
    """Choose the listing dog among Vision instances; report hard-case flags."""
    flags = []
    dogs = [a for a in seg["animals"] if any(l == "Dog" and c >= 0.25 for l, c in a["labels"])]
    cats = [a for a in seg["animals"] if any(l == "Cat" and c >= 0.5 for l, c in a["labels"]) and a not in dogs]
    if not seg["instances"]:
        return {"selected": [], "flags": ["no_foreground_instance"], "primary_box": None}
    if not dogs:
        flags.append("no_dog_detected")
        # fall back to the largest instance
        best = max(seg["instances"], key=lambda i: float(i["mask"].sum()))
        primary_box = None
        selected = [best]
    else:
        def score(a):
            area = _box_area(a["box"]) / (W * H)
            cx = (a["box"][0] + a["box"][2]) / 2 / W
            cy = (a["box"][1] + a["box"][3]) / 2 / H
            central = 1.0 - min(1.0, math.hypot(cx - 0.5, cy - 0.55) / 0.75)
            conf = max(c for l, c in a["labels"] if l == "Dog")
            return area * (0.6 + 0.4 * central) * (0.5 + 0.5 * conf)
        dogs_sorted = sorted(dogs, key=score, reverse=True)
        primary = dogs_sorted[0]
        primary_box = primary["box"]
        selected = [i for i in seg["instances"] if _mask_frac_in_box(i["mask"], _expand(primary_box, W, H, 0.06)) >= 0.5]
        if not selected:
            flags.append("no_instance_matches_dog_box")
            best = max(seg["instances"], key=lambda i: _mask_frac_in_box(i["mask"], primary_box) * float(i["mask"].sum()))
            selected = [best]
        others = dogs_sorted[1:]
        if others:
            flags.append(f"other_dogs_detected:{len(others)}")
            union = np.maximum.reduce([i["mask"] for i in selected])
            for o in others:
                # how much of the selected subject lies inside another dog's box but outside the primary box
                ob = o["box"]
                frac_other = _mask_frac_in_box(union * _outside_box_mask(primary_box, W, H), ob)
                inter = _box_intersection(ob, primary_box)
                if frac_other > 0.04 or (inter / max(1.0, _box_area(ob))) > 0.25:
                    flags.append("other_dog_overlaps_subject")
                    break
    if cats:
        flags.append(f"cats_detected:{len(cats)}")
    if len(seg["instances"]) > len(selected):
        flags.append(f"extra_foreground_instances:{len(seg['instances']) - len(selected)}")
    union = np.maximum.reduce([i["mask"] for i in selected])
    for h in seg["humans"]:
        if h["confidence"] >= 0.3 and _mask_frac_in_box(union, h["box"]) > 0.02:
            flags.append("person_or_hand_overlaps_subject")
            break
    else:
        if any(h["confidence"] >= 0.3 for h in seg["humans"]):
            flags.append("person_in_frame")
    return {"selected": selected, "flags": flags, "primary_box": primary_box}


def _expand(box, W, H, frac):
    w, h = box[2] - box[0], box[3] - box[1]
    return [max(0, box[0] - w * frac), max(0, box[1] - h * frac), min(W, box[2] + w * frac), min(H, box[3] + h * frac)]


def _outside_box_mask(box, W, H):
    m = np.ones((H, W), dtype=np.float32)
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    m[max(0, y0):max(0, y1), max(0, x0):max(0, x1)] = 0
    return m


def _box_intersection(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[2], b[2]), min(a[3], b[3])
    return max(0.0, x1 - x0) * max(0.0, y1 - y0)


# --------------------------------------------------------------- matting ---

def clean_alpha(alpha: np.ndarray) -> np.ndarray:
    """Drop small disconnected specks far from the main subject; keep soft edges."""
    hard = alpha > 0.5
    lab, n = ndi.label(hard)
    if n <= 1:
        return alpha
    sizes = ndi.sum(hard, lab, index=np.arange(1, n + 1))
    keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= 0.01 * sizes.max()]
    keep = np.isin(lab, keep_ids)
    # soft pixels survive only near kept components
    near = ndi.binary_dilation(keep, iterations=max(3, int(0.004 * max(alpha.shape))))
    return np.where(near, alpha, 0.0).astype(np.float32)


def decontaminate(src_lin: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Estimate true foreground colour F where alpha is fractional.

    C = a*F + (1-a)*B_old. B_old is propagated from nearby confident background
    (normalized convolution); F is solved and blended toward the local confident
    foreground colour where alpha is small. Opaque pixels are untouched (F = C).
    """
    H, W, _ = src_lin.shape
    s = min(H, W)
    a = alpha[..., None]
    wb = (1.0 - alpha) ** 2
    sig_b = max(2.0, 0.012 * s)
    num_b = np.stack([ndi.gaussian_filter(src_lin[..., c] * wb, sig_b) for c in range(3)], -1)
    den_b = ndi.gaussian_filter(wb, sig_b)[..., None] + 1e-6
    b_old = num_b / den_b
    wf = alpha ** 4
    sig_f = max(1.5, 0.006 * s)
    num_f = np.stack([ndi.gaussian_filter(src_lin[..., c] * wf, sig_f) for c in range(3)], -1)
    den_f = ndi.gaussian_filter(wf, sig_f)[..., None] + 1e-6
    f_near = num_f / den_f
    f_solve = (src_lin - (1.0 - a) * b_old) / np.maximum(a, 1e-3)
    f_solve = np.clip(f_solve, 0.0, 1.0)
    # v1.2: colour comes from the adjacent opaque fur (no hue fringe of the old
    # background); keep only a clamped luminance ratio from the solved colour so
    # some edge texture survives without bright or dark rims.
    lum = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    y_solve = (f_solve * lum).sum(-1, keepdims=True)
    y_near = (f_near * lum).sum(-1, keepdims=True) + 1e-4
    ratio = np.clip(y_solve / y_near, 0.85, 1.15)
    f_edge = np.clip(f_near * ratio, 0.0, 1.0)
    w = smoothstep(0.995, 0.75, alpha)[..., None]  # 0 for opaque, 1 for clearly fractional
    f = (1 - w) * src_lin + w * f_edge
    opaque = alpha >= 0.996
    f[opaque] = src_lin[opaque]
    return np.clip(f, 0.0, 1.0)


# ------------------------------------------------------------ background ---

def _lab_profile(profile_a: dict, profile_b: dict, warmth: float, lum_shift: float):
    out = {}
    for k in profile_a:
        la, aa, ba = profile_a[k]
        lb, ab, bb = profile_b[k]
        out[k] = (la + (lb - la) * warmth + lum_shift, aa + (ab - aa) * warmth, ba + (bb - ba) * warmth)
    return out


def _smooth_noise(H, W, scale_px, rng):
    gh, gw = max(2, int(H / scale_px) + 3), max(2, int(W / scale_px) + 3)
    g = rng.standard_normal((gh, gw)).astype(np.float32)
    z = ndi.zoom(g, (H / (gh - 2), W / (gw - 2)), order=3)[:H, :W]
    z = ndi.gaussian_filter(z, scale_px * 0.25)
    return z / (z.std() + 1e-6)


def sweep_background(H, W, *, horizon: float, warmth: float, lum_shift: float, light_dir: int,
                     rng: np.random.Generator) -> np.ndarray:
    """Seamless paper sweep in CIELAB -> linear RGB. horizon = y of sweep curve (0..1)."""
    prof = _lab_profile(WHITE_PROFILE, WARM_PROFILE, warmth, lum_shift)
    yh = float(np.clip(horizon, 0.12, 0.92))
    # control points (y, key); clipped to the frame
    pts = [(0.0, "top"), (yh - 0.20, "above"), (yh, "sweep"), (yh + 0.10, "front"),
           (yh + 0.20, "near"), (1.0, "bottom")]
    pts = [(y, k) for y, k in pts if 0.0 <= y <= 1.0] if yh + 0.2 < 1.0 else \
        [(0.0, "top"), (yh - 0.2, "above"), (yh, "sweep"), (min(0.999, yh + 0.08), "front"), (1.0, "near")]
    pts = sorted({round(y, 4): k for y, k in pts}.items())
    ys = np.array([p[0] for p in pts])
    vals = np.array([prof[p[1]] for p in pts], dtype=np.float32)
    yy = (np.arange(H, dtype=np.float32) + 0.5) / H
    col = np.stack([np.interp(yy, ys, vals[:, c]) for c in range(3)], -1)  # H x 3
    col = ndi.gaussian_filter1d(col, sigma=max(2.0, 0.04 * H), axis=0, mode="nearest")
    lab = np.repeat(col[:, None, :], W, axis=1)
    # gentle shading where the paper curves (slight dip just above the sweep)
    curve = np.exp(-(((yy - (yh - 0.035)) / 0.06) ** 2))[:, None]
    lab[..., 0] -= 1.4 * curve
    xx = (np.arange(W, dtype=np.float32) + 0.5) / W
    # key light from one side + soft vignette + low-frequency unevenness
    side = (xx - 0.5)[None, :] * light_dir
    lab[..., 0] += -2.2 * side
    r = np.hypot((xx[None, :] - 0.5) / 0.75, (yy[:, None] - 0.55) / 0.85)
    lab[..., 0] -= 3.0 * np.clip(r - 0.45, 0, None) ** 1.6
    lab[..., 0] += 0.9 * _smooth_noise(H, W, 0.35 * max(H, W), rng)
    lab[..., 2] += 0.35 * _smooth_noise(H, W, 0.45 * max(H, W), rng)
    rgb = skcolor.lab2rgb(lab.astype(np.float64)).astype(np.float32)
    return srgb_to_linear(np.clip(rgb, 0, 1))


def estimate_grain(src_srgb: np.ndarray, alpha: np.ndarray) -> float:
    """Noise level of the source (sRGB, 0..1) measured in the subject interior."""
    g = src_srgb.mean(axis=2)
    hp = g - ndi.gaussian_filter(g, 1.2)
    interior = ndi.binary_erosion(alpha > 0.99, iterations=4)
    region = hp[interior] if interior.sum() > 5000 else hp
    mad = np.median(np.abs(region - np.median(region)))
    return float(np.clip(1.4826 * mad, 0.0015, 0.012))


# -------------------------------------------------------------- composite --

def subject_extent(alpha: np.ndarray):
    rows = np.where((alpha > 0.5).any(axis=1))[0]
    cols = np.where((alpha > 0.5).any(axis=0))[0]
    if rows.size == 0:
        return None
    H, W = alpha.shape
    edge = max(2, int(0.004 * H))
    touches = {
        "top": bool((alpha[:edge] > 0.5).any()),
        "bottom": bool((alpha[-edge:] > 0.5).any()),
        "left": bool((alpha[:, :edge] > 0.5).any()),
        "right": bool((alpha[:, -edge:] > 0.5).any()),
    }
    return {"top": int(rows[0]), "bottom": int(rows[-1]), "left": int(cols[0]), "right": int(cols[-1]), "touches": touches}


def composite(src_u8: np.ndarray, alpha: np.ndarray, *, dog_id: str, source_sha1: str) -> tuple[np.ndarray, dict]:
    if PIPELINE_VERSION.startswith("studio-bg-v3"):
        return composite_v3(src_u8, alpha, dog_id=dog_id, source_sha1=source_sha1)
    if not PIPELINE_VERSION.startswith("studio-bg-v1"):
        return composite_v2(src_u8, alpha, dog_id=dog_id, source_sha1=source_sha1)
    H, W, _ = src_u8.shape
    # A chroma "despill" of opaque edge pixels was tried (v1.4) and not adopted:
    # every opaque dog pixel stays byte-identical to the original.
    src = src_u8.astype(np.float32) / 255.0
    src_lin = srgb_to_linear(src)
    ext = subject_extent(alpha)
    rng = np.random.default_rng(seed_for(dog_id, source_sha1, PIPELINE_VERSION))
    light_dir = 1 if seed_for(dog_id, "light") % 2 else -1
    contact = None if ext["touches"]["bottom"] else ext["bottom"]
    top = ext["top"]
    # v1.1: floor-dominant sweep. The paper curve sits just above the dog's head
    # so the dog always rests on the paper floor; this reads correctly for both
    # eye-level and top-down phone shots (no false horizon through the body).
    horizon = max(0.06, (top - 0.05 * H) / H)
    # palette: follow the source light. Gray-world b* of the original background.
    bg_w = (1 - alpha) > 0.5
    lab_src = skcolor.rgb2lab(src[::4, ::4].astype(np.float64))
    bgm = bg_w[::4, ::4]
    b_bg = float(np.median(lab_src[..., 2][bgm])) if bgm.sum() > 500 else 8.0
    warmth = float(np.clip((b_bg - 6.0) / 20.0, 0.0, 0.55))
    fgm = (alpha > 0.95)[::4, ::4]
    subj_L = lab_src[..., 0][fgm] if fgm.sum() > 200 else lab_src[..., 0].ravel()
    subj_p90 = float(np.percentile(subj_L, 90))
    # White dogs need a slightly deeper paper for separation (white-on-white).
    lum_shift = -float(np.clip((subj_p90 - 80.0) * 0.45, 0.0, 7.0))
    bg_lin = sweep_background(H, W, horizon=horizon, warmth=warmth, lum_shift=lum_shift,
                              light_dir=light_dir, rng=rng)
    bg_lin *= contact_shadows(alpha, top, ext["bottom"], light_dir)[..., None]
    # match the photograph's grain on the paper so it does not look pasted
    grain = estimate_grain(src, alpha)
    bg_srgb = linear_to_srgb(bg_lin)
    noise = rng.standard_normal((H, W, 1)).astype(np.float32) * grain + \
        rng.standard_normal((H, W, 3)).astype(np.float32) * grain * 0.25
    bg_srgb = np.clip(bg_srgb + noise, 0, 1)
    bg_lin = srgb_to_linear(bg_srgb)
    fg_lin = decontaminate(src_lin, alpha)
    a = alpha[..., None]
    out_lin = a * fg_lin + (1 - a) * bg_lin
    out = np.clip(np.round(linear_to_srgb(out_lin) * 255.0), 0, 255).astype(np.uint8)
    opaque = alpha >= 0.996
    out[opaque] = src_u8[opaque]  # dog interior is the original photograph, byte for byte
    params = {
        "pipeline": PIPELINE_VERSION, "horizon": round(horizon, 4), "warmth": round(warmth, 3),
        "lum_shift": round(lum_shift, 2), "light_dir": light_dir, "grain": round(grain, 4),
        "contact_y": contact, "subject": ext, "bg_b_star": round(b_bg, 2), "subject_L_p90": round(subj_p90, 1),
    }
    return out, params


def qa_metrics(src_u8: np.ndarray, out_u8: np.ndarray, alpha: np.ndarray) -> dict:
    opaque = alpha >= 0.996
    identical = bool(np.array_equal(out_u8[opaque], src_u8[opaque]))
    soft = (alpha > 0.04) & (alpha < 0.96)
    subj = alpha > 0.5
    # contrast between the subject's rim and the new paper just outside it
    rim_in = subj & ~ndi.binary_erosion(subj, iterations=6)
    rim_out = ndi.binary_dilation(subj, iterations=10) & ~ndi.binary_dilation(subj, iterations=4)
    L_out = skcolor.rgb2lab(out_u8.astype(np.float64) / 255.0)[..., 0]
    d_rim = float(abs(np.median(L_out[rim_in]) - np.median(L_out[rim_out]))) if rim_in.any() and rim_out.any() else None
    return {
        "subject_fraction": round(float(alpha.mean()), 4),
        "opaque_pixels": int(opaque.sum()),
        "opaque_pixels_identical": identical,
        "soft_edge_ratio": round(float(soft.sum()) / max(1, int(subj.sum())), 4),
        "rim_contrast_L": None if d_rim is None else round(d_rim, 1),
    }


# ------------------------------------------------- v1.1 refinements ---------

def _box(img, r):
    return ndi.uniform_filter(img, size=2 * r + 1, mode="reflect")


def guided_alpha(src: np.ndarray, alpha: np.ndarray, r: int, eps: float) -> np.ndarray:
    """Colour guided filter (He et al.) of alpha with the photo as guide."""
    I = src.astype(np.float32)
    p = alpha.astype(np.float32)
    mean_I = np.stack([_box(I[..., c], r) for c in range(3)], -1)
    mean_p = _box(p, r)
    cov_Ip = np.stack([_box(I[..., c] * p, r) for c in range(3)], -1) - mean_I * mean_p[..., None]
    var = np.empty(I.shape[:2] + (3, 3), np.float32)
    for i in range(3):
        for j in range(i, 3):
            v = _box(I[..., i] * I[..., j], r) - mean_I[..., i] * mean_I[..., j]
            var[..., i, j] = v
            var[..., j, i] = v
    var += eps * np.eye(3, dtype=np.float32)
    a = np.linalg.solve(var, cov_Ip[..., None])[..., 0]
    b = mean_p - (a * mean_I).sum(-1)
    mean_a = np.stack([_box(a[..., c], r) for c in range(3)], -1)
    mean_b = _box(b, r)
    return np.clip((mean_a * I).sum(-1) + mean_b, 0.0, 1.0)


def refine_alpha(src_u8: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Align Vision's smooth mask with real fur edges, only inside a thin band."""
    H, W = alpha.shape
    s = min(H, W)
    src = src_u8.astype(np.float32) / 255.0
    r = max(3, int(round(0.004 * s)))
    band_r = max(4, int(round(0.007 * s)))
    hard = alpha > 0.5
    band = ndi.binary_dilation(hard, iterations=band_r) & ~ndi.binary_erosion(hard, iterations=band_r)
    q = guided_alpha(src, alpha, r, 2e-3)
    out = alpha.copy()
    out[band] = q[band]
    # never invent subject far outside Vision's mask, never punch holes deep inside it
    out = np.minimum(out, ndi.maximum_filter(alpha, size=2 * band_r + 1))
    out = np.maximum(out, ndi.minimum_filter(alpha, size=2 * band_r + 1))
    return np.clip(ndi.gaussian_filter(out, 0.6), 0.0, 1.0).astype(np.float32)


# ------------------------------------------------------- v1.3 shadows -------

def contact_shadows(alpha: np.ndarray, top_y: int, bottom_y: int, light_dir: int) -> np.ndarray:
    """Shadow factor from ground-contact points only (v1.3).

    For each column the lowest subject pixel is a contact candidate when it is
    near the local floor level (running max over a window, so paws at different
    depths in top-down shots each count) AND in the lower part of the dog. The
    shadow lies directly below those points. Slanted leg edges, bellies above
    the floor, heads and ears never cast an outline-like rim.
    """
    H, W = alpha.shape
    s = min(H, W)
    height = max(1, bottom_y - top_y)
    sub = alpha > 0.5
    has = sub.any(axis=0)
    yb = np.where(has, H - 1 - np.argmax(sub[::-1, :], axis=0), -1).astype(np.float32)
    win = max(3, int(0.08 * W))
    ylocal = ndi.maximum_filter1d(np.where(has, yb, -1.0), size=2 * win + 1)
    w_local = smoothstep(ylocal - 0.10 * height, ylocal - 0.015 * height, yb)
    w_global = smoothstep(top_y + 0.68 * height, top_y + 0.84 * height, yb)
    weight = np.where(has, w_local * w_global, 0.0).astype(np.float32)
    weight = ndi.gaussian_filter1d(weight, max(1.0, 0.003 * W))
    yy = np.arange(H, dtype=np.float32)[:, None]
    d = yy - yb[None, :]
    lc, ls = max(2.0, 0.007 * s), max(6.0, 0.03 * s)
    below = d > 0
    contact = np.where(below, np.exp(-np.clip(d, 0, None) / lc), 0.0) * weight[None, :]
    soft = np.where(below, np.exp(-np.clip(d, 0, None) / ls), 0.0) * weight[None, :]
    contact = ndi.gaussian_filter(contact, (max(1.0, 0.0015 * s), max(1.5, 0.004 * s)))
    soft = ndi.gaussian_filter(soft, max(3.0, 0.014 * s))
    factor = (1.0 - 0.50 * np.clip(contact, 0, 1)) * (1.0 - 0.20 * np.clip(soft * 1.4, 0, 1))
    cast = ndi.shift(ndi.gaussian_filter(soft, 0.02 * s), (0.004 * H, 0.025 * W * light_dir), order=1, mode="constant")
    factor *= 1.0 - 0.06 * np.clip(cast * 1.5, 0, 1)
    return factor.astype(np.float32)


def select_dog_v2(seg: dict, W: int, H: int) -> dict:
    """v1.3 selection: the main instance is the one with most mass inside the
    primary dog box; extra instances join only if mostly inside that box and
    not centred inside another detected dog's box."""
    base = select_dog(seg, W, H)
    if not base.get("primary_box") or len(seg["instances"]) < 2:
        return base
    primary = base["primary_box"]
    others = [a["box"] for a in seg["animals"]
              if any(l == "Dog" and c >= 0.25 for l, c in a["labels"]) and a["box"] != primary]

    def inside(inst, box):
        return _mask_frac_in_box(inst["mask"], box)

    main = max(seg["instances"], key=lambda i: inside(i, primary) * float(i["mask"].sum()))
    selected = [main]
    for inst in seg["instances"]:
        if inst is main or inside(inst, _expand(primary, W, H, 0.06)) < 0.7:
            continue
        ys, xs = np.nonzero(inst["mask"] > 0.5)
        if ys.size == 0:
            continue
        cy, cx = float(ys.mean()), float(xs.mean())
        if any(b[0] <= cx <= b[2] and b[1] <= cy <= b[3] for b in others):
            base["flags"].append("excluded_instance_inside_other_dog_box")
            continue
        selected.append(inst)
    base["selected"] = selected
    return base




# ------------------------------------------------------------------ v2.0 --
# Matte tarp backdrop + light matched to the dog + restrained cast shadow.

def estimate_light(src: np.ndarray, alpha: np.ndarray) -> tuple[float, float]:
    """(light_x, harshness) from the dog's own shading.

    light_x in [-1, 1]: >0 when the viewer-right side of the dog is brighter
    (median L* of the right third vs the left third of the body). harshness in
    [0, 1]: spread between the dog's bright and median tones (hard sun -> high).
    """
    lab = skcolor.rgb2lab(src[::4, ::4].astype(np.float64))
    m = alpha[::4, ::4] > 0.98
    ys, xs = np.nonzero(m)
    if xs.size < 400:
        return 0.0, 0.3
    L = lab[..., 0][ys, xs]
    xl, xr = np.percentile(xs, 33), np.percentile(xs, 67)
    dog_diff = float(np.median(L[xs >= xr]) - np.median(L[xs <= xl]))
    bg = alpha[::4, ::4] < 0.02
    Lall = lab[..., 0]
    w3 = max(1, Lall.shape[1] // 3)
    bl, br = bg[:, :w3], bg[:, -w3:]
    bg_diff = float(np.median(Lall[:, -w3:][br]) - np.median(Lall[:, :w3][bl])) if bl.sum() > 200 and br.sum() > 200 else 0.0
    light_x = float(np.clip(0.5 * dog_diff / 20.0 + 0.5 * bg_diff / 25.0, -0.7, 0.7))
    harsh = float(np.clip((np.percentile(L, 97) - np.percentile(L, 50)) / 45.0, 0.0, 1.0))
    return light_x, harsh


def _emboss(height: np.ndarray, lx: float, ly: float) -> np.ndarray:
    gy, gx = np.gradient(height)
    return -(gx * lx + gy * ly)


def _crease_field(H, W, horizon_px, rng, n_wall, n_floor, s):
    """Thin, tapered crease lines (wall: near-vertical folds; floor: shallow, foreshortened)."""
    canvas = np.zeros((H, W), np.float32)
    def draw(x0, y0, ang, length, curv, w_px):
        n = max(40, int(length / 3))
        t = np.linspace(0, 1, n)
        a = ang + curv * (t - 0.5)
        xs = x0 + np.cumsum(np.cos(a)) * (length / n)
        ys = y0 + np.cumsum(np.sin(a)) * (length / n)
        taper = np.sin(np.pi * t) ** 0.8
        for x, y, k in zip(xs, ys, taper):
            xi, yi = int(round(x)), int(round(y))
            if 0 <= xi < W and 0 <= yi < H:
                canvas[yi, xi] += k * w_px
    for _ in range(n_wall):
        if horizon_px < 0.12 * H:
            break
        x0 = rng.uniform(0.05, 0.95) * W
        y0 = rng.uniform(0.0, 0.35) * horizon_px
        ang = np.pi / 2 + rng.uniform(-0.28, 0.28)
        draw(x0, y0, ang, rng.uniform(0.35, 0.8) * horizon_px, rng.uniform(-0.25, 0.25), 1.0)
    for _ in range(n_floor):
        x0 = rng.uniform(0.0, 1.0) * W
        y0 = horizon_px + rng.uniform(0.15, 0.85) * (H - horizon_px)
        ang = rng.uniform(-0.55, 0.55) + (np.pi if rng.random() < 0.5 else 0.0)
        draw(x0, y0, ang, rng.uniform(0.18, 0.45) * s, rng.uniform(-0.4, 0.4), 0.8)
    return canvas


def tarp_background(H, W, *, horizon: float, warmth: float, lum_shift: float, light_x: float,
                    rng: np.random.Generator) -> np.ndarray:
    """Matte, slightly off-white tarp sweep in CIELAB -> linear RGB.

    Base palette and curve follow the founder's studio references (as v1.3); on top:
    irregular low-contrast tone, broad hanging folds on the backdrop, a few shallow
    creases, all shaded by the same light direction as the dog; natural falloff.
    """
    s = min(H, W)
    prof = _lab_profile(WHITE_PROFILE, WARM_PROFILE, warmth, lum_shift)
    yh = float(np.clip(horizon, 0.06, 0.92))
    pts = [(0.0, "top"), (yh - 0.20, "above"), (yh, "sweep"), (yh + 0.10, "front"),
           (yh + 0.20, "near"), (1.0, "bottom")]
    pts = [(y, k) for y, k in pts if 0.0 <= y <= 1.0] if yh + 0.2 < 1.0 else \
        [(0.0, "top"), (yh - 0.2, "above"), (yh, "sweep"), (min(0.999, yh + 0.08), "front"), (1.0, "near")]
    pts = sorted({round(y, 4): k for y, k in pts}.items())
    ys = np.array([p[0] for p in pts])
    vals = np.array([prof[p[1]] for p in pts], dtype=np.float32)
    yy = (np.arange(H, dtype=np.float32) + 0.5) / H
    col = np.stack([np.interp(yy, ys, vals[:, c]) for c in range(3)], -1)
    col = ndi.gaussian_filter1d(col, sigma=max(2.0, 0.05 * H), axis=0, mode="nearest")
    lab = np.repeat(col[:, None, :], W, axis=1)
    xx = (np.arange(W, dtype=np.float32) + 0.5) / W
    # soft curve shading where the tarp bends from wall to floor
    lab[..., 0] -= 1.6 * np.exp(-(((yy - (yh - 0.03)) / 0.07) ** 2))[:, None]
    # broad key light on the dog's lit side, natural falloff to the shaded side and the top
    lab[..., 0] += 2.6 * light_x * (xx[None, :] - 0.5) * 2.0
    lab[..., 0] -= 2.4 * np.clip(0.35 - yy, 0, None)[:, None] / 0.35 * (yh > 0.15)
    r = np.hypot((xx[None, :] - 0.5 - 0.12 * light_x) / 0.8, (yy[:, None] - 0.55) / 0.9)
    lab[..., 0] -= 3.2 * np.clip(r - 0.42, 0, None) ** 1.5
    # irregular, low-contrast tone (no smooth digital gradient)
    lab[..., 0] += 1.2 * _smooth_noise(H, W, 0.38 * max(H, W), rng) + \
        0.75 * _smooth_noise(H, W, 0.14 * max(H, W), rng) + 0.35 * _smooth_noise(H, W, 0.05 * max(H, W), rng)
    lab[..., 2] += 0.35 * _smooth_noise(H, W, 0.45 * max(H, W), rng)
    # fabric relief shaded by the same light as the dog (each term scaled on its own so it
    # stays visible at feed-card size but subtle): gentle undulation, broad hanging folds on
    # the backdrop, a few soft shallow creases.
    lx, ly = float(np.clip(light_x, -1, 1)) * 0.8 + 0.25, -0.65
    def shaded(height):
        sh = _emboss(height, lx, ly)
        return sh / (np.std(sh) + 1e-6)
    und = _smooth_noise(H, W, 0.20 * max(H, W), rng)
    lab[..., 0] += 1.0 * np.clip(shaded(und), -3, 3)
    wall_env = smoothstep(yh, max(0.0, yh - 0.22), yy)[:, None]  # C1-continuous, no seam at the curve
    lam = rng.uniform(0.2, 0.32) * W
    phase = _smooth_noise(H, 1, 0.5 * H, rng)[:, :1] * 1.4
    folds = np.sin(2 * np.pi * (np.arange(W)[None, :] / lam) + phase).astype(np.float32) * wall_env
    if yh > 0.12:
        f = shaded(ndi.gaussian_filter(folds, max(2.0, 0.01 * s)))
        lab[..., 0] += 0.9 * np.clip(f, -2.5, 2.5) * wall_env
    cr = _crease_field(H, W, yh * H, rng, n_wall=int(rng.integers(1, 3)), n_floor=int(rng.integers(2, 4)), s=s)
    cr = ndi.gaussian_filter(cr, max(3.0, 0.008 * s))
    if cr.max() > 0:
        cr = cr / cr.max()
        sh = _emboss(cr, lx, ly)
        sh = sh / (np.abs(sh).max() + 1e-6)
        lab[..., 0] += 2.6 * sh - 0.9 * cr
    rgb = skcolor.lab2rgb(lab.astype(np.float64)).astype(np.float32)
    return srgb_to_linear(np.clip(rgb, 0, 1))


def cast_shadow(alpha: np.ndarray, ext: dict, light_x: float, harsh: float) -> np.ndarray:
    """Restrained cast shadow: the silhouette, weighted toward the ground, pushed slightly
    behind the dog and away from the light, heavily softened. Mostly hidden by the dog;
    only a soft edge shows on the shaded side."""
    H, W = alpha.shape
    top, bottom = ext["top"], ext["bottom"]
    height = max(8, bottom - top)
    yy = np.arange(H, dtype=np.float32)[:, None]
    near_ground = smoothstep(top + 0.25 * height, bottom, yy)
    src = (alpha > 0.5).astype(np.float32) * (0.30 + 0.70 * near_ground)
    # shadow falls away from the light; with no clear direction, to viewer-right as in both references
    side = -np.sign(light_x) * (0.55 + 0.45 * min(1.0, abs(light_x) / 0.5)) if abs(light_x) > 0.12 else 0.6
    src = (alpha > 0.5).astype(np.float32) * (0.55 + 0.45 * near_ground)
    dx = side * 0.17 * height
    dy = -0.06 * height
    sh = ndi.shift(src, (dy, dx), order=1, mode="constant", cval=0.0)
    sh = ndi.gaussian_filter(sh, 0.035 * height + 2.0)
    opacity = 0.15 + 0.08 * harsh
    return (1.0 - opacity * np.clip(sh * 1.2, 0, 1)).astype(np.float32)


def under_body_occlusion(alpha: np.ndarray, ext: dict) -> np.ndarray:
    """Soft darkening of the floor just below the silhouette's lower contour (the dog blocks
    the overhead light). Stronger toward the ground line, nothing above the dog's mid-height."""
    H, W = alpha.shape
    top, bottom = ext["top"], ext["bottom"]
    height = max(8, bottom - top)
    sub = alpha > 0.5
    has = sub.any(axis=0)
    yb = np.where(has, H - 1 - np.argmax(sub[::-1, :], axis=0), -1).astype(np.float32)
    width = max(8, ext["right"] - ext["left"])
    lying = width > 1.15 * height  # body resting on the floor along its whole lower contour
    lo = 0.15 if lying else 0.45
    wcol = np.where(has, smoothstep(top + lo * height, top + (lo + 0.4) * height, yb), 0.0).astype(np.float32)
    wcol = ndi.gaussian_filter1d(wcol, max(2.0, 0.01 * W))
    yy = np.arange(H, dtype=np.float32)[:, None]
    d = yy - yb[None, :]
    length = (0.05 if lying else 0.07) * height
    ao = np.where(d > 0, np.exp(-np.clip(d, 0, None) / length), 0.0) * wcol[None, :]
    ao = ndi.gaussian_filter(ao, max(3.0, 0.015 * height))
    return (1.0 - (0.34 if lying else 0.22) * np.clip(ao, 0, 1)).astype(np.float32)


def composite_v2(src_u8: np.ndarray, alpha: np.ndarray, *, dog_id: str, source_sha1: str) -> tuple[np.ndarray, dict]:
    H, W, _ = src_u8.shape
    src = src_u8.astype(np.float32) / 255.0
    src_lin = srgb_to_linear(src)
    ext = subject_extent(alpha)
    rng = np.random.default_rng(seed_for(dog_id, source_sha1, PIPELINE_VERSION))
    light_x, harsh = estimate_light(src, alpha)
    light_dir = 1 if light_x >= 0 else -1
    top = ext["top"]
    horizon = max(0.06, (top - 0.05 * H) / H)
    bg_w = (1 - alpha) > 0.5
    lab_src = skcolor.rgb2lab(src[::4, ::4].astype(np.float64))
    bgm = bg_w[::4, ::4]
    b_bg = float(np.median(lab_src[..., 2][bgm])) if bgm.sum() > 500 else 8.0
    warmth = float(np.clip((b_bg - 6.0) / 22.0, 0.0, 0.40))
    fgm = (alpha > 0.95)[::4, ::4]
    subj_L = lab_src[..., 0][fgm] if fgm.sum() > 200 else lab_src[..., 0].ravel()
    subj_p90 = float(np.percentile(subj_L, 90))
    lum_shift = -float(np.clip((subj_p90 - 80.0) * 0.45, 0.0, 7.0))
    bg_lin = tarp_background(H, W, horizon=horizon, warmth=warmth, lum_shift=lum_shift,
                             light_x=light_x, rng=rng)
    cs = contact_shadows(alpha, top, ext["bottom"], light_dir)
    bg_lin *= np.clip(1.0 - 1.35 * (1.0 - cs), 0.0, 1.0)[..., None]
    bg_lin *= under_body_occlusion(alpha, ext)[..., None]
    bg_lin *= cast_shadow(alpha, ext, light_x, harsh)[..., None]
    grain = estimate_grain(src, alpha)
    bg_srgb = linear_to_srgb(bg_lin)
    noise = rng.standard_normal((H, W, 1)).astype(np.float32) * grain + \
        rng.standard_normal((H, W, 3)).astype(np.float32) * grain * 0.25
    bg_lin = srgb_to_linear(np.clip(bg_srgb + noise, 0, 1))
    fg_lin = decontaminate(src_lin, alpha)
    a = alpha[..., None]
    out = np.clip(np.round(linear_to_srgb(a * fg_lin + (1 - a) * bg_lin) * 255.0), 0, 255).astype(np.uint8)
    opaque = alpha >= 0.996
    out[opaque] = src_u8[opaque]  # dog interior is the original photograph, byte for byte
    params = {
        "pipeline": PIPELINE_VERSION, "horizon": round(horizon, 4), "warmth": round(warmth, 3),
        "lum_shift": round(lum_shift, 2), "light_x": round(light_x, 3), "harshness": round(harsh, 3),
        "grain": round(grain, 4), "contact_y": None if ext["touches"]["bottom"] else ext["bottom"],
        "subject": ext, "bg_b_star": round(b_bg, 2), "subject_L_p90": round(subj_p90, 1),
    }
    return out, params


# ------------------------------------------------------------------ v3.0 --
# "Shot in a real studio": global photographer-style light match on the dog
# (white balance, exposure, tone curve, soft directional falloff; recorded),
# a seamless sweep matched to the camera angle, depth-of-field and grain match,
# light wrap + colour-spill cleanup on the fur edge, contact/under-body/cast
# shadows from one key light. No local retouching of the dog.

def _Y(lin):
    return lin[..., 0] * 0.2126 + lin[..., 1] * 0.7152 + lin[..., 2] * 0.0722


def _L_to_Y(L):
    L = np.asarray(L, dtype=np.float64)
    return np.where(L > 8, ((L + 16) / 116) ** 3, L / 903.3)


def estimate_geometry(src: np.ndarray, alpha: np.ndarray) -> dict:
    """Where the original floor meets the wall (if visible), from row statistics of the
    background. 'eye' = a wall/floor boundary behind the dog; 'top' = floor everywhere."""
    H, W = alpha.shape
    st = 4
    lab = skcolor.rgb2lab(src[::st, ::st].astype(np.float64))
    a = alpha[::st, ::st]
    bg = ndi.binary_erosion(a < 0.05, iterations=3)
    g = ndi.gaussian_gradient_magnitude(lab[..., 0], 1.0)
    h4, w4 = bg.shape
    feats, ys = [], []
    for y in range(h4):
        m = bg[y]
        if m.sum() < max(8, 0.06 * w4):
            continue
        feats.append((np.median(lab[y, m, 0]) / 6.0, np.median(lab[y, m, 1]) / 4.0,
                      np.median(lab[y, m, 2]) / 4.0, np.median(g[y, m]) / 2.0))
        ys.append(y)
    ext = subject_extent(alpha)
    out = {"view": "top", "horizon": None, "strength": 0.0}
    if len(ys) < 12:
        return out
    F = ndi.gaussian_filter1d(np.array(feats, dtype=np.float64), 1.5, axis=0)
    ys = np.array(ys)
    lim = (ext["bottom"] / st) - 0.04 * h4
    best, by, bi = 0.0, None, None
    for i in range(4, len(ys) - 4):
        if ys[i] < 0.04 * h4 or ys[i] > lim:
            continue
        m1, m2 = F[:i].mean(0), F[i:].mean(0)
        n1, n2 = i, len(ys) - i
        score = (n1 * n2) / (len(ys) ** 2) * float(np.sum((m1 - m2) ** 2))
        if score > best:
            best, by, bi = score, ys[i], i
    strength = float(np.sqrt(best))
    out["strength"] = round(strength, 3)
    if by is not None and strength > 0.55:
        tex_up, tex_down = float(F[:bi, 3].mean()), float(F[bi:, 3].mean())
        out["texture_above_below"] = [round(tex_up, 3), round(tex_down, 3)]
        # a real wall (or banner/fence) is smoother than the ground in front of it; two textured
        # grounds (grass vs gravel path) are not a wall, so the shot is treated as floor-only
        near_paws = by * st > ext["top"] + 0.80 * (ext["bottom"] - ext["top"])
        if tex_up < 0.9 and (tex_up < 0.8 * tex_down or tex_up < 0.6) and not near_paws:
            out.update({"view": "eye", "horizon": float(by * st / H)})
    return out


def estimate_dof(src: np.ndarray, alpha: np.ndarray) -> float:
    """Backdrop blur (px at work size) so the new background is as soft as the original one."""
    H, W = alpha.shape
    g = _Y(srgb_to_linear(src.astype(np.float32))) ** (1 / 2.2)  # src is already sRGB in 0..1
    lap = np.abs(ndi.laplace(ndi.gaussian_filter(g, 0.8)))
    near = ndi.binary_dilation(alpha > 0.5, iterations=max(4, int(0.03 * min(H, W)))) & (alpha < 0.03)
    interior = ndi.binary_erosion(alpha > 0.99, iterations=6)
    if near.sum() < 2000 or interior.sum() < 2000:
        return 0.0
    ratio = float(np.median(lap[near]) / (np.median(lap[interior]) + 1e-6))
    return float(np.clip((0.55 - ratio) * 7.0, 0.0, 4.0) * (max(H, W) / 2400.0))


def dog_adjustments(src: np.ndarray, alpha: np.ndarray, light_x: float, harsh: float) -> dict:
    """Global, photographer-style corrections for the dog (recorded in meta.json):
    white-balance gains, exposure (EV), tone curve (highlight shoulder, shadow lift) and a
    soft directional falloff consistent with the studio key light."""
    st = 4
    srcs = src[::st, ::st].astype(np.float64)  # src is already sRGB in 0..1
    lab = skcolor.rgb2lab(srcs)
    m = ndi.binary_erosion(alpha[::st, ::st] > 0.98, iterations=2)
    L, A, B = lab[..., 0][m], lab[..., 1][m], lab[..., 2][m]
    lin = srgb_to_linear(srcs.astype(np.float32))[m]
    C = np.hypot(A, B)
    neutral = (C < 10) & (L > 30) & (L < 95)
    gains = np.array([1.0, 1.0, 1.0])
    wb_source, da, db = "none", 0.0, 0.0
    if m.sum() > 400 and neutral.sum() > max(200, 0.03 * m.sum()):
        frac = float(neutral.sum()) / float(m.sum())
        ma, mb, wb_source = float(np.median(A[neutral])), float(np.median(B[neutral])), "neutral fur"
        strength = 0.85 if frac > 0.35 else 0.6  # mostly-white coat: the cast is clearly bounce light
        sample = lin[neutral].mean(0)
    else:
        bgm = alpha[::st, ::st] < 0.05
        Cb = np.hypot(lab[..., 1][bgm], lab[..., 2][bgm])
        low = Cb < 14
        if low.sum() > 500:
            ma, mb, strength, wb_source = float(np.median(lab[..., 1][bgm][low])), float(np.median(lab[..., 2][bgm][low])), 0.3, "background grey-world"
            sample = srgb_to_linear(srcs.astype(np.float32))[bgm][low].mean(0)
        else:
            sample = None
    if sample is not None:
        da = float(np.clip((0.5 - ma) * strength, -5.0, 5.0))
        db = float(np.clip((4.0 - mb) * strength, -6.0, 6.0))
        s_lab = skcolor.rgb2lab(np.clip(linear_to_srgb(sample[None, None, :].astype(np.float32)), 0, 1).astype(np.float64))[0, 0]
        t_lab = s_lab + np.array([0.0, da, db])
        t_lin = srgb_to_linear(np.clip(skcolor.lab2rgb(t_lab[None, None, :]), 0, 1).astype(np.float32))[0, 0].astype(np.float64)
        gains = t_lin / np.maximum(sample, 1e-4)
        y0 = float(np.dot(sample, [0.2126, 0.7152, 0.0722]))
        y1 = float(np.dot(sample * gains, [0.2126, 0.7152, 0.0722]))
        gains *= y0 / max(y1, 1e-6)
        gains = np.clip(gains, 0.85, 1.18)
    p95, med, p99 = float(np.percentile(L, 95)), float(np.median(L)), float(np.percentile(L, 99))
    ev = 0.0
    if p95 < 74 and med > 30:
        ev = float(np.clip(np.log2(_L_to_Y(78) / max(_L_to_Y(p95), 1e-4)), 0.0, 0.4))
    shoulder = float(np.clip((p99 - 84.0) / 10.0, 0.0, 1.0) * (0.25 + 0.65 * harsh))
    lift = float(np.clip((harsh - 0.45) * 0.5, 0.0, 0.18))
    direction = 1.0 if light_x >= 0 else -1.0
    falloff = float(0.05 + 0.03 * min(1.0, abs(light_x) / 0.4))
    return {"wb_source": wb_source, "wb_shift_ab": [round(da, 2), round(db, 2)],
            "wb_gains_rgb": [round(float(x), 4) for x in gains], "exposure_ev": round(ev, 3),
            "tone": {"highlight_shoulder": round(shoulder, 3), "shadow_lift": round(lift, 3)},
            "falloff": {"direction_x": direction, "strength": round(falloff, 3)}}


def apply_dog_adjustments(src_lin: np.ndarray, adj: dict, ext: dict) -> np.ndarray:
    H, W, _ = src_lin.shape
    x = src_lin * np.array(adj["wb_gains_rgb"], dtype=np.float32)[None, None, :]
    x = x * np.float32(2.0 ** adj["exposure_ev"])
    Y = np.maximum(_Y(x), 1e-6)
    sh, li = adj["tone"]["highlight_shoulder"], adj["tone"]["shadow_lift"]
    Yn = Y.copy()
    if sh > 0:
        k = 0.55
        over = np.clip(Y - k, 0, None)
        Yn = np.where(Y > k, k + over / (1.0 + sh * over / (1.0 - k)), Yn)
    if li > 0:
        Yn = Yn + li * Yn * np.clip(1.0 - Yn / 0.22, 0, 1) ** 2
    x = x * (Yn / Y)[..., None]
    cx = (ext["left"] + ext["right"]) / 2.0
    hw = max(8.0, (ext["right"] - ext["left"]) / 2.0)
    xx = (np.arange(W, dtype=np.float32) - cx) / hw
    g = 1.0 + adj["falloff"]["strength"] * np.clip(xx, -1.2, 1.2) * adj["falloff"]["direction_x"]
    return np.clip(x * g[None, :, None], 0, None).astype(np.float32)


def studio_sweep_v3(H, W, *, geom: dict, ext: dict, warmth: float, lum_shift: float, light_x: float,
                    dof: float, rng: np.random.Generator) -> np.ndarray:
    """Seamless sweep: floor curving up into the wall at the original floor/wall line
    ('eye' views) or floor almost everywhere ('top' views), lit by one soft key light:
    a pool of light around the dog that falls off with distance, darker wall toward the
    top, faint paper texture, blurred to the original depth of field."""
    s = min(H, W)
    prof = _lab_profile(WHITE_PROFILE, WARM_PROFILE, warmth, lum_shift)
    yy = (np.arange(H, dtype=np.float32) + 0.5) / H
    xx = (np.arange(W, dtype=np.float32) + 0.5) / W
    if geom["view"] == "eye":
        yh = float(np.clip(geom["horizon"], 0.08, 0.9))
        curve_w = 0.06
    else:
        yh = float(np.clip((ext["top"] - 0.10 * H) / H, -0.25, 0.25))
        curve_w = 0.08
    # base tone: wall above the curve (darker toward the top), floor below (bright near the curve
    # and the dog, slightly darker toward the camera)
    wall_L = prof["above"][0] + (prof["top"][0] - prof["above"][0]) * np.clip((yh - yy) / max(yh, 0.15), 0, 1)
    floor_L = prof["front"][0] + (prof["bottom"][0] - prof["front"][0]) * np.clip((yy - yh) / max(1.0 - yh, 0.2), 0, 1) ** 1.3
    t = smoothstep(yh - curve_w, yh + curve_w, yy)
    Lcol = wall_L * (1 - t) + floor_L * t - 1.2 * np.exp(-(((yy - yh) / (curve_w * 0.9)) ** 2))
    acol = prof["above"][1] * (1 - t) + prof["front"][1] * t
    bcol = prof["above"][2] * (1 - t) + prof["front"][2] * t
    lab = np.zeros((H, W, 3), np.float32)
    lab[..., 0] = Lcol[:, None]
    lab[..., 1] = acol[:, None]
    lab[..., 2] = bcol[:, None]
    # pool of key light around the dog, shifted toward the key side
    cx = ((ext["left"] + ext["right"]) / 2.0) / W + 0.10 * np.sign(light_x if abs(light_x) > 0.08 else -0.5)
    cy = (ext["top"] + 0.65 * (ext["bottom"] - ext["top"])) / H
    r = np.hypot((xx[None, :] - cx) / 0.75, (yy[:, None] - cy) / 0.95)
    lab[..., 0] += 2.2 * np.exp(-(r ** 2) / 0.5) - 3.4 * np.clip(r - 0.55, 0, None) ** 1.4
    lab[..., 0] += 1.4 * np.clip(light_x, -0.7, 0.7) * (xx[None, :] - 0.5) * 2.0
    if geom["view"] != "eye":
        lab[..., 0] -= 2.6 * (np.clip(0.45 - yy, 0, None) / 0.45)[:, None] ** 1.2  # far floor recedes
    # faint, slightly uneven paper texture (no creases), softened to the lens
    tex = 0.55 * _smooth_noise(H, W, 0.30 * max(H, W), rng) + 0.30 * _smooth_noise(H, W, 0.10 * max(H, W), rng)
    und = _smooth_noise(H, W, 0.18 * max(H, W), rng)
    gy, gx = np.gradient(ndi.gaussian_filter(und, 2.0))
    shade = -(gx * (0.6 * np.sign(light_x) if abs(light_x) > 0.08 else -0.4) + gy * -0.6)
    shade = shade / (np.std(shade) + 1e-6)
    fine = ndi.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 1.1)
    fine = fine / (fine.std() + 1e-6)
    texture = tex + 0.45 * np.clip(shade, -3, 3) + 0.18 * fine
    if dof > 0.3:
        texture = ndi.gaussian_filter(texture, dof)
    lab[..., 0] += texture
    lab[..., 2] += 0.25 * _smooth_noise(H, W, 0.45 * max(H, W), rng)
    rgb = skcolor.lab2rgb(lab.astype(np.float64)).astype(np.float32)
    return srgb_to_linear(np.clip(rgb, 0, 1))


def body_occlusion_v3(alpha: np.ndarray, ext: dict, view: str) -> np.ndarray:
    """Soft darkening of the floor in the gaps the body encloses (between the legs, under the
    chest/belly), lower body only. Built from a morphological closing of the silhouette, so it
    never draws a ring around the outer outline (no 'drop shadow' around heads, ears or backs)."""
    H, W = alpha.shape
    top, bottom = ext["top"], ext["bottom"]
    height = max(8, bottom - top)
    m = alpha > 0.5
    st = 4
    small = m[::st, ::st]
    r = max(2, int(0.07 * height / st))
    yy0, xx0 = np.ogrid[-r:r + 1, -r:r + 1]
    disk = (xx0 ** 2 + yy0 ** 2) <= r * r
    closed = ndi.binary_closing(np.pad(small, r + 1), structure=disk)[r + 1:-(r + 1), r + 1:-(r + 1)]
    gaps_s = closed & ~small
    gaps = np.kron(gaps_s, np.ones((st, st), bool))[:H, :W] & ~m
    yy = np.arange(H, dtype=np.float32)[:, None]
    lower = smoothstep(top + 0.40 * height, top + 0.65 * height, yy)
    occ = ndi.gaussian_filter(gaps.astype(np.float32) * lower, 0.02 * height + 2.0)
    occ = np.where(m, 0.0, occ)
    k = 0.42 if view == "top" else 0.36
    return (1.0 - k * np.clip(occ * 1.8, 0, 1)).astype(np.float32)


def contact_shadows_v3(alpha: np.ndarray, top_y: int, bottom_y: int) -> np.ndarray:
    """Like v1.3, with a narrower window so every planted paw (also the ones further back in
    top-down shots) gets its own contact shadow, and a slightly longer soft tail."""
    H, W = alpha.shape
    s = min(H, W)
    height = max(1, bottom_y - top_y)
    sub = alpha > 0.5
    has = sub.any(axis=0)
    yb = np.where(has, H - 1 - np.argmax(sub[::-1, :], axis=0), -1).astype(np.float32)
    win = max(3, int(0.035 * W))
    ylocal = ndi.maximum_filter1d(np.where(has, yb, -1.0), size=2 * win + 1)
    w_local = smoothstep(ylocal - 0.08 * height, ylocal - 0.01 * height, yb)
    w_global = smoothstep(top_y + 0.55 * height, top_y + 0.80 * height, yb)
    weight = ndi.gaussian_filter1d(np.where(has, w_local * w_global, 0.0).astype(np.float32), max(1.0, 0.003 * W))
    yy = np.arange(H, dtype=np.float32)[:, None]
    d = yy - yb[None, :]
    lc, ls = max(2.0, 0.008 * s), max(6.0, 0.035 * s)
    below = d > -0.004 * s
    contact = np.where(below, np.exp(-np.clip(d, 0, None) / lc), 0.0) * weight[None, :]
    soft = np.where(below, np.exp(-np.clip(d, 0, None) / ls), 0.0) * weight[None, :]
    contact = ndi.gaussian_filter(contact, (max(1.0, 0.002 * s), max(1.5, 0.005 * s)))
    soft = ndi.gaussian_filter(soft, max(3.0, 0.016 * s))
    return ((1.0 - 0.62 * np.clip(contact, 0, 1)) * (1.0 - 0.26 * np.clip(soft * 1.4, 0, 1))).astype(np.float32)


def cast_shadow_v3(alpha: np.ndarray, ext: dict, light_x: float, harsh: float, view: str) -> np.ndarray:
    H, W = alpha.shape
    top, bottom = ext["top"], ext["bottom"]
    height = max(8, bottom - top)
    yy = np.arange(H, dtype=np.float32)[:, None]
    near_ground = smoothstep(top + 0.25 * height, bottom, yy)
    side = -np.sign(light_x) * (0.55 + 0.45 * min(1.0, abs(light_x) / 0.5)) if abs(light_x) > 0.12 else 0.6
    # Only the lower body casts onto the floor nearby (no outline-hugging "drop shadow" from the
    # head or ears); the shadow is pushed slightly back and away from the key, and is very soft.
    lower = smoothstep(top + 0.55 * height, bottom, yy)
    src = (alpha > 0.5).astype(np.float32) * lower
    if view == "top":
        return np.ones((H, W), np.float32)  # seen from above, the soft key's shadow is under the dog
    src = (alpha > 0.5).astype(np.float32) * smoothstep(top + 0.72 * height, bottom, yy)  # legs/paws only
    dx, dy = side * 0.05 * height, -0.035 * height
    blur, op = 0.05 * height + 3.0, 0.10 + 0.05 * harsh
    sh = ndi.gaussian_filter(ndi.shift(src, (dy, dx), order=1, mode="constant", cval=0.0), blur)
    return (1.0 - op * np.clip(sh * 1.5, 0, 1)).astype(np.float32)


def despill_edges(fg_lin: np.ndarray, src_lin: np.ndarray, alpha: np.ndarray, s: int) -> tuple[np.ndarray, np.ndarray]:
    """Remove the old background's colour from the fur edge band (a few px inside the
    outline): the part of each edge pixel's chroma that points toward the local old
    background colour, relative to the nearby fur colour, is taken out. L* is kept."""
    band = max(4.0, 0.007 * s)
    d = ndi.distance_transform_edt(alpha > 0.5)
    w = np.clip(1.0 - d / band, 0, 1) * (alpha > 0.02)
    if w.max() <= 0:
        return fg_lin, w
    sig = max(4.0, 0.012 * s)
    bgw = (alpha < 0.05).astype(np.float32)
    bgcol = ndi.gaussian_filter(src_lin * bgw[..., None], (sig, sig, 0)) / np.maximum(ndi.gaussian_filter(bgw, sig), 1e-4)[..., None]
    fgw = ndi.binary_erosion(alpha > 0.99, iterations=int(band) + 2).astype(np.float32)
    furcol = ndi.gaussian_filter(fg_lin * fgw[..., None], (sig, sig, 0)) / np.maximum(ndi.gaussian_filter(fgw, sig), 1e-4)[..., None]
    sel = w > 0.0
    to_lab = lambda lin: skcolor.rgb2lab(np.clip(linear_to_srgb(lin), 0, 1).astype(np.float64))
    pix = to_lab(fg_lin[sel][None])[0]
    bgl = to_lab(bgcol[sel][None])[0]
    fur = to_lab(furcol[sel][None])[0]
    dvec = bgl[:, 1:] - fur[:, 1:]
    n = np.linalg.norm(dvec, axis=1, keepdims=True)
    dirv = np.where(n > 2.0, dvec / np.maximum(n, 1e-6), 0.0)
    dev = pix[:, 1:] - fur[:, 1:]
    proj = np.sum(dev * dirv, axis=1, keepdims=True)
    along = np.clip(proj, 0, None) * dirv
    perp = dev - proj * dirv
    ww = w[sel][:, None]
    # take out the old-background colour, and half of any remaining colour cast, in the edge band
    pix[:, 1:] -= ww * (0.9 * along + 0.5 * perp)
    out = fg_lin.copy()
    out[sel] = srgb_to_linear(np.clip(skcolor.lab2rgb(pix[None]), 0, 1).astype(np.float32))[0]
    return out, w


def light_wrap(fg_lin: np.ndarray, bg_lin: np.ndarray, alpha: np.ndarray, s: int, strength: float = 0.32):
    """Backdrop light spilling around the fur outline (a few px inside the edge)."""
    sig = max(2.0, 0.006 * s)
    inv = (1.0 - alpha).astype(np.float32)
    bgb = ndi.gaussian_filter(bg_lin * inv[..., None], (sig, sig, 0)) / np.maximum(ndi.gaussian_filter(inv, sig), 1e-4)[..., None]
    near_bg = np.clip(ndi.gaussian_filter((alpha < 0.5).astype(np.float32), max(1.5, 0.004 * s)) * 2.0, 0, 1)
    w = (strength * near_bg * (alpha > 0.02)).astype(np.float32)
    return fg_lin * (1 - w[..., None]) + bgb * w[..., None], w


def composite_v3(src_u8: np.ndarray, alpha: np.ndarray, *, dog_id: str, source_sha1: str) -> tuple[np.ndarray, dict]:
    H, W, _ = src_u8.shape
    s = min(H, W)
    src = src_u8.astype(np.float32) / 255.0
    src_lin = srgb_to_linear(src)
    ext = subject_extent(alpha)
    rng = np.random.default_rng(seed_for(dog_id, source_sha1, PIPELINE_VERSION))
    light_x, harsh = estimate_light(src, alpha)
    geom = estimate_geometry(src, alpha)
    dof = estimate_dof(src, alpha)
    adj = dog_adjustments(src, alpha, light_x, harsh)
    fg_adj = apply_dog_adjustments(src_lin, adj, ext)
    # palette: slightly off-white; white dogs get a deeper paper for separation
    lab_src = skcolor.rgb2lab(src[::4, ::4].astype(np.float64))
    fgm = (alpha > 0.95)[::4, ::4]
    subj_L = lab_src[..., 0][fgm] if fgm.sum() > 200 else lab_src[..., 0].ravel()
    subj_p90 = float(np.percentile(subj_L, 90))
    lum_shift = -float(np.clip((subj_p90 - 74.0) * 0.8, 0.0, 15.0))  # white dogs: a greyer paper, as photographers use
    warmth = 0.12
    bg_lin = studio_sweep_v3(H, W, geom=geom, ext=ext, warmth=warmth, lum_shift=lum_shift,
                             light_x=light_x, dof=dof, rng=rng)
    light_dir = 1 if light_x >= 0 else -1
    shadow = contact_shadows_v3(alpha, ext["top"], ext["bottom"])
    shadow *= body_occlusion_v3(alpha, ext, geom["view"])
    shadow *= cast_shadow_v3(alpha, ext, light_x, harsh, geom["view"])
    if dof > 0.3:
        shadow = ndi.gaussian_filter(shadow, dof)
    bg_lin = bg_lin * shadow[..., None]
    # camera match: sensor grain like the photo's
    grain = estimate_grain(src, alpha)
    bg_srgb = linear_to_srgb(bg_lin)
    noise = rng.standard_normal((H, W, 1)).astype(np.float32) * grain + \
        rng.standard_normal((H, W, 3)).astype(np.float32) * grain * 0.3
    bg_lin = srgb_to_linear(np.clip(bg_srgb + ndi.gaussian_filter(noise, (0.45, 0.45, 0)) * 1.6, 0, 1))
    # edges: choke the faint outer matte (more for dark fur, which smears into a halo), then
    # decontaminate the soft fur edge, clear old-background spill, wrap backdrop light
    fgw = ndi.binary_erosion(alpha > 0.98, iterations=3).astype(np.float32)
    sig_c = max(3.0, 0.008 * s)
    furY = ndi.gaussian_filter(_Y(fg_adj) * fgw, sig_c) / np.maximum(ndi.gaussian_filter(fgw, sig_c), 1e-4)
    dark = np.clip((0.08 - furY) / 0.06, 0, 1)
    bgw = (alpha < 0.05).astype(np.float32)
    oldY = ndi.gaussian_filter(_Y(src_lin) * bgw, sig_c) / np.maximum(ndi.gaussian_filter(bgw, sig_c), 1e-4)
    newY = _Y(bg_lin)
    old_darker = np.clip((newY - oldY) / np.maximum(newY, 1e-3), 0, 1)
    soft_band = (alpha > 0) & (alpha < 0.996)
    softness = float(((alpha > 0.05) & (alpha < 0.95)).sum()) / max(1.0, float((alpha > 0.05).sum()))
    c = 0.04 + 0.14 * dark + 0.10 * old_darker + (0.06 if softness > 0.18 else 0.0)
    choked = np.clip((alpha - c) / (1.0 - c), 0, 1)
    crisp = smoothstep(0.30, 0.80, choked)  # dark fur edges: a short, crisp transition, no smeared aura
    alpha = np.where(soft_band, choked * (1 - dark) + crisp * dark, alpha).astype(np.float32)
    fg = decontaminate(fg_adj, alpha)
    fg, w_spill = despill_edges(fg, fg_adj, alpha, s)
    fg, w_wrap = light_wrap(fg, bg_lin, alpha, s)
    a = alpha[..., None]
    out_lin = a * fg + (1 - a) * bg_lin
    out = np.clip(np.round(linear_to_srgb(out_lin) * 255.0), 0, 255).astype(np.uint8)
    # QA: away from the edge band, every dog pixel is exactly the recorded global adjustment of the original
    interior = (alpha >= 0.996) & (w_wrap < 1e-4) & (w_spill <= 0)
    expect = np.clip(np.round(linear_to_srgb(fg_adj) * 255.0), 0, 255).astype(np.uint8)
    out[interior] = expect[interior]
    reproducible = bool(np.array_equal(out[interior], expect[interior]))
    params = {
        "pipeline": PIPELINE_VERSION, "geometry": geom, "dof_sigma_px": round(dof, 2), "light_x": round(light_x, 3),
        "harshness": round(harsh, 3), "dog_adjustments": adj, "lum_shift": round(lum_shift, 2), "warmth": warmth,
        "grain": round(grain, 4), "subject": ext, "subject_L_p90": round(subj_p90, 1),
        "qa_interior_pixels": int(interior.sum()), "qa_interior_is_recorded_global_adjustment": reproducible,
        "edge_band_px": round(max(4.0, 0.007 * s), 1),
    }
    return out, params
