from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import base64, io, zipfile, json
from PIL import Image

router = APIRouter()

def build_gif(images: list[Image.Image], fps: int) -> bytes:
    duration_ms = int(1000 / fps)
    rgba_frames = [img.convert("RGBA") for img in images]
    buf = io.BytesIO()
    rgba_frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=rgba_frames[1:],
        loop=0,
        duration=duration_ms,
        disposal=2,
        optimize=False,
    )
    return buf.getvalue()

@router.post("/export")
async def export_route(req: Request):
    body = await req.json()
    frames = body["frames"]
    export_type = body["type"]
    fps = int(body.get("fps", 12))

    images = [Image.open(io.BytesIO(base64.b64decode(f))) for f in frames]
    gif_bytes = build_gif(images, fps)

    if export_type == "gif":
        return StreamingResponse(
            io.BytesIO(gif_bytes),
            media_type="image/gif",
            headers={"Content-Disposition": "attachment; filename=animation.gif"},
        )

    if export_type == "spritesheet":
        from app.repo.export.spritesheet import export
        result = export(gif_bytes)
    elif export_type == "spine":
        from app.repo.export.spine import export
        result = export(gif_bytes)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as z:
        for name, content in result.items():
            z.writestr(name, content)
    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=export.zip"},
    )