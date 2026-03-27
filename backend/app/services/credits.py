from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User
from sqlalchemy import update


# ─────────────────────────────────────────────
# ✅ CHECK BALANCE (LOCAL ONLY)
# ─────────────────────────────────────────────
async def check_balance(user: User):
    return user.credits or 0


# ─────────────────────────────────────────────
# ✅ CHARGE CREDITS (LOCAL ONLY)
# ─────────────────────────────────────────────

async def charge_credits(db, user: User, amount: int, reason: str):

    result = await db.execute(
        update(User)
        .where(User.id == user.id)
        .where(User.credits >= amount)
        .values(credits=User.credits - amount)
        .execution_options(synchronize_session="fetch")
    )

    if result.rowcount == 0:
        raise Exception("Not enough credits")

    await db.commit()