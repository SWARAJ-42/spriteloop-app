import sys
import io
import warnings

import cv2
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
from scipy import stats
from tqdm import tqdm

import sys
import time
warnings.filterwarnings("ignore")
from multiprocessing import Pool, cpu_count
# ---------------------------------------------------------------------------
# Matches Rust's LUMINANCE_WEIGHT = 0.0
# Set > 0 to bias the histogram mode toward darker pixels on ties
# ---------------------------------------------------------------------------
LUMINANCE_WEIGHT = 0.0


# ---------------------------------------------------------------------------
# Color-space helpers  (unchanged)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Frame extraction  (unchanged)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# bilateral_filter — kept for API compatibility, no longer called by default
# ---------------------------------------------------------------------------

def bilateral_filter(frame):
    """
    Kept for API compatibility.
    Not used in the main pipeline — pre-smoothing before palette-first
    quantization adds blur that degrades pixel-art clarity.
    """
    rgba = np.array(frame.convert("RGBA"))
    rgb = cv2.bilateralFilter(
        rgba[:, :, :3].astype(np.float32),
        d=5,
        sigmaColor=30,
        sigmaSpace=5,
    ).astype(np.uint8)
    out = rgba.copy()
    out[:, :, :3] = rgb
    return Image.fromarray(out, "RGBA")


# ---------------------------------------------------------------------------
# Palette building  (same signature, now called on full-res frames)
# ---------------------------------------------------------------------------

def build_palette(all_rgb, all_alpha, n_colors):
    """
    K-means in Lab space across ALL frames at ORIGINAL resolution.

    Previously called on downsampled data; now called before downsampling
    so the palette represents the full image detail — matching the Rust
    project's approach of quantizing first, downsampling second.

    all_rgb   : list of (H, W, 3) uint8 arrays
    all_alpha : list of (H, W)    uint8 arrays
    n_colors  : number of palette entries
    Returns   : (n_colors, 3) float32 array of Lab centroids
    """
    from sklearn.cluster import MiniBatchKMeans

    pixels = []
    for rgb, alpha in zip(all_rgb, all_alpha):
        mask = alpha > 128
        if mask.any():
            pixels.append(rgb[mask].astype(np.float32))

    pixels = np.concatenate(pixels, axis=0)

    # Cap sample size for speed (same as before)
    if len(pixels) > 50_000:
        idx = np.random.choice(len(pixels), 50_000, replace=False)
        pixels = pixels[idx]

    lab = rgb_to_lab(pixels)

    km = MiniBatchKMeans(
        n_clusters=n_colors,
        n_init=5,
        random_state=42,
        batch_size=4096,
    )
    km.fit(lab)

    return km.cluster_centers_.astype(np.float32)


# ---------------------------------------------------------------------------
# Palette application  (same signature — dither default changed to False)
# ---------------------------------------------------------------------------

def apply_palette(rgb, alpha, palette_lab, dither=False):
    """
    Recolor every opaque pixel to its nearest palette centroid.

    Key change from the old version:
      • dither=False by default — Floyd-Steinberg dithering on an already
        quantized image introduces unwanted noise instead of improving quality.
        The Rust project does not dither.
      • This function is now called BEFORE downsampling so the downscaler
        receives a small discrete color set (matches Rust pipeline order).

    rgb        : (H, W, 3) uint8
    alpha      : (H, W)    uint8
    palette_lab: (K, 3)    float32  Lab centroids
    dither     : bool  — set True to re-enable Floyd-Steinberg if desired
    Returns    : (H, W, 4) uint8  RGBA
    """
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

                old = (lab[y, x] + err[y, x]).clip(
                    [0, -128, -128], [100, 127, 127]
                )
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
        # Vectorized nearest-neighbor — fast, no dithering
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


# ---------------------------------------------------------------------------
# Histogram-based two-pass downscaler  (port of Rust's downscale_with_histogram)
# ---------------------------------------------------------------------------

def _scipy_mode(arr, axis):
    """
    Wrapper around scipy.stats.mode that handles the keepdims API
    change introduced in scipy 1.11.
    """
    try:
        result = stats.mode(arr, axis=axis, keepdims=False)
    except TypeError:
        result = stats.mode(arr, axis=axis)
        result = type("_", (), {"mode": np.squeeze(result.mode, axis=axis)})()
    return result.mode.astype(arr.dtype)


