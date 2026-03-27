from fastapi import APIRouter, Depends
from app.db.models import User, Payment
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter(prefix="/webhooks")


# ─────────────────────────────────────────────
# 🔥 PRODUCT → CREDIT MAPPING
# ─────────────────────────────────────────────
PRODUCT_CREDITS = {
    "pdt_0NbN3OJcBin2HUVp3zW1j": 2000,
    "pdt_0NbN3NbuJMwbLLk2dqfQn": 5000,
}


# ─────────────────────────────────────────────
# 🔍 Helper: get user from Dodo customer_id
# ─────────────────────────────────────────────
async def get_user_by_customer_id(db: AsyncSession, customer_id: str):
    result = await db.execute(
        select(User).where(User.dodo_customer_id == customer_id)
    )
    return result.scalar_one_or_none()


# ─────────────────────────────────────────────
# 🔥 WEBHOOK
# ─────────────────────────────────────────────
@router.post("/dodo")
async def dodo_webhook(payload: dict, db: AsyncSession = Depends(get_db)):

    event_type = payload.get("type")
    data = payload.get("data", {})

    print("EVENT:", event_type)

    # ─────────────────────────────
    # 🔍 Get customer
    # ─────────────────────────────
    customer_id = (
        data.get("customer", {}).get("customer_id")
        or data.get("customer_id")
    )

    user = await get_user_by_customer_id(db, customer_id)

    if not user:
        print("❌ USER NOT FOUND:", customer_id)
        return {"error": "user not found"}

    # ─────────────────────────────
    # 💳 PAYMENT EVENTS ONLY
    # ─────────────────────────────
    if event_type.startswith("payment."):

        payment_id = data.get("payment_id")

        # ─────────────────────────────
        # 🔍 Fetch existing payment
        # ─────────────────────────────
        result = await db.execute(
            select(Payment).where(Payment.dodo_payment_id == payment_id)
        )
        payment = result.scalar_one_or_none()

        # ─────────────────────────────
        # 🆕 Create if not exists
        # ─────────────────────────────
        if not payment:
            payment = Payment(
                user_id=user.id,
                dodo_payment_id=payment_id,
                amount=data.get("total_amount", 0),
                status="processing",
            )
            db.add(payment)

        # ─────────────────────────────
        # ⏳ PROCESSING
        # ─────────────────────────────
        if event_type == "payment.processing":
            payment.status = "processing"
            await db.commit()

        # ─────────────────────────────
        # ❌ FAILED
        # ─────────────────────────────
        elif event_type == "payment.failed":
            payment.status = "failed"
            await db.commit()

            return {
                "status": "failed",
            }

        # ─────────────────────────────
        # 🚫 CANCELLED
        # ─────────────────────────────
        elif event_type == "payment.cancelled":
            payment.status = "cancelled"
            await db.commit()

            return {
                "status": "cancelled",
            }

        # ─────────────────────────────
        # ✅ SUCCESS (CORE LOGIC)
        # ─────────────────────────────
        elif event_type == "payment.succeeded":

            # 🔒 IDEMPOTENCY CHECK
            if payment.status == "succeeded":
                print("⚠️ Duplicate webhook ignored:", payment_id)
                return {"status": "duplicate"}

            payment.status = "succeeded"

            # ─────────────────────────────
            # 📦 Extract product_id
            # ─────────────────────────────
            product_cart = data.get("product_cart", [])

            if not product_cart:
                return {"error": "no product found"}

            product_id = product_cart[0].get("product_id")

            # ─────────────────────────────
            # 🎯 Map to credits
            # ─────────────────────────────
            credits_to_add = PRODUCT_CREDITS.get(product_id, 0)

            if credits_to_add == 0:
                print("⚠️ Unknown product_id:", product_id)
                return {"error": "invalid product"}

            # ─────────────────────────────
            # 💰 Add credits
            # ─────────────────────────────
            user.credits = (user.credits or 0) + credits_to_add

            # ─────────────────────────────
            # 🧾 Store metadata (recommended)
            # ─────────────────────────────
            payment.credits_added = credits_to_add

            # optional (if you add column later)
            if hasattr(payment, "product_id"):
                payment.product_id = product_id

            await db.commit()

            print(f"💰 PAYMENT SUCCESS → +{credits_to_add} credits")

            return {
                "status": "success",
                "credits_added": credits_to_add,
            }

        print(f"💳 PAYMENT EVENT HANDLED: {event_type}")

    return {"status": "ok"}