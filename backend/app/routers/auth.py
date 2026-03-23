from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from app.api.deps import get_current_user
from app.db.session import AsyncSessionLocal
from app.db.models import User, Project, Payment, Generation
from app.services.azure_blob import delete_blob, generate_sas_url  # adjust if needed
from datetime import datetime
from app.core.firebase import delete_firebase_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me")
async def me(firebase_user=Depends(get_current_user)):
    uid = firebase_user["uid"]
    email = firebase_user.get("email")

    print("firebase_uid:", uid)
    print("email:", email)

    async with AsyncSessionLocal() as session:

        # 1. Try find by UID (primary)
        result = await session.execute(
            select(User).where(User.firebase_uid == uid)
        )
        user = result.scalar_one_or_none()

        # 2. If not found → try email (fallback)
        if not user and email:
            result = await session.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()

            # If found → UPDATE UID (this is your idea)
            if user:
                print("Updating UID for existing user")
                user.firebase_uid = uid

        # 3. If still not found → create new user
        if not user:
            user = User(
                firebase_uid=uid,
                email=email or "",
                is_active=True,
                last_login_at=datetime.utcnow(),
            )
            session.add(user)

        else:
            if not user.is_active:
                raise HTTPException(403, detail="User account not active")

            user.last_login_at = datetime.utcnow()

        await session.commit()
        await session.refresh(user)

        return {
            "id": user.id,
            "email": user.email,
            "firebase_uid": user.firebase_uid,
            "last_login_at": user.last_login_at,
        }

@router.post("/logout")
async def logout(firebase_user=Depends(get_current_user)):
    uid = firebase_user["uid"]

    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.firebase_uid == uid)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            user.last_logout_at = datetime.utcnow()
            await session.commit()

    return {"status": "logout tracked"}

@router.delete("/delete-account")
async def delete_account(firebase_user=Depends(get_current_user)):
    uid = firebase_user["uid"]

    # 1. Delete Firebase user first
    try:
        delete_firebase_user(uid)
    except Exception as e:
        raise HTTPException(500, detail=f"Firebase deletion failed: {str(e)}")

    async with AsyncSessionLocal() as session:

        # 2. Get user
        result = await session.execute(
            select(User).where(User.firebase_uid == uid)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(404, detail="User not found")

        # 3. Collect blob paths
        result = await session.execute(
            select(Generation.asset_path)
            .join(Project)
            .where(Project.user_id == user.id)
        )
        blob_paths = [row[0] for row in result.all() if row[0]]

        # 4. Delete blobs
        for path in blob_paths:
            delete_blob(path)

        # 5. HARD DELETE (cascade handles everything)
        await session.delete(user)

        # 6. Commit
        await session.commit()

    return {"status": "account permanently deleted"}