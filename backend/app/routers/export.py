from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import base64, io, zipfile

router = APIRouter()

@router.post("/export")
async def export_route(req: Request):
    body = await req.json()
    frames = body["frames"]
    export_type = body["type"]

    # Convert frames → GIF bytes
    from PIL import Image
    import io

    images = [Image.open(io.BytesIO(base64.b64decode(f))) for f in frames]

    gif_buffer = io.BytesIO()
    images[0].save(
        gif_buffer,
        format="GIF",
        save_all=True,
        append_images=images[1:],
        loop=0,
        duration=100,
        disposal=2,
    )

    gif_bytes = gif_buffer.getvalue()

    # Use your utilities
    if export_type == "spritesheet":
        from app.repo.export.spritesheet import export
        result = export(gif_bytes)

    elif export_type == "spine":
        from app.repo.export.spine import export
        result = export(gif_bytes)

    # Zip output
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