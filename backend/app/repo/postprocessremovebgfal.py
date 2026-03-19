import sys
import io
import os
import base64
import time
import warnings
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
import requests
from PIL import Image
from tqdm import tqdm

warnings.filterwarnings("ignore")

FAL_KEY = "your_fal_api_key_here"
os.environ["FAL_KEY"] = FAL_KEY

try:
    import fal_client
except ImportError:
    print("Run: pip install fal-client pillow numpy tqdm requests")
    sys.exit(1)

FAL_MODELS = {
    "general": "fal-ai/birefnet",
    "v2": "fal-ai/birefnet/v2",
}

MODEL_TYPES = {
    "general": "General Use (Light)",
    "v2": "General Use (Heavy)",
}


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


def compute_global_bg(frames):

    samples = []

    for frame in frames:

        arr = np.array(frame.convert("RGB"), dtype=np.float32)

        h, w = arr.shape[:2]

        p = max(1, 3)

        samples.append(arr[:p, :].reshape(-1, 3))
        samples.append(arr[-p:, :].reshape(-1, 3))
        samples.append(arr[:, :p].reshape(-1, 3))
        samples.append(arr[:, -p:].reshape(-1, 3))

    all_px = np.concatenate(samples, axis=0)

    return np.median(all_px, axis=0)


def preprocess_frame(frame, global_bg):

    arr = np.array(frame.convert("RGB"), dtype=np.float32)

    if global_bg.mean() > 185:

        diff = np.abs(arr - global_bg).max(axis=2)

        arr[diff < 35] = 255.0

    return Image.fromarray(arr.clip(0, 255).astype(np.uint8)).convert("RGB")


def frame_to_uri(frame, bg):

    clean = preprocess_frame(frame, bg)

    buf = io.BytesIO()

    clean.save(buf, format="PNG")

    b64 = base64.b64encode(buf.getvalue()).decode()

    return f"data:image/png;base64,{b64}"


def call_api(frame, bg, model_key, retries=3):

    endpoint = FAL_MODELS[model_key]
    model_type = MODEL_TYPES[model_key]

    uri = frame_to_uri(frame, bg)

    w, h = frame.size

    for attempt in range(retries):

        try:

            result = fal_client.run(
                endpoint,
                arguments={
                    "image_url": uri,
                    "model": model_type,
                    "output_format": "png",
                    "refine_foreground": True,
                },
            )

            img_url = result["image"]["url"]

            resp = requests.get(img_url, timeout=30)

            resp.raise_for_status()

            out = Image.open(io.BytesIO(resp.content)).convert("RGBA")

            if out.size != (w, h):
                out = out.resize((w, h), Image.LANCZOS)

            alpha = np.array(out, dtype=np.float32)[:, :, 3] / 255.0

            return alpha

        except Exception as e:

            if attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
            else:
                raise RuntimeError(str(e))


def run_parallel(frames, bg, model_key, workers):

    alphas = [None] * len(frames)

    with ThreadPoolExecutor(max_workers=workers) as pool:

        futures = {
            pool.submit(call_api, frame, bg, model_key): i
            for i, frame in enumerate(frames)
        }

        with tqdm(total=len(frames)) as bar:

            for f in as_completed(futures):

                idx = futures[f]

                alphas[idx] = f.result()

                bar.update(1)

    return alphas


def temporal_smooth(alphas, radius):

    if radius == 0 or len(alphas) <= 1:
        return alphas

    n = len(alphas)

    out = []

    for i in range(n):

        lo = max(0, i - radius)
        hi = min(n, i + radius + 1)

        stack = np.stack(alphas[lo:hi], axis=0)

        out.append(stack.mean(axis=0))

    return out


def apply_mask(frame, mask):

    alpha = (mask * 255).clip(0, 255)

    orig = np.array(frame.convert("RGBA"), dtype=np.float32)

    whiteness = orig[:, :, :3].min(axis=2)

    alpha[(whiteness > 228) & (alpha < 180)] = 0

    alpha = np.where(alpha < 8, 0, alpha)
    alpha = np.where(alpha > 247, 255, alpha)

    orig[:, :, 3] = alpha

    return Image.fromarray(orig.clip(0, 255).astype(np.uint8), "RGBA")


def process_webp_bytes(webp_bytes):

    frames, durations, meta = extract_frames_from_bytes(webp_bytes)

    bg = compute_global_bg(frames)

    start = time.time()

    alphas = run_parallel(frames, bg, "general", 8)

    alphas = temporal_smooth(alphas, 1)

    processed = [apply_mask(f, a) for f, a in zip(frames, alphas)]

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


def main():

    if len(sys.argv) < 2:
        print("Usage: python remove_bg_webp.py input.webp")
        sys.exit(1)

    with open(sys.argv[1], "rb") as f:
        webp_bytes = f.read()

    out_bytes = process_webp_bytes(webp_bytes)

    with open("output.webp", "wb") as f:
        f.write(out_bytes)

    print("Saved: output.webp")


if __name__ == "__main__":
    main()