def downsample_majority(rgba, grid_w, grid_h):
    """
    Two-pass histogram-mode downscaler.

    Direct port of Rust's `downscale_with_histogram`:

      Pass 1 — vertical:   for each output row, find the most frequent
                           RGBA value in each column of the input rows
                           that map to it.
      Pass 2 — horizontal: same idea left→right on the vertically
                           reduced intermediate image.

    Because apply_palette() has already quantized the image to a small
    discrete palette, "most frequent color" is unambiguous and produces
    crisp, clean pixel-art tiles — no color blending.

    LUMINANCE_WEIGHT controls a darkness bias on ties (0.0 = pure frequency,
    matching the Rust default).

    rgba   : (H, W, 4) uint8  — palette-quantized RGBA
    Returns: (grid_h, grid_w, 4) uint8
    """
    h, w = rgba.shape[:2]

    if grid_w == w and grid_h == h:
        return rgba.copy()

    # Pack RGBA → uint32 so a single integer represents each unique color.
    # This makes mode / unique operations work on one scalar per pixel.
    packed = np.ascontiguousarray(rgba).view(np.uint32).reshape(h, w)

    # ------------------------------------------------------------------
    # Pass 1: vertical  (H, W) → (grid_h, W)
    # ------------------------------------------------------------------
    vert = np.zeros((grid_h, w), dtype=np.uint32)

    for y_out in range(grid_h):
        y0 = int(np.floor(y_out * h / grid_h))
        y1 = min(h, max(y0 + 1, int(np.ceil((y_out + 1) * h / grid_h))))
        block = packed[y0:y1, :]          # (k, W)  — k is usually 2–8

        if block.shape[0] == 1:
            vert[y_out] = block[0]
        elif LUMINANCE_WEIGHT == 0.0:
            # Pure mode — fastest path
            vert[y_out] = _scipy_mode(block, axis=0)
        else:
            # Weighted mode: bias toward darker pixels
            vert[y_out] = _weighted_mode_cols(block, rgba, y0, y1)

    # ------------------------------------------------------------------
    # Pass 2: horizontal  (grid_h, W) → (grid_h, grid_w)
    # ------------------------------------------------------------------
    out = np.zeros((grid_h, grid_w), dtype=np.uint32)

    for x_out in range(grid_w):
        x0 = int(np.floor(x_out * w / grid_w))
        x1 = min(w, max(x0 + 1, int(np.ceil((x_out + 1) * w / grid_w))))
        block = vert[:, x0:x1]            # (grid_h, k)

        if block.shape[1] == 1:
            out[:, x_out] = block[:, 0]
        elif LUMINANCE_WEIGHT == 0.0:
            out[:, x_out] = _scipy_mode(block, axis=1)
        else:
            out[:, x_out] = _weighted_mode_rows(block)

    return out.view(np.uint8).reshape(grid_h, grid_w, 4)


def _weighted_mode_cols(block_packed, rgba_full, y0, y1):
    """
    Luminance-weighted mode per column when LUMINANCE_WEIGHT > 0.
    block_packed: (k, W) uint32
    Returns     : (W,)   uint32
    """
    W = block_packed.shape[1]
    result = np.zeros(W, dtype=np.uint32)

    for x in range(W):
        col = block_packed[:, x]
        vals, counts = np.unique(col, return_counts=True)
        # Unpack uint32 back to RGBA to get luminance
        unpacked = vals.view(np.uint8).reshape(-1, 4)
        lum = (0.2126 * unpacked[:, 0] +
               0.7152 * unpacked[:, 1] +
               0.0722 * unpacked[:, 2]) / 255.0
        scores = counts * (1.0 + LUMINANCE_WEIGHT * (1.0 - lum))
        result[x] = vals[np.argmax(scores)]

    return result


def _weighted_mode_rows(block_packed):
    """
    Luminance-weighted mode per row when LUMINANCE_WEIGHT > 0.
    block_packed: (grid_h, k) uint32
    Returns     : (grid_h,)   uint32
    """
    H = block_packed.shape[0]
    result = np.zeros(H, dtype=np.uint32)

    for y in range(H):
        row = block_packed[y, :]
        vals, counts = np.unique(row, return_counts=True)
        unpacked = vals.view(np.uint8).reshape(-1, 4)
        lum = (0.2126 * unpacked[:, 0] +
               0.7152 * unpacked[:, 1] +
               0.0722 * unpacked[:, 2]) / 255.0
        scores = counts * (1.0 + LUMINANCE_WEIGHT * (1.0 - lum))
        result[y] = vals[np.argmax(scores)]

    return result


# ---------------------------------------------------------------------------
# Post-processing helpers  (unchanged)
# ---------------------------------------------------------------------------

def stabilise(frames, threshold=15):
    """
    Lock pixels that barely change across frames to a single median color,
    eliminating temporal flickering in static areas of an animation.
    frames: list of (H, W, 4) uint8 numpy arrays
    """
    if len(frames) <= 1:
        return frames

    stack = np.stack(frames, axis=0).astype(np.int16)
    rgb = stack[:, :, :, :3]

    max_diff = np.zeros(rgb.shape[1:3], dtype=np.float32)
    for i in range(len(frames) - 1):
        diff = np.abs(
            rgb[i].astype(np.float32) - rgb[i + 1].astype(np.float32)
        ).max(axis=2)
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
    """
    Darken the 1-pixel border between foreground and transparency
    to give sprites a clean outline.
    rgba   : (H, W, 4) uint8
    Returns: (H, W, 4) uint8
    """
    alpha = rgba[:, :, 3]
    fg = (alpha > 128).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    eroded = cv2.erode(fg, kernel, iterations=1)
    border = (fg - eroded).astype(bool)

    out = rgba.copy().astype(np.float32)
    out[border, :3] *= darkness
    out[border, :3] = out[border, :3].clip(0, 255)
    return out.astype(np.uint8)


