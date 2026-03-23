from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import asyncio
from functools import partial

from app.db.models import Generation, Project, User
from app.db.session import get_db
from app.api.deps import get_current_user

from app.services.azure_blob import generate_sas_url, blob_service_client

router = APIRouter(prefix="/generations", tags=["Project Generations"])


class DeleteGenerationsRequest(BaseModel):
    generation_ids: list[int]


# ─────────────────────────────────────────────
# Get Generations for Project (SECURE)
# ─────────────────────────────────────────────
@router.get("/{project_id}/generations")
async def get_project_generations(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    firebase_user=Depends(get_current_user),
):

    uid = firebase_user["uid"]

    # get user
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalar_one()

    # verify project ownership
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # fetch generations
    result = await db.execute(
        select(Generation)
        .where(Generation.project_id == project_id)
        .order_by(Generation.id.desc())
    )

    generations = result.scalars().all()

    data = []

    for gen in generations:

        gif_url = None

        if gen.asset_path:
            try:
                gif_url = generate_sas_url(gen.asset_path)
            except Exception:
                gif_url = None  # blob might be missing

        data.append(
            {
                "generation_id": gen.id,
                "name": gen.name,
                "gif_url": gif_url,
                "created_at": gen.created_at,
            }
        )

    return {
        "success": True,
        "generations": data
    }


# ─────────────────────────────────────────────
# Delete Generations (Azure + DB)
# ─────────────────────────────────────────────
@router.delete("/delete")
async def delete_generations(
    req: DeleteGenerationsRequest,
    db: AsyncSession = Depends(get_db),
    firebase_user=Depends(get_current_user),
):
    uid = firebase_user["uid"]

    # get user
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalar_one()

    # fetch generations with ownership check
    result = await db.execute(
        select(Generation)
        .join(Project)
        .where(
            Generation.id.in_(req.generation_ids),
            Project.user_id == user.id
        )
    )
    gens = result.scalars().all()

    if not gens:
        raise HTTPException(status_code=404, detail="Generations not found")

    container_client = blob_service_client.get_container_client("generations")

    # ─────────────────────────────
    # 1. Parallel Azure deletes
    # ─────────────────────────────
    async def delete_blob_async(path: str):
        try:
            blob_client = container_client.get_blob_client(path)

            # run blocking call in thread
            await asyncio.to_thread(blob_client.delete_blob)

        except Exception:
            pass

    blob_tasks = [
        delete_blob_async(gen.asset_path)
        for gen in gens
        if gen.asset_path
    ]

    await asyncio.gather(*blob_tasks)

    # ─────────────────────────────
    # 2. Batch DB delete (faster)
    # ─────────────────────────────
    for gen in gens:
        await db.delete(gen)

    await db.commit()

    return {
        "success": True,
        "deleted_ids": [gen.id for gen in gens]
    }