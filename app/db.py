"""Модели и подключение к базе. По умолчанию SQLite; для PostgreSQL достаточно задать DATABASE_URL."""
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import (JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text,
                        Index, UniqueConstraint, create_engine, func, select)
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
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)  # папка доски, если материал положен в папку
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
    # одна и та же ссылка — один раз в каталоге и один раз в каждой папке; в разных папках она может повторяться
    __table_args__ = (Index("uq_items_user_url_folder", "user_id", "url_norm", func.coalesce(folder_id, 0), unique=True),)


class CardSub(Base):
    """Подзадача карточки. Может быть вложена в карточку (parent_id пустой) или в другую подзадачу — глубина без предела."""
    __tablename__ = "card_subs"
    id = Column(Integer, primary_key=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("card_subs.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(300), default="")
    note = Column(Text, default="")
    due_date = Column(String(10), nullable=True)  # дата YYYY-MM-DD
    done = Column(Boolean, default=False)
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, default=now)


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


class Folder(Base):
    """Папка материалов: на доске или внутри другой папки. Внутри можно создавать новые папки."""
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=True, index=True)
    parent_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(300), nullable=False, default="")
    sort = Column(Integer, default=0)
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
    inn = Column(String(20), nullable=True)  # ИНН
    website = Column(String(500), nullable=True)  # сайт компании
    phone = Column(String(50), default="")
    email = Column(String(200), default="")
    telegram = Column(String(200), default="")
    max_messenger = Column(String(200), default="")  # MAX
    vk = Column(String(200), default="")  # ВКонтакте
    extra_phones = Column(Text, default="[]")
    extra_emails = Column(Text, default="[]")
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
    website = Column(String(500), nullable=True)  # сайт контакта
    vk = Column(String(200), default="")  # ВКонтакте
    extra_phones = Column(Text, default="[]")  # дополнительные телефоны (JSON-список)
    extra_emails = Column(Text, default="[]")  # дополнительные почты (JSON-список)
    created_at = Column(DateTime, default=now)
    companies = relationship("Company", secondary=contact_companies, back_populates="contacts")
    deals = relationship("Deal", secondary=deal_contacts, back_populates="contacts")


class CrmPipeline(Base):
    """Воронка: её название задаёт пользователь, этапы внутри — тоже."""
    __tablename__ = "crm_pipelines"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), default="")
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, default=now)
    stages = relationship("CrmStage", back_populates="pipeline", cascade="all, delete-orphan",
                          order_by="CrmStage.sort, CrmStage.id")


class CrmStage(Base):
    """Этап воронки. kind: work — в работе, won — успешно, lost — потеряно (для блоков в контактах и компаниях)."""
    __tablename__ = "crm_stages"
    id = Column(Integer, primary_key=True)
    pipeline_id = Column(Integer, ForeignKey("crm_pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), default="")
    kind = Column(String(10), default="work")
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, default=now)
    pipeline = relationship("CrmPipeline", back_populates="stages")


# этапы, с которыми появилась воронка сделок: ключ прежнего поля stage, название, вид
CRM_LEGACY_STAGES = [("new", "Новая заявка", "work"), ("later", "Когда-нибудь", "work"),
                     ("talks", "Переговоры", "work"), ("work", "В работе", "work"),
                     ("won", "Успешно", "won"), ("lost", "Закрыто и не реализовано", "lost")]
# этапы новой воронки
CRM_NEW_FUNNEL_STAGES = [("Новая заявка", "work"), ("В работе", "work"),
                         ("Успешно", "won"), ("Закрыто и не реализовано", "lost")]


class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), default="")
    amount = Column(Integer, nullable=True)  # бюджет, рублей
    pipeline_id = Column(Integer, ForeignKey("crm_pipelines.id", ondelete="CASCADE"), nullable=True, index=True)
    stage_id = Column(Integer, ForeignKey("crm_stages.id", ondelete="SET NULL"), nullable=True, index=True)
    stage = Column(String(20), default="new")  # прежний ключ этапа, после переноса не используется
    sort = Column(Integer, default=0)  # порядок карточки внутри этапа
    format = Column(String(10), nullable=True)  # white / black
    documents_url = Column(String(500), nullable=True)  # ссылка на Google Диск
    created_at = Column(DateTime, default=now)
    contacts = relationship("Contact", secondary=deal_contacts, back_populates="deals")
    companies = relationship("Company", secondary=deal_companies, back_populates="deals")
    cstage = relationship("CrmStage")
    pipeline = relationship("CrmPipeline")
    messages = relationship("DealMessage", back_populates="deal", cascade="all, delete-orphan",
                            order_by="DealMessage.created_at")
    tasks = relationship("CrmTask", back_populates="deal", cascade="all, delete-orphan",
                         order_by="CrmTask.id")


