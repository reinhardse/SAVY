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


class BoardLink(Base):
    """Ссылка-«хайлайт» над доской: документ или сайт проекта, с комментарием."""
    __tablename__ = "board_links"
    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(Text, nullable=False)
    title = Column(String(300), nullable=True)
    comment = Column(Text, default="")
    name = Column(String(300), nullable=True)  # название, которое пишете сами
    thumb = Column(String(120), nullable=True)  # имя файла картинки страницы в thumbs/
    sort = Column(Integer, default=0)  # порядок: новые — в конце
    created_at = Column(DateTime, default=now)


class KColumn(Base):
    __tablename__ = "kcolumns"
    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(80), nullable=False)
    sort = Column(Integer, default=0)
    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan", order_by="Card.sort")


class GCalToken(Base):
    """Доступ к Google Календарю: долгосрочный refresh_token пользователя."""
    __tablename__ = "gcal_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, default=1, unique=True)
    refresh_token = Column(Text, nullable=False)


class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    column_id = Column(Integer, ForeignKey("kcolumns.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="")
    note = Column(Text, default="")
    tags = Column(Text, default="[]")  # теги карточки — из списка её доски, JSON-массив строк
    due_date = Column(String(10), nullable=True)  # дата YYYY-MM-DD
    due_time = Column(String(5), nullable=True)  # время начала HH:MM
    duration_min = Column(Integer, nullable=True)  # длительность, минут
    priority = Column(Integer, nullable=True)  # приоритет: 3 — высокий, 2 — средний, 1 — низкий, None — не задан
    gcal_event_id = Column(String(255), nullable=True)  # событие в Google Календаре
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, default=now)
    column = relationship("KColumn", back_populates="cards")



# ---------- CRM: воронка сделок, контакты, компании ----------
deal_contacts = Table(
    "deal_contacts", Base.metadata,
    Column("deal_id", ForeignKey("deals.id", ondelete="CASCADE"), primary_key=True),
    Column("contact_id", ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
)
deal_companies = Table(
    "deal_companies", Base.metadata,
    Column("deal_id", ForeignKey("deals.id", ondelete="CASCADE"), primary_key=True),
    Column("company_id", ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True),
)
contact_companies = Table(
    "contact_companies", Base.metadata,
    Column("contact_id", ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
    Column("company_id", ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True),
)


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), default="")
    card_url = Column(String(500), nullable=True)  # ссылка на карточку компании (Google Диск)
    created_at = Column(DateTime, default=now)
    deals = relationship("Deal", secondary=deal_companies, back_populates="companies")
    contacts = relationship("Contact", secondary=contact_companies, back_populates="companies")


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True)
    first_name = Column(String(100), default="")
    last_name = Column(String(100), default="")
    middle_name = Column(String(100), default="")
    phone = Column(String(50), default="")
    email = Column(String(200), default="")
    telegram = Column(String(100), default="")
    position = Column(String(200), default="")
    city = Column(String(100), default="")
    created_at = Column(DateTime, default=now)
    companies = relationship("Company", secondary=contact_companies, back_populates="contacts")
    deals = relationship("Deal", secondary=deal_contacts, back_populates="contacts")


class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), default="")
    amount = Column(Integer, nullable=True)  # бюджет, рублей
    stage = Column(String(20), default="new")  # ключ этапа воронки
    format = Column(String(10), nullable=True)  # white / black
    documents_url = Column(String(500), nullable=True)  # ссылка на Google Диск
    created_at = Column(DateTime, default=now)
    contacts = relationship("Contact", secondary=deal_contacts, back_populates="deals")
    companies = relationship("Company", secondary=deal_companies, back_populates="deals")
    messages = relationship("DealMessage", back_populates="deal", cascade="all, delete-orphan",
                            order_by="DealMessage.created_at")


class DealMessage(Base):
    __tablename__ = "deal_messages"
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, default="")
    created_at = Column(DateTime, default=now)
    deal = relationship("Deal", back_populates="messages")


def init_db():
    Base.metadata.create_all(engine)
    # колонка статуса появилась позже: добавляем в уже существующую таблицу
    from sqlalchemy import inspect, text
    if "board_links" in inspect(engine).get_table_names():
        have = [c["name"] for c in inspect(engine).get_columns("board_links")]
        for col, ddl in [("name", "VARCHAR(300)"), ("thumb", "VARCHAR(120)"), ("sort", "INTEGER DEFAULT 0")]:
            if col not in have:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE board_links ADD COLUMN {col} {ddl}"))
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
    if "due_date" not in [c["name"] for c in cols("cards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cards ADD COLUMN due_date VARCHAR(10)"))
    if "due_time" not in [c["name"] for c in cols("cards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cards ADD COLUMN due_time VARCHAR(5)"))
    if "priority" not in [c["name"] for c in cols("cards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cards ADD COLUMN priority INTEGER"))
    if "duration_min" not in [c["name"] for c in cols("cards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cards ADD COLUMN duration_min INTEGER"))
    if "gcal_event_id" not in [c["name"] for c in cols("cards")]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cards ADD COLUMN gcal_event_id VARCHAR(255)"))
    with SessionLocal() as s:
        if not s.scalars(select(Category)).first():
            for slug, name, color, sort in DEFAULT_CATEGORIES:
                s.add(Category(user_id=None, slug=slug, name=name, color=color, sort=sort))
            s.commit()
