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

    # NEW
    credits_remaining = Column(Integer, default=100)
    credits_last_reset = Column(DateTime, server_default=func.now())

    projects = relationship("Project", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="projects")

    generations = relationship(
        "Generation", back_populates="project", cascade="all, delete-orphan"
    )


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )

    name = Column(String)

    asset_path = Column(String)  # local path / s3 url later

    generation_type = Column(String)  # idle / running / jumping

    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="generations")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    paypal_order_id = Column(String, unique=True, index=True)

    credits_added = Column(Integer)

    created_at = Column(DateTime, server_default=func.now())