class CrmTask(Base):
    """Задача по сделке: попадает в календарь (метка CRM) и в Google Календарь."""
    __tablename__ = "crm_tasks"
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(300), default="")
    due_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    due_time = Column(String(5), nullable=True)  # HH:MM
    status = Column(String(10), default="open")  # open / done
    result = Column(Text, default="")  # итог, которым закрыта задача
    done_at = Column(DateTime, nullable=True)
    gcal_event_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now)
    deal = relationship("Deal", back_populates="tasks")


class DealMessage(Base):
    __tablename__ = "deal_messages"
    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    text = Column(Text, default="")
    created_at = Column(DateTime, default=now)
    deal = relationship("Deal", back_populates="messages")


def _migrate_crm(conn) -> None:
    """Таблицы задач и сообщений получили владельцев (контакт, компания) и стали допускать пустую сделку.
    SQLite не умеет менять ограничения колонок, поэтому таблицу пересоздаём с сохранением данных."""
    from sqlalchemy import inspect as sa_inspect, text
    insp = sa_inspect(conn)
    for table in ("crm_tasks", "deal_messages"):
        if table not in insp.get_table_names():
            continue
        cols = {c["name"]: c for c in insp.get_columns(table)}
        if "contact_id" in cols and cols["deal_id"]["nullable"]:
            continue
        for ix in insp.get_indexes(table):
            conn.execute(text(f'DROP INDEX IF EXISTS "{ix["name"]}"'))
        conn.execute(text(f"ALTER TABLE {table} RENAME TO {table}__old"))
        Base.metadata.tables[table].create(conn)
        new_cols = set(Base.metadata.tables[table].c.keys())
        common = ", ".join(c for c in cols if c in new_cols)
        conn.execute(text(f"INSERT INTO {table} ({common}) SELECT {common} FROM {table}__old"))
        conn.execute(text(f"DROP TABLE {table}__old"))


def _migrate_pipelines(had_pipelines: bool) -> None:
    """Воронки и этапы. Колонки сделки добавляем всегда; при первом появлении воронок
    создаём «Воронку продаж» с прежними этапами и переносим в неё все сделки по старым ключам."""
    from sqlalchemy import inspect as sa_inspect, text
    from sqlalchemy.orm import Session as _Session
    with engine.begin() as conn:
        cols = [c["name"] for c in sa_inspect(conn).get_columns("deals")]
        for col in ("pipeline_id", "stage_id"):
            if col not in cols:
                conn.execute(text(f"ALTER TABLE deals ADD COLUMN {col} INTEGER"))
    if had_pipelines:
        return
    with _Session(engine) as db:
        pipe = CrmPipeline(title="Воронка продаж", sort=1)
        db.add(pipe)
        db.flush()
        stages = [CrmStage(pipeline_id=pipe.id, name=name, kind=kind, sort=i + 1)
                  for i, (_, name, kind) in enumerate(CRM_LEGACY_STAGES)]
        db.add_all(stages)
        db.flush()
        keymap = {key: st.id for (key, _, _), st in zip(CRM_LEGACY_STAGES, stages)}
        for d in db.scalars(select(Deal)).all():
            d.pipeline_id = pipe.id
            d.stage_id = keymap.get(d.stage or "new", stages[0].id)
        db.commit()


