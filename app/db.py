"""Модели и подключение к базе. По умолчанию SQLite; для PostgreSQL достаточно задать DATABASE_URL."""
import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import (JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text,
                        UniqueConstraint, create_engine, select)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("LIBRARY_DATA", BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "thumbs").mkdir(exist_ok=True)

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATA_DIR / 'library.db'}")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

STATUSES = ["new", "planned", "in_progress", "done", "archived"]

DEFAULT_CATEGORIES = [
    ("watch", "Посмотреть", "#6c7bff", 1),
    ("read", "Прочитать", "#4cc38a", 2),
    ("ideas", "Идеи", "#f5a54a", 3),
    ("places", "Места", "#a78bfa", 4),
    ("buy", "Купить", "#f472b6", 5),
]


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


item_tags = Table(
    "item_tags", Base.metadata,
    Column("item_id", ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True)  # пусто = системная категория
    slug = Column(String(40), nullable=False)
    name = Column(String(80), nullable=False)
    color = Column(String(16), default="#888888")
    sort = Column(Integer, default=100)


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, default=1)
    name = Column(String(60), nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "name"),)


class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, default=1, index=True)
    url = Column(Text, nullable=False)
    url_norm = Column(Text, nullable=False)
    source = Column(String(20), default="web")
    content_type = Column(String(20), default="other")
    title = Column(Text)
    description = Column(Text)
    author = Column(Text)
    duration_sec = Column(Integer)
    thumb_path = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    status = Column(String(20), default="new", index=True)
    is_favorite = Column(Boolean, default=False)
    note = Column(Text)
    meta_state = Column(String(12), default="pending")
    meta_raw = Column(JSON)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)
    category = relationship("Category", lazy="joined")
    tags = relationship("Tag", secondary=item_tags, lazy="selectin")
    __table_args__ = (UniqueConstraint("user_id", "url_norm"),)


class Board(Base):
    __tablename__ = "boards"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, default=1, index=True)
    name = Column(String(120), nullable=False)
    status = Column(String(20), default="work")  # work — в работе, pause — пауза, archive — архив
    tags = Column(Text, default="[]")  # свой список тегов доски, JSON-массив строк
    created_at = Column(DateTime, default=now)
    columns = relationship("KColumn", back_populates="board", cascade="all, delete-orphan", order_by="KColumn.sort")


class KColumn(Base):
    __tablename__ = "kcolumns"
    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(80), nullable=False)
    sort = Column(Integer, default=0)
    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan", order_by="Card.sort")


class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    column_id = Column(Integer, ForeignKey("kcolumns.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="")
    note = Column(Text, default="")
    tags = Column(Text, default="[]")  # теги карточки — из списка её доски, JSON-массив строк
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, default=now)
    column = relationship("KColumn", back_populates="cards")


def init_db():
    Base.metadata.create_all(engine)
    # колонка статуса появилась позже: добавляем в уже существующую таблицу
    from sqlalchemy import inspect, text
    if "status" not in [c["name"] for c in inspect(engine).get_columns("boards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE boards ADD COLUMN status VARCHAR(20) DEFAULT 'work'"))
    cols = inspect(engine).get_columns
    if "tags" not in [c["name"] for c in cols("boards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE boards ADD COLUMN tags TEXT DEFAULT '[]'"))
    if "tags" not in [c["name"] for c in cols("cards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cards ADD COLUMN tags TEXT DEFAULT '[]'"))
    with SessionLocal() as s:
        if not s.scalars(select(Category)).first():
            for slug, name, color, sort in DEFAULT_CATEGORIES:
                s.add(Category(user_id=None, slug=slug, name=name, color=color, sort=sort))
            s.commit()
