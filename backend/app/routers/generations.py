from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
from pydantic import BaseModel
import shutil

from app.db.models import Generation
from app.db.session import get_db

router = APIRouter(prefix="/generations", tags=["Project Generations"])


# ─────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


class DeleteGenerationsRequest(BaseModel):
    generation_ids: list[int]


# ─────────────────────────────────────────────
# Get Generations for Project
# ─────────────────────────────────────────────
@router.get("/{project_id}/generations")
async def get_project_generations(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):

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

            # asset_path stored as relative path in DB
            rel_path = Path(gen.asset_path)

            # full filesystem path
            full_path = STATIC_DIR / rel_path

            if full_path.exists():
                gif_url = f"http://localhost:8000/static/{rel_path.as_posix()}"

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
# Delete Generations
# ─────────────────────────────────────────────
@router.delete("/delete")
async def delete_generations(
    req: DeleteGenerationsRequest,
    db: AsyncSession = Depends(get_db),
):

    result = await db.execute(
        select(Generation).where(Generation.id.in_(req.generation_ids))
    )

    gens = result.scalars().all()

    if not gens:
        raise HTTPException(status_code=404, detail="Generations not found")

    deleted_ids = []

    for gen in gens:

        if gen.asset_path:

            rel_path = Path(gen.asset_path)
            full_path = STATIC_DIR / rel_path

            folder = full_path.parent

            if folder.exists():
                shutil.rmtree(folder)

        await db.delete(gen)

        deleted_ids.append(gen.id)

    await db.commit()

    return {
        "success": True,
        "deleted_ids": deleted_ids
    }