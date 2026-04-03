# Output: character.json (Spine 3.8 skeleton + frame-by-frame animation), character.atlas (texture atlas metadata), character.png (packed spritesheet)

import hashlib
import io
import json
import math
import sys
from PIL import Image, ImageSequence


def get_frames(data: bytes) -> tuple[list[Image.Image], list[int]]:
    src = Image.open(io.BytesIO(data))
    frames, durations = [], []
    for frame in ImageSequence.Iterator(src):
        frames.append(frame.copy().convert("RGBA"))
        durations.append(frame.info.get("duration", 100))
    return frames, durations


def build_spritesheet(frames: list[Image.Image]) -> tuple[Image.Image, int]:
    fw, fh = frames[0].size
    n = len(frames)
    cols = math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)
    sheet = Image.new("RGBA", (cols * fw, rows * fh), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.paste(frame, (i % cols * fw, i // cols * fh))
    return sheet, cols


def export(data: bytes) -> dict[str, bytes]:
    frames, durations = get_frames(data)
    fw, fh = frames[0].size
    sheet, cols = build_spritesheet(frames)
    sw, sh = sheet.size

    png_buf = io.BytesIO()
    sheet.save(png_buf, "PNG")
    png_bytes = png_buf.getvalue()

    atlas_lines = [
        "character.png",
        f"size: {sw}, {sh}",
        "filter: Linear, Linear",
        "repeat: none",
        "pma: false",
        ""
    ]
    for i in range(len(frames)):
        x = (i % cols) * fw
        y = (i // cols) * fh
        atlas_lines += [
            f"frame_{i:04d}",
            f"  rotate: false",
            f"  xy: {x}, {y}",
            f"  size: {fw}, {fh}",
            f"  orig: {fw}, {fh}",
            f"  offset: 0, 0",
            f"  index: -1",
            ""
        ]

    skin_attachments = {
        f"frame_{i:04d}": {"x": 0, "y": 0, "width": fw, "height": fh}
        for i in range(len(frames))
    }

    attachment_keyframes = []
    t = 0.0
    for i, duration_ms in enumerate(durations):
        attachment_keyframes.append({"time": round(t, 6), "name": f"frame_{i:04d}"})
        t += duration_ms / 1000.0
    attachment_keyframes.append({"time": round(t, 6), "name": None})

    spine = {
        "skeleton": {
            "hash": hashlib.md5(png_bytes).hexdigest()[:8],
            "spine": "3.8.75",
            "x": 0, "y": 0,
            "width": fw, "height": fh,
            "images": "./images/",
            "audio": ""
        },
        "bones": [{"name": "root"}],
        "slots": [{"name": "slot0", "bone": "root", "attachment": "frame_0000"}],
        "skins": [{"name": "default", "attachments": {"slot0": skin_attachments}}],
        "animations": {
            "animation": {
                "slots": {
                    "slot0": {
                        "attachment": attachment_keyframes
                    }
                }
            }
        }
    }

    return {
        "character.json": json.dumps(spine, indent=2).encode(),
        "character.atlas": "\n".join(atlas_lines).encode(),
        "character.png": png_bytes
    }


if __name__ == "__main__":
    path = sys.argv[1]
    with open(path, "rb") as f:
        data = f.read()
    results = export(data)
    for name, content in results.items():
        with open(name, "wb") as f:
            f.write(content)
        print(f"Saved {name} ({len(content)} bytes)")
