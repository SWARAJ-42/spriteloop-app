import sys
import io
import warnings
import concurrent.futures

import cv2
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

warnings.filterwarnings("ignore")

# 🔥 GLOBAL CACHE
_palette_cache = {}

# -----------------------------
# Color conversions
# -----------------------------
def rgb_to_lab(rgb):
    img = rgb.astype(np.float32)
    if img.ndim == 1:
        img = img.reshape(1, 1, 3)
    elif img.ndim == 2:
        img = img.reshape(1, *img.shape)
    out = cv2.cvtColor(img / 255.0, cv2.COLOR_RGB2Lab)
    return out.reshape(rgb.shape)


def lab_to_rgb(lab):
    img = lab.astype(np.float32)
    if img.ndim == 1:
        img = img.reshape(1, 1, 3)
    elif img.ndim == 2:
        img = img.reshape(1, *img.shape)
    out = cv2.cvtColor(img, cv2.COLOR_Lab2RGB) * 255.0
    return out.reshape(lab.shape).clip(0, 255)


# -----------------------------
# Extract frames
# -----------------------------
def extract_frames_from_bytes(webp_bytes):
    img = Image.open(io.BytesIO(webp_bytes))

    frames = []
    durations = []

    animated = hasattr(img, "n_frames") and img.n_frames > 1

    if not animated:
        frames.append(img.convert("RGBA"))
        durations.append(img.info.get("duration", 100))
    else:
        try:
            while True:
                frames.append(img.copy().convert("RGBA"))
                durations.append(img.info.get("duration", 100))
                img.seek(img.tell() + 1)
        except EOFError:
            pass

    meta = {
        "loop": img.info.get("loop", 0),
        "n_frames": len(frames),
    }

    return frames, durations, meta


# -----------------------------
# Filters
# -----------------------------
def bilateral_filter(frame):
    rgba = np.array(frame.convert("RGBA"))

    rgb = cv2.bilateralFilter(
        rgba[:, :, :3].astype(np.float32),
        d=5,
        sigmaColor=30,
        sigmaSpace=5
    ).astype(np.uint8)

    out = rgba.copy()
    out[:, :, :3] = rgb

    return Image.fromarray(out, "RGBA")


# -----------------------------
# Downsample
# -----------------------------
def downsample_majority(frame, grid_w, grid_h):
    rgba = np.array(frame.convert("RGBA"), dtype=np.float32)

    h, w = rgba.shape[:2]
    bh = h / grid_h
    bw = w / grid_w

    rgb_out = np.zeros((grid_h, grid_w, 3), dtype=np.uint8)
    alpha_out = np.zeros((grid_h, grid_w), dtype=np.uint8)

    for gy in range(grid_h):
        y0 = int(round(gy * bh))
        y1 = int(round((gy + 1) * bh))
        y0, y1 = max(0, y0), min(h, max(y0 + 1, y1))

        for gx in range(grid_w):
            x0 = int(round(gx * bw))
            x1 = int(round((gx + 1) * bw))
            x0, x1 = max(0, x0), min(w, max(x0 + 1, x1))

            block = rgba[y0:y1, x0:x1]
            a_block = block[:, :, 3].ravel()

            if (a_block > 128).mean() < 0.35:
                alpha_out[gy, gx] = 0
                continue

            alpha_out[gy, gx] = 255

            mask = a_block > 128
            if mask.sum() == 0:
                continue

            rgb_pixels = block[:, :, :3].reshape(-1, 3)[mask]

            lab_pixels = rgb_to_lab(rgb_pixels.astype(np.float32))
            lab_med = np.median(lab_pixels, axis=0)

            dists = np.sum((lab_pixels - lab_med) ** 2, axis=1)
            rgb_out[gy, gx] = rgb_pixels[np.argmin(dists)].astype(np.uint8)

    return rgb_out, alpha_out


# -----------------------------
# Palette
# -----------------------------
def build_palette(all_rgb, all_alpha, n_colors):
    from sklearn.cluster import MiniBatchKMeans

    pixels = []

    for rgb, alpha in zip(all_rgb, all_alpha):
        mask = alpha > 128
        if mask.any():
            pixels.append(rgb[mask].astype(np.float32))

    pixels = np.concatenate(pixels, axis=0)

    if len(pixels) > 50000:
        idx = np.random.choice(len(pixels), 50000, replace=False)
        pixels = pixels[idx]

    lab = rgb_to_lab(pixels)

    km = MiniBatchKMeans(
        n_clusters=n_colors,
        n_init=5,
        random_state=42,
        batch_size=4096
    )

    km.fit(lab)

    return km.cluster_centers_.astype(np.float32)


