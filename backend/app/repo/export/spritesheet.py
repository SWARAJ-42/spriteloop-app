# Output: spritesheet.png (grid-packed frames) + spritesheet.json (TexturePacker Array format with frame coordinates and durations)

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


def export(data: bytes) -> dict[str, bytes]:
    frames, durations = get_frames(data)
    fw, fh = frames[0].size
    n = len(frames)
    cols = math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)

    sheet = Image.new("RGBA", (cols * fw, rows * fh), (0, 0, 0, 0))
    frame_entries = []

    for i, (frame, duration) in enumerate(zip(frames, durations)):
        col, row = i % cols, i // cols
        x, y = col * fw, row * fh
        sheet.paste(frame, (x, y))
        frame_entries.append({
            "filename": f"frame_{i:04d}.png",
            "frame": {"x": x, "y": y, "w": fw, "h": fh},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": fw, "h": fh},
            "sourceSize": {"w": fw, "h": fh},
            "duration": duration
        })

    atlas = {
        "frames": frame_entries,
        "meta": {
            "app": "animation-exporter",
            "version": "1.0",
            "image": "spritesheet.png",
            "format": "RGBA8888",
            "size": {"w": cols * fw, "h": rows * fh},
            "scale": "1"
        }
    }

    png_buf = io.BytesIO()
    sheet.save(png_buf, "PNG")

    return {
        "spritesheet.png": png_buf.getvalue(),
        "spritesheet.json": json.dumps(atlas, indent=2).encode()
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
