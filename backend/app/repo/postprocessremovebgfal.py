import io
import os
import sys
import time
import shutil
import tempfile
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageSequence
from torchvision.transforms.functional import normalize
from huggingface_hub import hf_hub_download

# ── CONFIG ─────────────────────────────────────────

MODEL_REPO = "briaai/RMBG-1.4"
WORKERS = 4
MAX_SIZE = 1024

# If you are on GPU, 2-4 workers is usually enough.
# On CPU, 4-8 can help.

# ── DOWNLOAD / PREPARE BRIA MODEL CODE ─────────────

BASE_DIR = Path(tempfile.gettempdir()) / "bria_rmbg_local"
PKG_DIR = BASE_DIR / "bria_rmbg_pkg"
PKG_DIR.mkdir(parents=True, exist_ok=True)
(PKG_DIR / "__init__.py").write_text("", encoding="utf-8")

def _download_into_package(filename: str) -> Path:
    src = hf_hub_download(repo_id=MODEL_REPO, filename=filename)
    dst = PKG_DIR / filename
    shutil.copy2(src, dst)
    return dst

# Download the repo code files that BriaRMBG depends on.
_download_into_package("MyConfig.py")
_download_into_package("briarmbg.py")

# Make the temp package importable.
sys.path.insert(0, str(BASE_DIR))

from bria_rmbg_pkg.briarmbg import BriaRMBG  # type: ignore

# Patch for newer Transformers-style internals, even though we do not use from_pretrained.
if getattr(BriaRMBG, "all_tied_weights_keys", None) is None:
    BriaRMBG.all_tied_weights_keys = {}
if getattr(BriaRMBG, "_tied_weights_keys", None) is None:
    BriaRMBG._tied_weights_keys = {}

# ── LOAD WEIGHTS DIRECTLY ──────────────────────────

def _safe_torch_load(path: str):
    try:
        return torch.load(path, map_location="cpu", weights_only=True)
    except TypeError:
        return torch.load(path, map_location="cpu")
    except Exception:
        return torch.load(path, map_location="cpu", weights_only=False)

def _extract_state_dict(obj):
    if isinstance(obj, dict):
        for key in ("state_dict", "model_state_dict", "model", "net", "weights"):
            if key in obj and isinstance(obj[key], dict):
                return obj[key]
    return obj

def _strip_module_prefix(state_dict):
    if not isinstance(state_dict, dict):
        return state_dict
    if any(k.startswith("module.") for k in state_dict.keys()):
        return {k.replace("module.", "", 1): v for k, v in state_dict.items()}
    return state_dict

print("🚀 Loading model...")

ckpt_path = hf_hub_download(repo_id=MODEL_REPO, filename="model.pth")
state = _safe_torch_load(ckpt_path)
state = _extract_state_dict(state)
state = _strip_module_prefix(state)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = BriaRMBG()
missing, unexpected = model.load_state_dict(state, strict=False)
model.to(device)
model.eval()

if missing or unexpected:
    print("⚠️ Loaded with non-strict state dict match.")
    if missing:
        print("Missing keys:", missing)
    if unexpected:
        print("Unexpected keys:", unexpected)

print("✅ Model loaded")

# ── PREPROCESS / POSTPROCESS ───────────────────────

def preprocess_image(im: np.ndarray, model_input_size=(1024, 1024)) -> torch.Tensor:
    if len(im.shape) < 3:
        im = im[:, :, np.newaxis]

    im_tensor = torch.tensor(im, dtype=torch.float32).permute(2, 0, 1)
    im_tensor = F.interpolate(
        torch.unsqueeze(im_tensor, 0),
        size=model_input_size,
        mode="bilinear",
        align_corners=False,
    )
    image = torch.divide(im_tensor, 255.0)
    image = normalize(image, [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
    return image

def postprocess_image(result: torch.Tensor, im_size) -> np.ndarray:
    result = torch.squeeze(
        F.interpolate(result, size=im_size, mode="bilinear", align_corners=False),
        0,
    )
    ma = torch.max(result)
    mi = torch.min(result)
    result = (result - mi) / (ma - mi + 1e-8)
    im_array = (result * 255).permute(1, 2, 0).cpu().data.numpy().astype(np.uint8)
    im_array = np.squeeze(im_array)
    return im_array

def remove_bg_local(frame: Image.Image) -> Image.Image:
    orig_rgb = frame.convert("RGB")
    orig_np = np.array(orig_rgb)
    orig_size = orig_np.shape[0:2]

    image = preprocess_image(orig_np, [1024, 1024]).to(device)

    with torch.inference_mode():
        result = model(image)

    mask = postprocess_image(result[0][0], orig_size)
    mask_im = Image.fromarray(mask).convert("L")

    out = frame.convert("RGBA").copy()
    out.putalpha(mask_im)
    return out

# ── FRAME LOGIC ────────────────────────────────────

def extract_frames(img: Image.Image):
    frames = []
    for frame in ImageSequence.Iterator(img):
        duration = frame.info.get("duration", img.info.get("duration", 100))
        frames.append((frame.convert("RGBA").copy(), duration))
    return frames

def is_animated(img: Image.Image):
    return getattr(img, "is_animated", False)

# ── PARALLEL PROCESSING ────────────────────────────

def process_single(idx, frame, duration, max_size):
    frame = frame.copy()
    frame.thumbnail((max_size, max_size))
    result = remove_bg_local(frame)
    return idx, result, duration

def process_frames_parallel(frames_info, workers, max_size):
    results = [None] * len(frames_info)
    durations = [0] * len(frames_info)

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [
            executor.submit(process_single, i, f, d, max_size)
            for i, (f, d) in enumerate(frames_info)
        ]

        for future in as_completed(futures):
            idx, frame, dur = future.result()
            results[idx] = frame
            durations[idx] = dur

    return results, durations

# ── ENCODE OUTPUT ──────────────────────────────────

def encode_webp(frames, durations) -> bytes:
    buf = io.BytesIO()

    for i, img in enumerate(frames):
        img.putpixel((0, 0), (i % 255, 0, 0, 255))

    if len(frames) == 1:
        frames[0].save(buf, "WEBP", lossless=True)
    else:
        frames[0].save(
            buf,
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=0,
            lossless=True,
        )

    return buf.getvalue()

# ── MAIN FUNCTION ──────────────────────────────────

def process_webp_bytes(webp_bytes: bytes, workers=WORKERS, max_size=MAX_SIZE) -> bytes:
    """
    Input:  webp/gif bytes
    Output: processed webp bytes with background removed
    """
    img = Image.open(io.BytesIO(webp_bytes))

    if is_animated(img):
        frames_info = extract_frames(img)
    else:
        frames_info = [(img.convert("RGBA"), img.info.get("duration", 100))]

    frames, durations = process_frames_parallel(frames_info, workers, max_size)
    return encode_webp(frames, durations)

# ── CLI USAGE ──────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python new2.py input.gif|input.webp [output.webp]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "output.webp"

    with open(input_path, "rb") as f:
        input_bytes = f.read()

    print("🚀 Processing...")
    output_bytes = process_webp_bytes(input_bytes)

    with open(output_path, "wb") as f:
        f.write(output_bytes)

    print(f"✅ Done → {output_path}")