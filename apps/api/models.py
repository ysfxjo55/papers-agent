from datetime import datetime, UTC

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Notebook(Base):
    __tablename__ = "notebooks"

    id: Mapped[str] = mapped_column(String, primary_key=True)


class Nodes(Base):
    __tablename__ = "nodes"

    notebook_id: Mapped[str] = mapped_column(
        String, ForeignKey("notebooks.id"), primary_key=True
    )
    id: Mapped[str] = mapped_column(String, primary_key=True)
    kind: Mapped[str] = mapped_column(String)
    parent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    label: Mapped[str] = mapped_column(String)
    year: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(String)
    summary: Mapped[str] = mapped_column(String)
    annotations: Mapped[list] = mapped_column(JSON, nullable=False, server_default="[]")
    x: Mapped[int] = mapped_column(Integer)
    y: Mapped[int] = mapped_column(Integer)


class Edges(Base):
    __tablename__ = "edges"

    notebook_id: Mapped[str] = mapped_column(
        String, ForeignKey("notebooks.id"), primary_key=True
    )
    from_id: Mapped[str] = mapped_column("from", String, primary_key=True)
    to_id: Mapped[str] = mapped_column("to", String, primary_key=True)
    type: Mapped[str] = mapped_column(String, primary_key=True)


class Messages(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    notebook_id: Mapped[str] = mapped_column(String, ForeignKey("notebooks.id"))
    role: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(UTC))


class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, index=True)
    source: Mapped[str] = mapped_column(String, server_default="waitlist")
    note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )
