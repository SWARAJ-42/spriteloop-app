from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now())
    last_login_at = Column(DateTime)
    last_logout_at = Column(DateTime)
    deleted_at = Column(DateTime)

    # 🔥 DODO
    dodo_customer_id = Column(String, unique=True, index=True)

    # 🔥 ONLY THING THAT MATTERS NOW
    credits = Column(Integer, default=100)

    projects = relationship(
        "Project",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    # ✅ FIXED: DB-level cascade
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(String, nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="projects")

    generations = relationship(
        "Generation",
        back_populates="project",
        cascade="all, delete-orphan"
    )


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(String)
    asset_path = Column(String)
    generation_type = Column(String)

    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="generations")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    dodo_payment_id = Column(String, unique=True, index=True)

    amount = Column(Integer)
    credits_added = Column(Integer)

    status = Column(String)  # processing, succeeded, failed, cancelled

    created_at = Column(DateTime, server_default=func.now())