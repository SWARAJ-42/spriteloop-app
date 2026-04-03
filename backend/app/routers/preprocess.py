from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import base64
import io
from PIL import Image, ImageSequence
from pathlib import Path
import asyncio
from fastapi.responses import JSONResponse
import base64

from app.api.deps import get_current_user
from app.db.models import Project, Generation, User
from app.db.session import get_db
from app.repo.preprocesssprite import preprocess_sprite
from app.repo.inference import generate_sprite
from app.repo.promptazure import generate_prompt_bytes
from app.repo.poseCorrection import pose_correct_bytes
from app.repo.postprocesspixalated import process_webp_bytes as pixelate_webp
from app.repo.postprocessremovebgfal import process_webp_bytes as removebg_webp
from app.services.azure_blob import upload_file_to_blob, generate_sas_url
from app.services.credits import check_balance, charge_credits


router = APIRouter(prefix="/main", tags=["Generation"])


# ─────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────
# Get User Credits
# ─────────────────────────────────────────────
@router.get("/credits")
async def get_user_credits(
    db: AsyncSession = Depends(get_db),
    firebase_user=Depends(get_current_user),
):
    uid = firebase_user["uid"]

    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalar_one()

    return {"credits_remaining": user.credits or 0}


# ─────────────────────────────────────────────
# Phase 1 – Pre Generate
# ─────────────────────────────────────────────
@router.post("/pre-generate")
async def pre_generate(
    file: UploadFile = File(...),
    pose_correction: str = Form(...),
    animation_type: str = Form(...),
    preprocess_prompt: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    firebase_user=Depends(get_current_user),
):

    print("User:", firebase_user["uid"])
    print("Received file:", file.filename)
    print("animation_type:", animation_type)
    print("Pose correction:", pose_correction)
    print("Prompt:", preprocess_prompt)

    if preprocess_prompt is None:
        preprocess_prompt = "None"

    if file.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG/JPG allowed")

    image_bytes = await file.read()

    user = None
    charged = False  # 🔥 track if we deducted

    # ─────────────────────────────
    # Generate prompt
    # ─────────────────────────────
    try:
        animation_prompt = await asyncio.to_thread(
            generate_prompt_bytes, image_bytes, animation_type, "", ""
        )

    except Exception as e:
        print(e)
        raise Exception("Failed to generate animation prompt")

    try:
        if pose_correction == "true":
            uid = firebase_user["uid"]

            result = await db.execute(select(User).where(User.firebase_uid == uid))
            user = result.scalar_one()

            balance = await check_balance(user)

            if balance < 10:
                return {"success": False, "error": "No credits remaining"}

            # charge credits
            await charge_credits(db, user, 10, "pose_correction")
            charged = True

            # risky operation
            image_bytes = await asyncio.to_thread(
                pose_correct_bytes,
                image_bytes,
                animation_type,
                additional_prompt=preprocess_prompt,
            )

        # ─────────────────────────────
        # Preprocess (can also fail)
        # ─────────────────────────────
        processed_bytes = await asyncio.to_thread(
            preprocess_sprite, image_bytes, pixel_art=True
        )

        return JSONResponse(
            {
                "processed_image": base64.b64encode(processed_bytes).decode(),
                "prompt": animation_prompt,
            }
        )

    except Exception as e:

        # 🔥 REFUND IF WE CHARGED
        if charged and user:
            user.credits = (user.credits or 0) + 10
            await db.commit()

            print("💸 REFUND APPLIED → +10 credits")

        return JSONResponse({"success": False, "error": str(e)})


# ─────────────────────────────────────────────
# Phase 2 – Generate Animation
# ─────────────────────────────────────────────

class GenerateRequest(BaseModel):
    image_base64: str
    animation_type: str
    additional_prompt: str
    post_process: bool