# -----------------------------
# Apply palette
# -----------------------------
def apply_palette(rgb, alpha, palette_lab, dither=True):

    H, W = rgb.shape[:2]
    tree = cKDTree(palette_lab)

    lab = rgb_to_lab(rgb.astype(np.float32)).astype(np.float64)

    if dither:
        err = np.zeros_like(lab)
        out_idx = np.zeros((H, W), dtype=np.int32)

        for y in range(H):
            for x in range(W):

                if alpha[y, x] < 128:
                    out_idx[y, x] = -1
                    continue

                old = lab[y, x] + err[y, x]
                old = old.clip([0, -128, -128], [100, 127, 127])

                _, idx = tree.query(old)
                out_idx[y, x] = idx

                quant_err = old - palette_lab[idx]

                if x + 1 < W:
                    err[y, x + 1] += quant_err * (7 / 16)

                if y + 1 < H:
                    if x > 0:
                        err[y + 1, x - 1] += quant_err * (3 / 16)
                    err[y + 1, x] += quant_err * (5 / 16)
                    if x + 1 < W:
                        err[y + 1, x + 1] += quant_err * (1 / 16)

    else:
        lab_flat = lab.reshape(-1, 3).astype(np.float32)
        _, idx_flat = tree.query(lab_flat)
        out_idx = idx_flat.reshape(H, W).astype(np.int32)
        out_idx[alpha < 128] = -1

    palette_rgb = lab_to_rgb(palette_lab).clip(0, 255).astype(np.uint8)

    out_rgb = np.zeros((H, W, 3), dtype=np.uint8)
    out_alpha = np.zeros((H, W), dtype=np.uint8)

    valid = out_idx >= 0
    out_rgb[valid] = palette_rgb[out_idx[valid]]
    out_alpha[valid] = 255

    return np.dstack([out_rgb, out_alpha])


# -----------------------------
# Other steps unchanged
# -----------------------------
def stabilise(frames, threshold=15):
    if len(frames) <= 1:
        return frames

    stack = np.stack(frames, axis=0).astype(np.int16)
    rgb = stack[:, :, :, :3]

    max_diff = np.zeros(rgb.shape[1:3], dtype=np.float32)

    for i in range(len(frames) - 1):
        diff = np.abs(rgb[i] - rgb[i + 1]).max(axis=2)
        max_diff = np.maximum(max_diff, diff)

    static_mask = max_diff < threshold

    out = [f.copy() for f in frames]

    if static_mask.any():
        static_px = rgb[:, static_mask, :]
        mode_colour = np.median(static_px, axis=0).astype(np.uint8)

        for f in out:
            f[static_mask, :3] = mode_colour

    return out


def add_outline(rgba, darkness=0.2):
    alpha = rgba[:, :, 3]
    fg = (alpha > 128).astype(np.uint8)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    eroded = cv2.erode(fg, kernel, iterations=1)
    border = (fg - eroded).astype(bool)

    out = rgba.copy().astype(np.float32)
    out[border, :3] *= darkness

    return out.clip(0, 255).astype(np.uint8)


def upscale_nn(rgba, scale):
    pil = Image.fromarray(rgba, "RGBA")
    w, h = pil.size
    return pil.resize((w * scale, h * scale), Image.NEAREST)


# -----------------------------
# MAIN PIPELINE (parallelized)
# -----------------------------
def process_webp_bytes(webp_bytes):

    frames, durations, meta = extract_frames_from_bytes(webp_bytes)

    n = meta["n_frames"]

    orig_w, orig_h = frames[0].size
    target_size = 64

    aspect = orig_w / orig_h

    if orig_w >= orig_h:
        grid_w = target_size
        grid_h = max(1, round(target_size / aspect))
    else:
        grid_h = target_size
        grid_w = max(1, round(target_size * aspect))

    # 🔥 parallel bilateral filter
    with concurrent.futures.ThreadPoolExecutor() as executor:
        frames = list(executor.map(bilateral_filter, frames))

    # 🔥 parallel downsampling
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = list(executor.map(
            lambda f: downsample_majority(f, grid_w, grid_h),
            frames
        ))

    down_rgb, down_alpha = zip(*results)

    # 🔥 cache palette
    key = (grid_w, grid_h)

    if key not in _palette_cache:
        palette = build_palette(down_rgb, down_alpha, 24)
        _palette_cache[key] = palette
    else:
        palette = _palette_cache[key]

    # 🔥 parallel palette application
    with concurrent.futures.ThreadPoolExecutor() as executor:
        frames_rgba = list(executor.map(
            lambda args: apply_palette(*args, palette, True),
            zip(down_rgb, down_alpha)
        ))

    if n > 1:
        frames_rgba = stabilise(frames_rgba)

    # 🔥 parallel outline + upscale
    with concurrent.futures.ThreadPoolExecutor() as executor:
        frames_rgba = list(executor.map(add_outline, frames_rgba))
        processed = list(executor.map(lambda f: upscale_nn(f, 8), frames_rgba))

    buf = io.BytesIO()

    if len(processed) == 1:
        processed[0].save(buf, format="WEBP", lossless=True)
    else:
        processed[0].save(
            buf,
            format="WEBP",
            save_all=True,
            append_images=processed[1:],
            duration=durations,
            loop=meta["loop"],
            lossless=True,
            quality=100,
            method=6,
        )

    return buf.getvalue()