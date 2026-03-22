from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from app.api.deps import get_current_user
from app.db.session import AsyncSessionLocal
from app.db.models import User
from datetime import datetime
from app.core.firebase import delete_firebase_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me")
async def me(firebase_user=Depends(get_current_user)):
    uid = firebase_user["uid"]

    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.firebase_uid == uid)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                firebase_uid=uid,
                email=firebase_user.get("email", ""),
                is_active=True,
                last_login_at=datetime.utcnow(),
            )
            session.add(user)

        else:
            if not user.is_active:
                raise HTTPException(403, detail="User account not active")

            user.last_login_at = datetime.utcnow()

        await session.commit()

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

    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.firebase_uid == uid)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            user.is_active = False
            user.deleted_at = datetime.utcnow()
            await session.commit()

    delete_firebase_user(uid)

    return {"status": "account deleted"}
