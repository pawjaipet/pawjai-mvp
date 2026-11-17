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

PIPELINE_VERSION = "studio-bg-v1.3"
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