def _migrate_items_unique(conn):
    """Раньше адрес был уникален на весь каталог вместе с папками. Теперь уникален внутри каталога и внутри каждой папки."""
    from sqlalchemy import inspect as insp, text
    if "items" not in insp(conn).get_table_names():
        return
    old = any(sorted(u["column_names"]) == ["url_norm", "user_id"] for u in insp(conn).get_unique_constraints("items"))
    if conn.dialect.name == "sqlite":
        row = conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='items'")).first()
        if row and "UNIQUE (user_id, url_norm)" in row[0]:
            old = True
            ddl = re.sub(r",\s*UNIQUE \(user_id, url_norm\)", "", row[0])
            assert "UNIQUE (user_id, url_norm)" not in ddl
            ddl = ddl.replace("CREATE TABLE items", "CREATE TABLE items_new", 1)
            conn.execute(text(ddl))
            conn.execute(text("INSERT INTO items_new SELECT * FROM items"))
            conn.execute(text("DROP TABLE items"))
            conn.execute(text("ALTER TABLE items_new RENAME TO items"))
            for name, col in (("ix_items_user_id", "user_id"), ("ix_items_status", "status"), ("ix_items_folder_id", "folder_id")):
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {name} ON items ({col})"))
    elif old:
        for u in insp(conn).get_unique_constraints("items"):
            if sorted(u["column_names"]) == ["url_norm", "user_id"]:
                conn.execute(text(f'ALTER TABLE items DROP CONSTRAINT "{u["name"]}"'))
    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_items_user_url_folder ON items (user_id, url_norm, COALESCE(folder_id, 0))"))


def init_db():
    from sqlalchemy import inspect as _pre
    had_pipelines = "crm_pipelines" in _pre(engine).get_table_names()
    Base.metadata.create_all(engine)
    _migrate_pipelines(had_pipelines)
    with engine.begin() as _conn:
        _migrate_crm(_conn)
        from sqlalchemy import inspect as _insp, text as _text
        if "deals" in _insp(_conn).get_table_names():
            if "sort" not in [c["name"] for c in _insp(_conn).get_columns("deals")]:
                _conn.execute(_text("ALTER TABLE deals ADD COLUMN sort INTEGER DEFAULT 0"))
        if "companies" in _insp(_conn).get_table_names():
            if "inn" not in [c["name"] for c in _insp(_conn).get_columns("companies")]:
                _conn.execute(_text("ALTER TABLE companies ADD COLUMN inn VARCHAR(20)"))
        # материал может лежать в папке доски
        if "items" in _insp(_conn).get_table_names():
            if "folder_id" not in [c["name"] for c in _insp(_conn).get_columns("items")]:
                _conn.execute(_text("ALTER TABLE items ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL"))
                _conn.execute(_text("CREATE INDEX IF NOT EXISTS ix_items_folder_id ON items (folder_id)"))
        _migrate_items_unique(_conn)
        # сайт у компании и контакта
        for _tbl in ("companies", "contacts"):
            if _tbl in _insp(_conn).get_table_names():
                if "website" not in [c["name"] for c in _insp(_conn).get_columns(_tbl)]:
                    _conn.execute(_text(f"ALTER TABLE {_tbl} ADD COLUMN website VARCHAR(500)"))
        # несколько телефонов и почт у контакта и компании
        for _tbl, _cols in (
            ("companies", ("phone VARCHAR(50) DEFAULT ''", "email VARCHAR(200) DEFAULT ''",
                           "extra_phones TEXT DEFAULT '[]'", "extra_emails TEXT DEFAULT '[]'")),
            ("contacts", ("extra_phones TEXT DEFAULT '[]'", "extra_emails TEXT DEFAULT '[]'")),
        ):
            if _tbl in _insp(_conn).get_table_names():
                _have = [c["name"] for c in _insp(_conn).get_columns(_tbl)]
                for _ddl in _cols:
                    if _ddl.split()[0] not in _have:
                        _conn.execute(_text(f"ALTER TABLE {_tbl} ADD COLUMN {_ddl}"))
        # мессенджеры и соцсети: ВКонтакте у контакта, Telegram, MAX и ВКонтакте у компании
        for _tbl, _cols in (
            ("contacts", ("vk VARCHAR(200) DEFAULT ''",)),
            ("companies", ("telegram VARCHAR(200) DEFAULT ''", "max_messenger VARCHAR(200) DEFAULT ''",
                           "vk VARCHAR(200) DEFAULT ''")),
        ):
            if _tbl in _insp(_conn).get_table_names():
                _have = [c["name"] for c in _insp(_conn).get_columns(_tbl)]
                for _ddl in _cols:
                    if _ddl.split()[0] not in _have:
                        _conn.execute(_text(f"ALTER TABLE {_tbl} ADD COLUMN {_ddl}"))
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
