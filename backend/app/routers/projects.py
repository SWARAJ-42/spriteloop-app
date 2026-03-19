from fastapi import APIRouter, Depends
from sqlalchemy import select, delete
from pathlib import Path

from app.api.deps import get_current_user
from app.db.session import AsyncSessionLocal
from app.db.models import Project, User, Generation


router = APIRouter(prefix="/projects", tags=["projects"])


# ─────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


# ─────────────────────────────────────────────
# Create Project
# ─────────────────────────────────────────────
@router.post("/")
async def create_project(
    data: dict,
    firebase_user=Depends(get_current_user),
):

    uid = firebase_user["uid"]

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(User).where(User.firebase_uid == uid)
        )
        user = result.scalar_one()

        project = Project(
            name=data["name"],
            user_id=user.id
        )

        session.add(project)
        await session.commit()
        await session.refresh(project)

        return {
            "id": project.id,
            "name": project.name,
            "createdAt": project.created_at
        }


# ─────────────────────────────────────────────
# Get Projects
# ─────────────────────────────────────────────
@router.get("/")
async def get_projects(firebase_user=Depends(get_current_user)):

    uid = firebase_user["uid"]

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(User).where(User.firebase_uid == uid)
        )
        user = result.scalar_one()

        projects_result = await session.execute(
            select(Project).where(Project.user_id == user.id)
        )

        projects = projects_result.scalars().all()

        response = []

        for p in projects:

            gen_result = await session.execute(
                select(Generation)
                .where(Generation.project_id == p.id)
                .order_by(Generation.id.desc())
            )

            generations = gen_result.scalars().all()

            images = []

            for gen in generations[:3]:

                if gen.asset_path:

                    # asset_path stored as relative path
                    rel_path = Path(gen.asset_path)

                    full_path = STATIC_DIR / rel_path

                    if full_path.exists():

                        gif_url = f"http://localhost:8000/static/{rel_path.as_posix()}"

                        images.append(gif_url)

            response.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "images": images,
                    "createdAt": p.created_at,
                }
            )

        return response


# ─────────────────────────────────────────────
# Delete Project
# ─────────────────────────────────────────────
@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    firebase_user=Depends(get_current_user)
):

    uid = firebase_user["uid"]

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(User).where(User.firebase_uid == uid)
        )
        user = result.scalar_one()

        # get generations first to delete files
        gen_result = await session.execute(
            select(Generation).where(Generation.project_id == project_id)
        )

        generations = gen_result.scalars().all()

        for gen in generations:

            if gen.asset_path:

                rel_path = Path(gen.asset_path)
                full_path = STATIC_DIR / rel_path

                folder = full_path.parent

                if folder.exists():
                    import shutil
                    shutil.rmtree(folder)

        await session.execute(
            delete(Project).where(
                Project.id == project_id,
                Project.user_id == user.id
            )
        )

        await session.commit()

        return {"status": "deleted"}