from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete

from app.api.deps import get_current_user
from app.db.session import AsyncSessionLocal
from app.db.models import Project, User, Generation

from app.services.azure_blob import generate_sas_url, blob_service_client


router = APIRouter(prefix="/projects", tags=["projects"])


# ─────────────────────────────────────────────
# Create Project (unchanged)
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
# Get Projects (SAS URLs instead of static)
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
                    try:
                        sas_url = generate_sas_url(gen.asset_path)
                        images.append(sas_url)
                    except Exception:
                        pass  # blob missing, skip

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
# Delete Project (Azure + DB)
# ─────────────────────────────────────────────
@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    firebase_user=Depends(get_current_user)
):

    uid = firebase_user["uid"]

    async with AsyncSessionLocal() as session:

        # get user
        result = await session.execute(
            select(User).where(User.firebase_uid == uid)
        )
        user = result.scalar_one()

        # verify project ownership
        result = await session.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == user.id
            )
        )
        project = result.scalar_one_or_none()

        if not project:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # fetch generations
        gen_result = await session.execute(
            select(Generation).where(Generation.project_id == project_id)
        )

        generations = gen_result.scalars().all()

        container_client = blob_service_client.get_container_client("generations")

        # delete all blobs
        for gen in generations:

            if gen.asset_path:
                try:
                    blob_client = container_client.get_blob_client(gen.asset_path)
                    blob_client.delete_blob()
                except Exception:
                    pass  # ignore missing blobs

        # delete project (cascade will handle generations if configured)
        await session.execute(
            delete(Project).where(Project.id == project_id)
        )

        await session.commit()

        return {"status": "deleted"}