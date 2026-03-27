"""
Nano Banana — Pose Correction Module (Bytes In / Bytes Out)
===========================================================

Install:
pip install google-genai pillow

Run:
python nano_banana_pose.py --input person.png

Output:
./output/person_posed.png
"""

import argparse
import io
import os
import time
import warnings
from pathlib import Path
from PIL import Image
from google import genai
from google.genai import types
from dotenv import load_dotenv

from app.repo.prompts import *

load_dotenv()

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("POSE_MODEL")
OUTPUT_DIR = "./output"

# ──────────────────────────────────────────────────────────
# CORE MODULE (BYTES)
# ──────────────────────────────────────────────────────────
def pose_correct_bytes(image_bytes: bytes, animation_type: str) -> bytes:
    """
    Repose image using Nano Banana.

    Args:
        image_bytes: input image as bytes
        animation_type: string

    Returns:
        PNG image bytes
    """

    client = genai.Client(api_key=GEMINI_API_KEY)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    if animation_type == "running":
        prompt = POSE_PROMPT_RUNNING
    elif animation_type == "walking":
        prompt = POSE_PROMPT_WALKING
    elif animation_type == "jumping":
        prompt = POSE_PROMPT_JUMPING
    else:
        prompt = POSE_PROMPT_IDLE

    for attempt in range(3):
        try:
            resp = client.models.generate_content(
                model=MODEL,
                contents=[prompt, img],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"]
                ),
            )

            # print(resp)

            for part in resp.parts:
                if part.inline_data:
                    return part.inline_data.data

            raise RuntimeError("No image returned")

        except Exception as e:
            print(f"[Attempt {attempt+1}/3] {e}")
            if attempt < 2:
                time.sleep(3)
            else:
                raise


# ──────────────────────────────────────────────────────────
# FILE WRAPPER
# ──────────────────────────────────────────────────────────
def pose_correct_file(input_path: str, output_path: str):

    print("[Pose] Running Nano Banana pose correction...")

    with open(input_path, "rb") as f:
        img_bytes = f.read()

    result_bytes = pose_correct_bytes(img_bytes, "idle")

    with open(output_path, "wb") as f:
        f.write(result_bytes)

    print(f"✓ Saved: {output_path}")


# ──────────────────────────────────────────────────────────
# MAIN (CLI)
# ──────────────────────────────────────────────────────────
def main():

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input image path")
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    stem = Path(args.input).stem
    output_path = os.path.join(OUTPUT_DIR, f"{stem}_posed.png")

    print("\n==============================")
    print("NANO BANANA — POSE CORRECTION")
    print("==============================\n")

    pose_correct_file(args.input, output_path)

    print("\nDone.")
    print(f"Output folder → {os.path.abspath(OUTPUT_DIR)}\n")


if __name__ == "__main__":
    main()