def upscale_nn(rgba, scale):
    """
    Nearest-neighbour upscale by an integer factor.
    rgba   : (H, W, 4) uint8
    Returns: PIL Image RGBA
    """
    pil = Image.fromarray(rgba, "RGBA")
    w, h = pil.size
    return pil.resize((w * scale, h * scale), Image.NEAREST)


# ---------------------------------------------------------------------------
# Main pipeline  (order changed to match Rust: palette → recolor → downsample)
# ---------------------------------------------------------------------------
def _apply_palette_worker(args):
    rgb, alpha, palette_lab = args
    return apply_palette(rgb, alpha, palette_lab, dither=False)


def _downsample_worker(args):
    rgba, grid_w, grid_h = args
    return downsample_majority(rgba, grid_w, grid_h)

def process_webp_bytes(webp_bytes, n_colors=24, target_size=64, upscale=8):
    """
    Convert a (possibly animated) WebP to pixel art.

    New pipeline order — matches the Rust project's methodology:

      1. Extract frames
      2. Build palette from ALL frames at ORIGINAL resolution  ← was post-downsample
      3. Recolor every frame pixel → nearest palette color     ← NEW step (pre-downsample)
      4. Two-pass histogram downsample                         ← replaces median-Lab majority
      5. Temporal stabilisation  (animations only)
      6. Add outline
      7. Nearest-neighbour upscale

    Why this order produces better pixel art:
      • The palette is derived from full-resolution data → richer, more accurate colors.
      • Downsampling a pre-quantized image (small discrete color set) via histogram
        mode gives crisp, unambiguous tile colors — no blending, no palette pollution.
    """

    frames, durations, meta = extract_frames_from_bytes(webp_bytes)
    n = meta["n_frames"]
    orig_w, orig_h = frames[0].size

    # --- Grid size (same logic as before) ---
    aspect = orig_w / orig_h
    if orig_w >= orig_h:
        grid_w = target_size
        grid_h = max(1, round(target_size / aspect))
    else:
        grid_h = target_size
        grid_w = max(1, round(target_size * aspect))

    # --- Convert PIL frames → numpy RGBA ---
    frames_np = [np.array(f.convert("RGBA")) for f in frames]

    # --- Step 1: Build palette from FULL-RESOLUTION frames ---
    print("Building palette …")
    all_rgb = [f[:, :, :3] for f in frames_np]
    all_alpha = [f[:, :, 3] for f in frames_np]
    palette_lab = build_palette(all_rgb, all_alpha, n_colors)

    # --- Step 2: Recolor — quantize every pixel to the palette (no dithering) ---
    print("Applying palette …")

    with Pool(cpu_count()) as pool:
        recolored = list(tqdm(
            pool.imap(
                _apply_palette_worker,
                [(rgb, alpha, palette_lab) for rgb, alpha in zip(all_rgb, all_alpha)]
            ),
            total=n
        ))

    # --- Step 3: Histogram-based two-pass downsample ---
    print("Downsampling (histogram mode) …")

    with Pool(cpu_count()) as pool:
        downsampled = list(tqdm(
            pool.imap(
                _downsample_worker,
                [(rgba, grid_w, grid_h) for rgba in recolored]
            ),
            total=n
        ))

    # --- Step 4: Temporal stabilisation ---
    if n > 1:
        print("Before stabilise:", len(downsampled))
        downsampled = stabilise(downsampled)
        print("After stabilise:", len(downsampled))

    # --- Step 5: Outline ---
    downsampled = [add_outline(f) for f in downsampled]

    # --- Step 6: Upscale ---
    processed = [upscale_nn(f, upscale) for f in downsampled]

    # --- Encode output ---
    buf = io.BytesIO()

    for i, img in enumerate(processed):
        img.putpixel((0, 0), (i % 255, 0, 0, 255))

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


# ---------------------------------------------------------------------------
# CLI entry-point  (unchanged)
# ---------------------------------------------------------------------------


def main():
    if len(sys.argv) < 2:
        print("Usage: python pixelate_webp.py input.webp")
        sys.exit(1)

    start_time = time.time()  # start timer

    with open(sys.argv[1], "rb") as f:
        webp_bytes = f.read()

    out_bytes = process_webp_bytes(webp_bytes)

    with open("output.webp", "wb") as f:
        f.write(out_bytes)

    end_time = time.time()  # end timer

    print("Saved: output.webp")
    print(f"Execution time: {end_time - start_time:.4f} seconds")


if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    main()
