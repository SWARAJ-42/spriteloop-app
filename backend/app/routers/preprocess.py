from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import os
import shutil
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import base64
import io
from PIL import Image
from pathlib import Path
import asyncio

from app.api.deps import get_current_user
from app.db.models import Project, Generation, User
from app.db.session import get_db
from app.repo.preprocesssprite import preprocess_sprite
from app.repo.inference import generate_sprite
from app.repo.promptazure import generate_prompt_bytes
from app.repo.poseCorrection import pose_correct_bytes
from app.repo.postprocesspixalated import process_webp_bytes as pixelate_webp
from app.repo.postprocessremovebg import process_webp as removebg_webp
from app.services.azure_blob import upload_file_to_blob, generate_sas_url


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

    return {"credits_remaining": user.credits_remaining}


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

    if file.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG/JPG allowed")

    image_bytes = await file.read()

    if pose_correction == "true":
        uid = firebase_user["uid"]

        result = await db.execute(select(User).where(User.firebase_uid == uid))
        user = result.scalar_one()

        if user.credits_remaining < 5:
            return {"success": False, "error": "No credits remaining"}

        user.credits_remaining -= 5
        await db.commit()

        # move to thread
        image_bytes = await asyncio.to_thread(
            pose_correct_bytes,
            image_bytes,
            animation_type
        )

    # move to thread
    processed_bytes = await asyncio.to_thread(
        preprocess_sprite,
        image_bytes,
        pixel_art=True
    )

    return Response(content=processed_bytes, media_type="image/png")


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

    if user.credits_remaining < 40:
        return {"success": False, "error": "Not enough credits"}

    # Deduct credits (we'll rollback if something fails)
    user.credits_remaining -= 40
    await db.commit()

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
                req.additional_prompt
            )
        except Exception:
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
                raise Exception("GPU capacity is temporarily unavailable. Please retry in a few seconds.")
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
                webp_bytes = await asyncio.to_thread(pixelate_webp, webp_bytes)
            except Exception:
                raise Exception("Post-processing failed")

        # ─────────────────────────────
        # Frame extraction
        # ─────────────────────────────
        def extract_frames(bytes_data):
            img = Image.open(io.BytesIO(bytes_data))
            frames = []

            try:
                while True:
                    frame = img.copy().convert("RGBA")
                    buf = io.BytesIO()
                    frame.save(buf, format="PNG")
                    frames.append(base64.b64encode(buf.getvalue()).decode())
                    img.seek(len(frames))
            except EOFError:
                pass

            return frames

        try:
            frames = await asyncio.to_thread(extract_frames, webp_bytes)
        except Exception:
            raise Exception("Failed to extract animation frames")

        return {"success": True, "frames": frames}

    except Exception as e:
        # ─────────────────────────────
        # CRITICAL: rollback credits
        # ─────────────────────────────
        user.credits_remaining += 40
        await db.commit()

        return {
            "success": False,
            "error": str(e)
        }

# ─────────────────────────────────────────────
# Helper — Save frames locally
# ─────────────────────────────────────────────

def save_generation_locally(
    project_id: int,
    generation_id: int,
    job_id: str,
    selected_frames: list[int],
):

    job_folder = STATIC_DIR / "animations" / "frames"

    save_folder = STATIC_DIR / str(project_id) / str(generation_id)

    save_folder.mkdir(parents=True, exist_ok=True)

    saved_paths = []

    for idx in selected_frames:

        src = job_folder / f"frame_{idx:03d}.png"
        dst = save_folder / f"frame_{idx:03d}.png"

        shutil.copy(src, dst)

        saved_paths.append(str(dst))

    return saved_paths


# ─────────────────────────────────────────────
# Phase 3 – Save Animation
# ─────────────────────────────────────────────
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
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one()

    # verify project ownership
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id
        )
    )
    project = result.scalar_one()

    # create generation row
    generation = Generation(
        project_id=project_id,
        name=f"generation_{job_id}",
        generation_type="animation",
        asset_path=""
    )

    db.add(generation)
    await db.commit()
    await db.refresh(generation)

    content = await gif.read()

    blob_name = f"users/{user.id}/projects/{project_id}/generations/{generation.id}/animation.gif"

    # offload Azure upload
    await asyncio.to_thread(
        upload_file_to_blob,
        content,
        blob_name
    )

    generation.asset_path = blob_name
    await db.commit()

    sas_url = generate_sas_url(blob_name)

    return {
        "success": True,
        "generation_id": generation.id,
        "saved_asset_url": sas_url,
    }