@router.post("/generate")
async def generate_animation(
    req: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    firebase_user=Depends(get_current_user),
):
    uid = firebase_user["uid"]

    # ─────────────────────────────
    # Get user
    # ─────────────────────────────
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalar_one()

    # ───────────────
    # CHECK BALANCE
    # ───────────────
    balance = await check_balance(user)

    if balance < 40:
        return {"success": False, "error": "Not enough credits"}

    # ───────────────
    # CHARGE CREDITS
    # ───────────────
    await charge_credits(db, user, 40, "animation_generation")
    refunded = False

    try:
        # ─────────────────────────────
        # Decode input
        # ─────────────────────────────
        try:
            image_bytes = base64.b64decode(req.image_base64)
        except Exception:
            raise Exception("Invalid image data")

        # ─────────────────────────────
        # Generate prompt
        # ─────────────────────────────
        try:
            animation_prompt = await asyncio.to_thread(
                generate_prompt_bytes,
                image_bytes,
                req.animation_type,
                "PBmcK7uc",
                req.additional_prompt,
            )
        except Exception as e:
            print(e)
            raise Exception("Failed to generate animation prompt")

        # ─────────────────────────────
        # RunPod (MAIN FAILURE POINT)
        # ─────────────────────────────
        try:
            webp_base64 = await asyncio.to_thread(
                generate_sprite,
                req.image_base64,
                animation_prompt,
                f"gamesprite_2d_{req.animation_type}163.safetensors",
                req.animation_type,
            )
        except Exception as e:
            msg = str(e)

            # Clean mapping from your RunPod code :contentReference[oaicite:0]{index=0}
            if "GPU" in msg or "capacity" in msg:
                raise Exception(
                    "GPU capacity is temporarily unavailable. Please retry in a few seconds."
                )
            else:
                raise Exception("Animation generation failed. Please try again.")

        # ─────────────────────────────
        # Decode WebP
        # ─────────────────────────────
        try:
            webp_bytes = base64.b64decode(webp_base64)
        except Exception:
            raise Exception("Failed to process generated animation")

        # ─────────────────────────────
        # Optional post-process
        # ─────────────────────────────
        if req.post_process:
            try:
                webp_bytes = await asyncio.to_thread(removebg_webp, webp_bytes)
                webp_bytes = await asyncio.to_thread(pixelate_webp, webp_bytes)
            except Exception:
                raise Exception("Post-processing failed")

        # ─────────────────────────────
        # Frame extraction
        # ─────────────────────────────
        # preprocess.py - Inside generate_animation function
        def extract_frames(bytes_data):
            img = Image.open(io.BytesIO(bytes_data))
            frames = []

            try:
                while True:
                    # Explicitly ensure we are in RGBA
                    frame = img.copy().convert("RGBA")
                    buf = io.BytesIO()
                    # Transparency=True and explicit disposal handling is key for WebP/GIF
                    frame.save(buf, format="PNG") 
                    frames.append(base64.b64encode(buf.getvalue()).decode())
                    
                    # Use tell() to ensure correct frame seeking
                    current = img.tell()
                    img.seek(current + 1)
            except EOFError:
                pass

            return frames

        try:
            frames = await asyncio.to_thread(extract_frames, webp_bytes)
        except Exception:
            raise Exception("Failed to extract animation frames")

        return {"success": True, "frames": frames}

    except Exception as e:

        # 🔥 LOCAL REFUND (CORRECT)
        if not refunded:
            user.credits = (user.credits or 0) + 40
            await db.commit()
            refunded = True

            print("💸 REFUND APPLIED → +40 credits")

        return {"success": False, "error": str(e)}


# ─────────────────────────────────────────────
# Phase 3 – Save Animation, Pixelate, Remove BG
# ─────────────────────────────────────────────
def frames_to_webp_bytes(frames: list[str]) -> bytes:
    images = []

    for b64 in frames:
        img = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
        images.append(img)

    buf = io.BytesIO()

    for i, img in enumerate(images):
        img.putpixel((0, 0), (i % 255, 0, 0, 255))

    # Save animated WebP
    images[0].save(
        buf,
        format="WEBP",
        save_all=True,
        append_images=images[1:],
        duration=100,
        loop=0,
        lossless=True,
        quality=100,
        method=6,
        minimize_size=False,   # 🔥 IMPORTANT
    )

    return buf.getvalue()

def webp_bytes_to_frames(webp_bytes: bytes):
    img = Image.open(io.BytesIO(webp_bytes))
    frames = []

    for i, frame in enumerate(ImageSequence.Iterator(img)):
        buf = io.BytesIO()
        frame.convert("RGBA").save(buf, format="PNG")
        frames.append(base64.b64encode(buf.getvalue()).decode())

    return frames

@router.post("/save")
async def save_animation(
    job_id: str = Form(...),
    project_id: int = Form(...),
    gif: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    firebase_user=Depends(get_current_user),
):

    uid = firebase_user["uid"]

    # get user
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalar_one()

    # verify project ownership
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one()

    # create generation row
    generation = Generation(
        project_id=project_id,
        name=f"generation_{job_id}",
        generation_type="animation",
        asset_path="",
    )

    db.add(generation)
    await db.commit()
    await db.refresh(generation)

    content = await gif.read()

    blob_name = f"users/{user.id}/projects/{project_id}/generations/{generation.id}/animation.gif"

    # offload Azure upload
    await asyncio.to_thread(upload_file_to_blob, content, blob_name)

    generation.asset_path = blob_name
    await db.commit()

    sas_url = generate_sas_url(blob_name)

    return {
        "success": True,
        "generation_id": generation.id,
        "saved_asset_url": sas_url,
    }

class FrameProcessRequest(BaseModel):
    frames: list[str]

def decode_base64_image(b64: str):
    return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")

def encode_image(img: Image.Image):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

@router.post("/remove-bg")
async def remove_bg(
    req: FrameProcessRequest,
    firebase_user=Depends(get_current_user),
):
    try:

        # 🔹 frames → animated webp
        webp_bytes = await asyncio.to_thread(
            frames_to_webp_bytes,
            req.frames
        )

        # 🔥 YOUR EXISTING FUNCTION
        webp_bytes = await asyncio.to_thread(removebg_webp, webp_bytes)

        # 🔹 back → frames
        frames = await asyncio.to_thread(webp_bytes_to_frames, webp_bytes)

        return {"success": True, "frames": frames}

    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/pixelate")
async def pixelate(
    req: FrameProcessRequest,
    firebase_user=Depends(get_current_user),
):
    try:
        # 🔹 frames → animated webp
        webp_bytes = await asyncio.to_thread(
            frames_to_webp_bytes,
            req.frames
        )

        # 🔥 YOUR EXISTING FUNCTION
        webp_bytes = await asyncio.to_thread(pixelate_webp, webp_bytes)

        # 🔹 back → frames
        frames = await asyncio.to_thread(webp_bytes_to_frames, webp_bytes)

        return {"success": True, "frames": frames}

    except Exception as e:
        return {"success": False, "error": str(e)}