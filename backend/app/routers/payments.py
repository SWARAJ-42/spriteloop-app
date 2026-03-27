from fastapi import APIRouter, Depends
from app.services.dodo import client
from app.api.deps import get_current_user
from app.db.session import get_db
from app.db.models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/payments")

@router.post("/create-checkout")
async def create_checkout(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    product_id = body["product_id"]

    # 🔥 fetch user properly (IMPORTANT)
    result = await db.execute(
        select(User).where(User.firebase_uid == user["uid"])
    )
    db_user = result.scalar_one()

    # 🔴 DEBUG
    print("Before:", db_user.dodo_customer_id)

    if not db_user.dodo_customer_id:
        customer = await client.customers.create(
            email=db_user.email,
            name=db_user.email
        )

        db_user.dodo_customer_id = customer.customer_id

        await db.commit()
        await db.refresh(db_user)   # 🔥 IMPORTANT

        print("Saved:", db_user.dodo_customer_id)

    session = await client.checkout_sessions.create(
        product_cart=[{
            "product_id": product_id,
            "quantity": 1,
        }],
        customer={
            "customer_id": db_user.dodo_customer_id
        },
        return_url=f"{os.getenv("FRONTEND_URL")}"
    )

    return {"checkout_url": session.checkout_url}

@router.get("/latest-status")
async def latest_payment_status(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    from app.db.models import Payment, User
    from sqlalchemy import select

    # 🔥 STEP 1: Convert Firebase UID → DB user
    result = await db.execute(
        select(User).where(User.firebase_uid == user["uid"])
    )
    db_user = result.scalar_one()

    # 🔥 STEP 2: Get latest payment
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == db_user.id)   # ✅ CORRECT
        .order_by(Payment.id.desc())
        .limit(1)
    )

    payment = result.scalar_one_or_none()

    if not payment:
        return {"status": "none"}

    return {
        "status": payment.status,
        "credits": payment.credits_added,
        "payment_id": payment.dodo_payment_id
    }