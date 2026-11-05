"""MY LIBRARY — API и сайт. Запуск: uvicorn app.main:app"""
import csv
import io
import json
import os
import re
import secrets
from contextlib import asynccontextmanager
from datetime import date as _date, datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from itsdangerous import BadSignature, TimestampSigner
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import gcal, meta
from types import SimpleNamespace
from urllib.parse import urlparse
from .db import (BASE_DIR, DATA_DIR, STATUSES, Board, BoardLink, Card, CardSub, Category, Company, Contact, CrmPipeline, CrmStage,
                 CrmTask, CRM_NEW_FUNNEL_STAGES, Deal, DealMessage, GCalToken, Item, KColumn, SessionLocal, Tag, init_db)

PASSWORD = os.environ.get("LIBRARY_PASSWORD")
API_TOKEN = os.environ.get("LIBRARY_API_TOKEN")  # для бота и «Быстрых команд» iOS
USER_ID = 1  # один пользователь; во всех запросах уже есть фильтр по user_id


def _secret() -> str:
    env = os.environ.get("LIBRARY_SECRET")
    if env:
        return env
    f = DATA_DIR / ".secret"
    if not f.exists():
        f.write_text(secrets.token_hex(32))
    return f.read_text().strip()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not PASSWORD:
        raise RuntimeError("Задайте переменную окружения LIBRARY_PASSWORD")
    init_db()
    yield


app = FastAPI(title="MY LIBRARY", lifespan=lifespan)
signer = TimestampSigner(_secret())


def get_db():
    with SessionLocal() as s:
        yield s


def require_auth(request: Request) -> int:
    auth = request.headers.get("authorization", "")
    if API_TOKEN and auth.startswith("Bearer ") and secrets.compare_digest(auth[7:], API_TOKEN):
        return USER_ID
    cookie = request.cookies.get("session")
    if cookie:
        try:
            signer.unsign(cookie, max_age=60 * 60 * 24 * 30)
            return USER_ID
        except BadSignature:
            pass
    raise HTTPException(401, "Нужен вход")


# ---------- вход ----------
class Login(BaseModel):
    password: str


@app.post("/api/login")
def login(body: Login, response: Response):
    if not secrets.compare_digest(body.password, PASSWORD or ""):
        raise HTTPException(401, "Неверный пароль")
    response.set_cookie("session", signer.sign(b"u1").decode(), httponly=True, samesite="lax",
                        max_age=60 * 60 * 24 * 30, secure=os.environ.get("LIBRARY_HTTPS") == "1")
    return {"ok": True}


@app.post("/api/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"ok": True}


# ---------- сериализация ----------
def item_out(i: Item) -> dict:
    return {
        "id": i.id, "url": i.url, "source": i.source, "content_type": i.content_type,
        "title": i.title, "description": i.description, "author": i.author,
        "thumb": f"/thumbs/{os.path.basename(i.thumb_path)}" if i.thumb_path else None,
        "category": i.category.slug if i.category else None,
        "status": i.status, "done": i.status == "done", "is_favorite": bool(i.is_favorite), "note": i.note or "",
        "tags": sorted(t.name for t in i.tags), "meta_state": i.meta_state,
        "created_at": i.created_at.isoformat() + "Z",
    }


def cat_out(c: Category) -> dict:
    return {"slug": c.slug, "name": c.name, "color": c.color}


def get_item(db: Session, item_id: int) -> Item:
    item = db.scalars(select(Item).where(Item.id == item_id, Item.user_id == USER_ID)).first()
    if not item:
        raise HTTPException(404, "Материал не найден")
    return item


def cat_by_slug(db: Session, slug: str | None) -> Category | None:
    if not slug:
        return None
    return db.scalars(select(Category).where(Category.slug == slug)).first()


# ---------- обработка метаданных (в фоне) ----------
def process_item(item_id: int, hint: str | None = None):
    with SessionLocal() as db:
        item = db.get(Item, item_id)
        if not item:
            return
        m = meta.fetch_metadata(item.url, item.source)
        # из сайта берём только заголовок (до 100 символов) и обложку; описание и автора не подтягиваем
        # если сайт названия не отдал, берём название из текста «Поделиться» (если оно было вместе со ссылкой)
        item.title = item.title or (m["title"] or "")[:100] or hint or None
        # описание добавляем сами только для Кинопоиска и Литрес и только если оно пустое: дальше его правит пользователь
        if item.source in ("kinopoisk", "litres") and not item.description and m.get("description"):
            item.description = m["description"][:2000]
        item.meta_state = m["meta_state"]
        item.meta_raw = {"tried": m["tried"]}
        if m["thumbnail_url"]:
            dest = DATA_DIR / "thumbs" / f"{item.id}.jpg"
            if meta.download_thumb(m["thumbnail_url"], dest):
                item.thumb_path = str(dest)
        db.commit()


def save_url(db: Session, url: str, note: str | None, category: str | None, tasks: BackgroundTasks,
             hint: str | None = None) -> tuple[dict, bool]:
    norm = meta.normalize_url(url)
    exists = db.scalars(select(Item).where(Item.user_id == USER_ID, Item.url_norm == norm)).first()
    if exists:
        return item_out(exists), False
    source = meta.detect_source(norm)
    ctype, _ = meta.guess_type_and_category(norm, source)
    # новая ссылка без выбранной категории попадает в «Без категории» (входящие), категорию не угадываем
    cat = cat_by_slug(db, category)
    item = Item(user_id=USER_ID, url=url.strip(), url_norm=norm, source=source, content_type=ctype,
                note=note, category_id=cat.id if cat else None)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return item_out(db.scalars(select(Item).where(Item.user_id == USER_ID, Item.url_norm == norm)).first()), False
    tasks.add_task(process_item, item.id, hint)
    return item_out(item), True


# ---------- материалы ----------
class ItemIn(BaseModel):
    url: str
    note: str | None = None
    category: str | None = None


class ItemPatch(BaseModel):
    status: str | None = None
    category: str | None = None
    note: str | None = None
    title: str | None = None
    description: str | None = None
    is_favorite: bool | None = None
    tags: list[str] | None = None
    done: bool | None = None


@app.post("/api/items")
def add_item(body: ItemIn, tasks: BackgroundTasks, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Добавляет одну ссылку; если в тексте несколько адресов — берёт первый."""
    urls = meta.extract_urls(body.url) or ([body.url] if "." in body.url and " " not in body.url.strip() else [])
    if not urls:
        raise HTTPException(400, "В тексте нет ссылки")
    hint = meta.service_link_hint(urls[0])
    if hint:
        raise HTTPException(400, hint)
    item, created = save_url(db, urls[0], body.note, body.category, tasks, meta.share_title(body.url))
    return {"item": item, "created": created}


@app.get("/api/items")
def list_items(status: str | None = None, category: str | None = None, favorite: bool = False,
               q: str | None = None, tag: str | None = None, inbox: bool = False, limit: int = 100, offset: int = 0,
               db: Session = Depends(get_db), _: int = Depends(require_auth)):
    stmt = select(Item).where(Item.user_id == USER_ID)
    if status:
        stmt = stmt.where(Item.status == status)
    else:  # прочитанные, как и архив, не попадают в обычные списки: их видно только внутри категории
        stmt = stmt.where(Item.status.notin_(["archived", "done"]))
    if inbox:  # входящие: всё, что ещё не отнесено ни к одной категории
        stmt = stmt.where(Item.category_id.is_(None))
    if category:
        c = cat_by_slug(db, category)
        stmt = stmt.where(Item.category_id == (c.id if c else -1))
    if favorite:
        stmt = stmt.where(Item.is_favorite.is_(True))
    if tag:
        stmt = stmt.where(Item.tags.any(Tag.name == tag.strip().lower()))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Item.title.ilike(like), Item.description.ilike(like), Item.note.ilike(like),
                              Item.author.ilike(like), Item.url.ilike(like)))
    stmt = stmt.order_by(Item.created_at.desc(), Item.id.desc()).limit(min(limit, 200)).offset(offset)
    return [item_out(i) for i in db.scalars(stmt).unique()]


@app.get("/api/items/{item_id}")
def read_item(item_id: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    return item_out(get_item(db, item_id))


@app.patch("/api/items/{item_id}")
def patch_item(item_id: int, body: ItemPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    item = get_item(db, item_id)
    fields = body.model_fields_set
    if "status" in fields:
        if body.status not in STATUSES:
            raise HTTPException(400, "Неизвестный статус")
        item.status = body.status
    if "category" in fields:
        c = cat_by_slug(db, body.category)
        item.category_id = c.id if c else None
        item.category = c  # связанный объект тоже, иначе ответ покажет старую категорию
        if c and item.status == "new":
            item.status = "planned"
    if "note" in fields:
        item.note = body.note
    if "title" in fields:
        item.title = (body.title or "").strip()[:100] or None
    if "description" in fields:
        item.description = body.description
    if "done" in fields and body.done is not None:
        if body.done:
            item.status = "done"
        elif item.status == "done":
            item.status = "planned" if item.category_id else "new"
    if "is_favorite" in fields and body.is_favorite is not None:
        item.is_favorite = body.is_favorite
    if "tags" in fields and body.tags is not None:
        tags = []
        for name in {t.strip().lower() for t in body.tags if t.strip()}:
            t = db.scalars(select(Tag).where(Tag.user_id == USER_ID, Tag.name == name)).first()
            if not t:
                t = Tag(user_id=USER_ID, name=name)
                db.add(t)
            tags.append(t)
        item.tags = tags
    db.commit()
    return item_out(item)


@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    item = get_item(db, item_id)
    if item.thumb_path and os.path.exists(item.thumb_path):
        os.remove(item.thumb_path)
    db.delete(item)
    db.commit()
    return {"ok": True}


@app.post("/api/items/{item_id}/refresh")
def refresh_item(item_id: int, tasks: BackgroundTasks, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    item = get_item(db, item_id)
    item.meta_state = "pending"
    db.commit()
    tasks.add_task(process_item, item.id)
    return item_out(item)


# ---------- сводка, категории, экспорт ----------
@app.get("/api/me")
def me(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    base = (Item.user_id == USER_ID, Item.status.notin_(["archived", "done"]))
    total = db.scalar(select(func.count()).select_from(Item).where(*base))
    new = db.scalar(select(func.count()).select_from(Item).where(*base, Item.status == "new"))
    done = db.scalar(select(func.count()).select_from(Item).where(Item.user_id == USER_ID, Item.status == "done"))
    fav = db.scalar(select(func.count()).select_from(Item).where(*base, Item.is_favorite.is_(True)))
    per_cat = dict(db.execute(select(Item.category_id, func.count()).where(*base).group_by(Item.category_id)).all())
    cats = [{**cat_out(c), "count": per_cat.get(c.id, 0)} for c in db.scalars(select(Category).order_by(Category.sort, Category.id))]
    return {"total": total, "new": new, "done": done, "favorites": fav, "categories": cats}


@app.get("/api/categories")
def categories(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    return [cat_out(c) for c in db.scalars(select(Category).order_by(Category.sort, Category.id))]


@app.get("/api/settings")
def get_settings(_: int = Depends(require_auth)):
    return {"kp_token_set": bool(meta.kp_token())}


class TokenIn(BaseModel):
    token: str


@app.post("/api/settings/kp-token")
def set_kp_token(body: TokenIn, tasks: BackgroundTasks, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Сохраняет ключ kinopoisk.dev и сразу обновляет уже сохранённые фильмы Кинопоиска (название, обложка, описание)."""
    token = body.token.strip()
    if token and not re.fullmatch(r"[A-Za-z0-9._-]{8,200}", token):
        raise HTTPException(400, "Ключ выглядит неправильно: он состоит из букв, цифр и дефисов, без пробелов")
    meta.set_kp_token(token)
    refreshed = 0
    if token:
        items = db.scalars(select(Item).where(Item.user_id == USER_ID, Item.url.ilike("%kinopoisk.ru/%"))).unique()
        for it in items:
            if re.search(r"/(?:film|series)/\d+", it.url):
                it.source = "kinopoisk"
                it.meta_state = "pending"
                tasks.add_task(process_item, it.id)
                refreshed += 1
        db.commit()
    return {"ok": True, "refreshed": refreshed}


@app.get("/api/inbox/stats")
def inbox_stats(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Входящие: сколько материалов без категории (непрочитанных) и сколько из них прочитано."""
    counts = dict(db.execute(select(Item.status, func.count()).where(
        Item.user_id == USER_ID, Item.category_id.is_(None)).group_by(Item.status)).all())
    count = sum(v for k, v in counts.items() if k not in ("done", "archived"))
    return {"count": count, "done": counts.get("done", 0)}


@app.get("/api/categories/{slug}/stats")
def category_stats(slug: str, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Сколько материалов в категории (непрочитанных) и сколько прочитано."""
    c = cat_by_slug(db, slug)
    if not c:
        raise HTTPException(404, "Категория не найдена")
    counts = dict(db.execute(select(Item.status, func.count()).where(
        Item.user_id == USER_ID, Item.category_id == c.id).group_by(Item.status)).all())
    count = sum(v for k, v in counts.items() if k not in ("done", "archived"))
    return {"count": count, "done": counts.get("done", 0)}


class CategoryIn(BaseModel):
    name: str
    color: str = "#888888"


@app.post("/api/categories")
def add_category(body: CategoryIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    slug = "c" + secrets.token_hex(3)
    c = Category(user_id=USER_ID, slug=slug, name=body.name.strip()[:80], color=body.color, sort=100)
    db.add(c)
    db.commit()
    return cat_out(c)


@app.get("/api/tags")
def tags_list(category: str | None = None, status: str | None = None, all_status: bool = False, inbox: bool = False,
              db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Теги: все теги библиотеки или только теги материалов раздела (появляются и исчезают сами).
    all_status=1 — теги со всех материалов раздела, включая прочитанные: строка тегов не меняется от глаза."""
    stmt = select(Item).where(Item.user_id == USER_ID)
    if status:
        stmt = stmt.where(Item.status == status)
    elif all_status:
        stmt = stmt.where(Item.status != "archived")
    else:
        stmt = stmt.where(Item.status.notin_(["archived", "done"]))
    if category:
        c = cat_by_slug(db, category)
        if not c:
            return []
        stmt = stmt.where(Item.category_id == c.id)
    if inbox:  # теги входящих: материалов без категории
        stmt = stmt.where(Item.category_id.is_(None))
    counts: dict[str, int] = {}
    for it in db.scalars(stmt).unique():
        for t in it.tags:
            counts[t.name] = counts.get(t.name, 0) + 1
    return [{"name": n, "count": k} for n, k in sorted(counts.items())]


@app.delete("/api/categories/{slug}")
def delete_category(slug: str, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = cat_by_slug(db, slug)
    if not c:
        raise HTTPException(404, "Категория не найдена")
    for it in db.scalars(select(Item).where(Item.user_id == USER_ID, Item.category_id == c.id)).unique():
        it.category_id = None
    db.delete(c)
    db.commit()
    return {"ok": True}


@app.get("/api/export")
def export(format: str = "json", db: Session = Depends(get_db), _: int = Depends(require_auth)):
    items = [item_out(i) for i in db.scalars(select(Item).where(Item.user_id == USER_ID).order_by(Item.id)).unique()]
    if format == "csv":
        buf = io.StringIO()
        cols = ["id", "url", "title", "source", "content_type", "category", "status", "is_favorite", "author",
                "description", "note", "tags", "created_at"]
        w = csv.DictWriter(buf, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for i in items:
            w.writerow({**i, "tags": ",".join(i["tags"])})
        return Response(buf.getvalue(), media_type="text/csv; charset=utf-8",
                        headers={"Content-Disposition": "attachment; filename=my-library.csv"})
    return Response(json.dumps(items, ensure_ascii=False, indent=2), media_type="application/json",
                    headers={"Content-Disposition": "attachment; filename=my-library.json"})


# ---------- канбан: доски, колонки, карточки ----------
class BoardIn(BaseModel):
    name: str


class NameIn(BaseModel):
    name: str


class CardIn(BaseModel):
    title: str = ""


class CardPatch(BaseModel):
    title: str | None = None
    note: str | None = None
    column_id: int | None = None
    tags: list[str] | None = None
    due_date: str | None = None
    due_time: str | None = None
    duration_min: int | None = None
    priority: int | None = None


def _board(db: Session, bid: int) -> Board:
    b = db.scalars(select(Board).where(Board.id == bid, Board.user_id == USER_ID)).first()
    if not b:
        raise HTTPException(404, "Доска не найдена")
    return b


def _column(db: Session, cid: int) -> KColumn:
    c = db.scalars(select(KColumn).join(Board, KColumn.board_id == Board.id)
                   .where(KColumn.id == cid, Board.user_id == USER_ID)).first()
    if not c:
        raise HTTPException(404, "Колонка не найдена")
    return c


def _card(db: Session, kid: int) -> Card:
    c = db.scalars(select(Card).join(Board, Card.board_id == Board.id)
                   .where(Card.id == kid, Board.user_id == USER_ID)).first()
    if not c:
        raise HTTPException(404, "Карточка не найдена")
    return c


def _tags(raw) -> list[str]:
    try:
        v = json.loads(raw or "[]")
    except ValueError:
        return []
    return [t for t in v if isinstance(t, str)] if isinstance(v, list) else []


def _clean_tags(items) -> list[str]:
    out = []
    for t in items:
        t = (t or "").strip()[:40]
        if t and t.lower() not in [o.lower() for o in out]:
            out.append(t)
    return out[:50]


def card_out(c: Card) -> dict:
    return {"id": c.id, "title": c.title or "", "note": c.note or "", "column_id": c.column_id,
            "board_id": c.board_id, "tags": _tags(c.tags), "due_date": c.due_date, "due_time": c.due_time, "duration_min": c.duration_min, "priority": c.priority}


def board_out(b: Board) -> dict:
    return {"id": b.id, "name": b.name, "tags": _tags(b.tags), "columns": [
        {"id": col.id, "name": col.name, "cards": [card_out(k) for k in col.cards]} for col in b.columns]}


def _today_key(today: str | None) -> str:
    """Сегодняшняя дата клиента (чтобы просрочка считалась по его часовому поясу)."""
    if today:
        try:
            return _date.fromisoformat(today).isoformat()
        except ValueError:
            raise HTTPException(400, "Неверная дата")
    # без параметра — «сегодня» по Москве, как и в интерфейсе
    return datetime.now(ZoneInfo("Europe/Moscow")).date().isoformat()


def _is_done_col(name: str | None) -> bool:
    return "готов" in (name or "").lower()


def _board_card_item(c: Card, names: dict, col_name: str | None, t0: str) -> dict:
    return {"id": c.id, "title": c.title or "", "due_date": c.due_date, "due_time": c.due_time,
            "duration_min": c.duration_min, "board_id": c.board_id, "board_name": names.get(c.board_id, ""),
            "overdue": bool(c.due_date and c.due_date < t0 and not _is_done_col(col_name))}


def _crm_task_item(db: Session, t: CrmTask, t0: str) -> dict:
    kind_name, owner_title, href = _crm_task_owner(db, t)
    done = t.status == "done"
    return {"id": t.id, "kind": "crm", "title": t.title, "due_date": t.due_date, "due_time": t.due_time,
            "duration_min": None, "board_id": None, "board_name": "CRM", "owner_title": owner_title,
            "owner_kind": kind_name, "href": href, "done": done,
            "overdue": bool(t.due_date and t.due_date < t0 and not done)}


@app.get("/api/calendar")
def calendar_items(frm: str, to: str, today: str | None = None, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Все карточки с датой из всех досок за период: для экрана «Календарь». overdue — срок прошёл, не готово."""
    try:
        a = _date.fromisoformat(frm).isoformat()
        b = _date.fromisoformat(to).isoformat()
    except ValueError:
        raise HTTPException(400, "Неверная дата")
    t0 = _today_key(today)
    names = {bd.id: bd.name for bd in db.scalars(select(Board).where(Board.user_id == USER_ID)).all()}
    rows = db.execute(select(Card, KColumn.name).join(Board, Card.board_id == Board.id)
                      .outerjoin(KColumn, Card.column_id == KColumn.id)
                      .where(Board.user_id == USER_ID, Card.due_date >= a, Card.due_date <= b)
                      .order_by(Card.due_date, Card.due_time)).all()
    out = [_board_card_item(c, names, col_name, t0) for c, col_name in rows]
    # задачи CRM: метка CRM и название сделки; открываются сделкой
    tasks = db.scalars(select(CrmTask).where(CrmTask.due_date >= a, CrmTask.due_date <= b)
                       .order_by(CrmTask.due_date, CrmTask.due_time)).all()
    out += [_crm_task_item(db, t, t0) for t in tasks]
    return out


@app.get("/api/overdue")
def overdue_items(today: str | None = None, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Просроченное: карточки досок и задачи CRM, у которых срок прошёл и которые не готовы."""
    t0 = _today_key(today)
    names = {bd.id: bd.name for bd in db.scalars(select(Board).where(Board.user_id == USER_ID)).all()}
    rows = db.execute(select(Card, KColumn.name).join(Board, Card.board_id == Board.id)
                      .outerjoin(KColumn, Card.column_id == KColumn.id)
                      .where(Board.user_id == USER_ID, Card.due_date < t0)
                      .order_by(Card.due_date, Card.due_time)).all()
    out = [_board_card_item(c, names, col_name, t0) for c, col_name in rows if not _is_done_col(col_name)]
    tasks = db.scalars(select(CrmTask).where(CrmTask.due_date < t0, CrmTask.status != "done")
                       .order_by(CrmTask.due_date, CrmTask.due_time)).all()
    out += [_crm_task_item(db, t, t0) for t in tasks]
    out.sort(key=lambda x: (x["due_date"] or "", x.get("due_time") or ""))
    return out


@app.get("/api/boards")
def boards_list(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    out = []
    for b in db.scalars(select(Board).where(Board.user_id == USER_ID).order_by(Board.id)).all():
        n = db.scalar(select(func.count()).select_from(Card).where(Card.board_id == b.id))
        out.append({"id": b.id, "name": b.name, "count": n, "status": b.status or "work"})
    return out


@app.post("/api/boards")
def board_create(body: BoardIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    b = Board(user_id=USER_ID, name=(body.name.strip()[:120] or "Доска"))
    b.columns = [KColumn(name=n, sort=i) for i, n in enumerate(["Открыто", "В работе", "Готово"])]
    db.add(b)
    db.commit()
    return {"id": b.id, "name": b.name}


@app.get("/api/boards/{bid}")
def board_read(bid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    out = board_out(_board(db, bid))
    out["links"] = [link_out(l) for l in db.scalars(select(BoardLink).where(BoardLink.board_id == bid).order_by(BoardLink.sort, BoardLink.id)).all()]
    return out


# ----- ссылки-«хайлайты» над доской -----
class LinkIn(BaseModel):
    url: str


class LinkOrder(BaseModel):
    ids: list[int]


class LinkPatch(BaseModel):
    url: str | None = None
    comment: str | None = None
    name: str | None = None


def link_out(l: BoardLink) -> dict:
    host = (urlparse(l.url).hostname or l.url).removeprefix("www.")
    return {"id": l.id, "url": l.url, "host": host, "comment": l.comment or "",
            "name": l.name or "", "title": l.title or "", "label": l.name or l.title or host,
            "thumb": f"/thumbs/{l.thumb}" if l.thumb else None}


def _fetch_title(url: str) -> str | None:
    try:
        return (meta.fetch_metadata(url, "web") or {}).get("title") or None
    except Exception:
        return None


def _refresh_meta(lid: int, url: str) -> None:
    """Название и картинку страницы подтягиваем в фоне: ссылка уже сохранена и открывается сразу."""
    try:
        m = meta.fetch_metadata(url, "web") or {}
    except Exception:
        return
    title = m.get("title") or None
    thumb_name = None
    if m.get("thumbnail_url"):
        dest = DATA_DIR / "thumbs" / f"link{lid}.jpg"
        if meta.download_thumb(m["thumbnail_url"], dest):
            thumb_name = dest.name
    with SessionLocal() as s:
        l = s.get(BoardLink, lid)
        if l and l.url == url:
            l.title = title
            l.thumb = thumb_name
            s.commit()


def _norm(url: str) -> str:
    try:
        return meta.normalize_url(url)[:2000]
    except Exception:
        raise HTTPException(400, "Не похоже на ссылку")


def _link(db: Session, lid: int) -> BoardLink:
    l = db.scalars(select(BoardLink).join(Board, BoardLink.board_id == Board.id)
                   .where(BoardLink.id == lid, Board.user_id == USER_ID)).first()
    if not l:
        raise HTTPException(404, "Ссылка не найдена")
    return l


@app.post("/api/boards/{bid}/links")
def link_create(bid: int, body: LinkIn, bg: BackgroundTasks, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    b = _board(db, bid)
    url = _norm(body.url)
    last = db.scalar(select(func.max(BoardLink.sort)).where(BoardLink.board_id == b.id)) or 0
    l = BoardLink(board_id=b.id, url=url, title=None, comment="", sort=last + 1)
    db.add(l)
    db.commit()
    bg.add_task(_refresh_meta, l.id, url)
    return link_out(l)


@app.post("/api/boards/{bid}/links/order")
def link_order(bid: int, body: LinkOrder, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    _board(db, bid)
    rows = {l.id: l for l in db.scalars(select(BoardLink).where(BoardLink.board_id == bid)).all()}
    for i, lid in enumerate(body.ids):
        if lid in rows:
            rows[lid].sort = i
    db.commit()
    return {"ok": True}


@app.patch("/api/links/{lid}")
def link_patch(lid: int, body: LinkPatch, bg: BackgroundTasks, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    l = _link(db, lid)
    if body.url is not None and body.url.strip():
        url = _norm(body.url)
        if url != l.url:
            l.url = url
            l.title = None
            l.thumb = None
            bg.add_task(_refresh_meta, l.id, url)
    if body.name is not None:
        l.name = body.name.strip()[:300] or None
    if body.comment is not None:
        l.comment = body.comment[:5000]
    db.commit()
    return link_out(l)


@app.delete("/api/links/{lid}")
def link_delete(lid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    db.delete(_link(db, lid))
    db.commit()
    return {"ok": True}


class BoardPatch(BaseModel):
    name: str | None = None
    status: str | None = None
    tags: list[str] | None = None


class TagRenameIn(BaseModel):
    old: str
    new: str


BOARD_STATUSES = ("work", "pause", "archive")


@app.patch("/api/boards/{bid}")
def board_rename(bid: int, body: BoardPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    b = _board(db, bid)
    if body.name is not None and body.name.strip():
        b.name = body.name.strip()[:120]
    if body.status is not None:
        if body.status not in BOARD_STATUSES:
            raise HTTPException(400, "Неизвестный статус")
        b.status = body.status
    if body.tags is not None:
        new = _clean_tags(body.tags)
        gone = {t for t in _tags(b.tags) if t not in new}
        if gone:
            for k in db.scalars(select(Card).where(Card.board_id == b.id)).all():
                k.tags = json.dumps([t for t in _tags(k.tags) if t not in gone], ensure_ascii=False)
        b.tags = json.dumps(new, ensure_ascii=False)
    db.commit()
    return {"id": b.id, "name": b.name, "status": b.status, "tags": _tags(b.tags)}


@app.post("/api/boards/{bid}/tags/rename")
def board_tag_rename(bid: int, body: TagRenameIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Переименовать тег на доске: новое имя получают и все карточки доски, где он был."""
    b = _board(db, bid)
    old, new = body.old.strip(), (body.new or "").strip()[:40]
    tags = _tags(b.tags)
    if old not in tags:
        raise HTTPException(404, "Такого тега нет")
    if not new:
        raise HTTPException(400, "Пустое имя тега")
    if new != old and new.lower() in [t.lower() for t in tags]:
        raise HTTPException(400, "Такой тег уже есть")
    b.tags = json.dumps(_clean_tags([new if t == old else t for t in tags]), ensure_ascii=False)
    for k in db.scalars(select(Card).where(Card.board_id == b.id)).all():
        k.tags = json.dumps(_clean_tags([new if t == old else t for t in _tags(k.tags)]), ensure_ascii=False)
    db.commit()
    return {"tags": _tags(b.tags)}


@app.delete("/api/boards/{bid}")
def board_delete(bid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    db.delete(_board(db, bid))
    db.commit()
    return {"ok": True}


@app.post("/api/boards/{bid}/columns")
def column_create(bid: int, body: NameIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    _board(db, bid)
    nxt = db.scalar(select(func.coalesce(func.max(KColumn.sort), -1)).where(KColumn.board_id == bid)) + 1
    c = KColumn(board_id=bid, name=(body.name.strip()[:80] or "Колонка"), sort=nxt)
    db.add(c)
    db.commit()
    return {"id": c.id, "name": c.name}


@app.patch("/api/columns/{cid}")
def column_rename(cid: int, body: NameIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = _column(db, cid)
    name = body.name.strip()[:80]
    if name:
        c.name = name
    db.commit()
    return {"id": c.id, "name": c.name}


@app.delete("/api/columns/{cid}")
def column_delete(cid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    db.delete(_column(db, cid))
    db.commit()
    return {"ok": True}


@app.post("/api/columns/{cid}/cards")
def card_create(cid: int, body: CardIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = _column(db, cid)
    nxt = db.scalar(select(func.coalesce(func.max(Card.sort), -1)).where(Card.column_id == cid)) + 1
    k = Card(board_id=c.board_id, column_id=cid, title=body.title.strip()[:200], note="", sort=nxt)
    db.add(k)
    db.commit()
    return card_out(k)


@app.get("/api/cards/{kid}")
def card_read(kid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = _card(db, kid)
    # сводка всех подзадач карточки (любой глубины): заметка рисует строки по ним
    subs = db.scalars(select(CardSub).where(CardSub.card_id == c.id)).all()
    roots = db.scalars(select(CardSub).where(CardSub.card_id == c.id, CardSub.parent_id.is_(None))
                       .order_by(CardSub.sort, CardSub.id)).all()
    return {**card_out(c), "subs": {str(s.id): _sub_brief(db, s) for s in subs},
            "root_subs": [_sub_brief(db, s) for s in roots]}


# ---------- подзадачи: вложенные окна, прогресс «выполнено из всего», хлебные крошки ----------
class SubIn(BaseModel):
    title: str = ""
    parent_id: int | None = None


class SubPatch(BaseModel):
    title: str | None = None
    note: str | None = None
    due_date: str | None = None
    done: bool | None = None


def _sub(db: Session, sid: int) -> CardSub:
    s = db.get(CardSub, sid)
    if not s:
        raise HTTPException(404, "Подзадача не найдена")
    _card(db, s.card_id)  # проверка владельца через карточку
    return s


def _sub_brief(db: Session, s: CardSub) -> dict:
    kids = db.scalars(select(CardSub).where(CardSub.parent_id == s.id)).all()
    first = (s.note or "").strip().split("\n")[0][:140]
    return {"id": s.id, "title": s.title or "", "done": bool(s.done), "due_date": s.due_date, "desc": first,
            "total": len(kids), "done_count": sum(1 for k in kids if k.done), "card_id": s.card_id}


def _sub_full(db: Session, s: CardSub) -> dict:
    # крошки: карточка → подзадачи по пути вниз до текущей
    crumbs, cur = [], s
    while cur is not None:
        crumbs.append({"id": cur.id, "title": cur.title or "Без названия", "kind": "sub"})
        cur = db.get(CardSub, cur.parent_id) if cur.parent_id else None
    card = db.get(Card, s.card_id)
    board = db.get(Board, card.board_id)
    crumbs.append({"id": None, "title": card.title or "Без названия", "kind": "card", "card_id": card.id})
    crumbs.append({"id": None, "title": board.name if board else "Доска", "kind": "board", "board_id": card.board_id})
    crumbs.reverse()
    # соседи на том же уровне — для стрелок вверх/вниз
    sibs = db.scalars(select(CardSub.id).where(CardSub.card_id == s.card_id, CardSub.parent_id == s.parent_id)
                      .order_by(CardSub.sort, CardSub.id)).all()
    i = sibs.index(s.id) if s.id in sibs else -1
    kids = db.scalars(select(CardSub).where(CardSub.parent_id == s.id).order_by(CardSub.sort, CardSub.id)).all()
    return {**_sub_brief(db, s), "note": s.note or "", "crumbs": crumbs,
            "prev_id": sibs[i - 1] if i > 0 else None,
            "next_id": sibs[i + 1] if 0 <= i < len(sibs) - 1 else None,
            "children": [_sub_brief(db, k) for k in kids]}


@app.post("/api/cards/{kid}/subs")
def sub_create(kid: int, body: SubIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    _card(db, kid)
    parent = None
    if body.parent_id:
        parent = _sub(db, body.parent_id)
        if parent.card_id != kid:
            raise HTTPException(400, "Подзадача из другой карточки")
    last = db.scalar(select(func.max(CardSub.sort)).where(CardSub.card_id == kid, CardSub.parent_id == (parent.id if parent else None))) or 0
    s = CardSub(card_id=kid, parent_id=parent.id if parent else None, title=body.title.strip()[:300], sort=last + 1)
    db.add(s)
    db.commit()
    return _sub_brief(db, s)


@app.get("/api/subs/{sid}")
def sub_read(sid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    return _sub_full(db, _sub(db, sid))


@app.patch("/api/subs/{sid}")
def sub_patch(sid: int, body: SubPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    s = _sub(db, sid)
    f = body.model_fields_set
    if "title" in f and body.title is not None:
        s.title = body.title.strip()[:300]
    if "note" in f and body.note is not None:
        s.note = body.note[:20000]
    if "due_date" in f:
        s.due_date = (body.due_date or "").strip() or None
    if "done" in f and body.done is not None:
        s.done = body.done
    db.commit()
    return _sub_brief(db, s)


@app.delete("/api/subs/{sid}")
def sub_delete(sid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    s = _sub(db, sid)
    # удаляем подзадачу вместе со всей вложенностью (каскад внешних ключей в SQLite не включён)
    todo, found = [s.id], []
    while todo:
        cur = todo.pop()
        found.append(cur)
        todo += [x for (x,) in db.execute(select(CardSub.id).where(CardSub.parent_id == cur)).all()]
    for x in db.scalars(select(CardSub).where(CardSub.id.in_(found))).all():
        db.delete(x)
    db.commit()
    return {"ok": True}


@app.patch("/api/cards/{kid}")
def card_patch(kid: int, body: CardPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    k = _card(db, kid)
    fields = body.model_fields_set
    if "title" in fields and body.title is not None:
        k.title = body.title[:200]
    if "note" in fields and body.note is not None:
        k.note = body.note
    if "column_id" in fields and body.column_id is not None:
        c = _column(db, body.column_id)
        if c.board_id != k.board_id:
            raise HTTPException(400, "Колонка из другой доски")
        k.column_id = c.id
    if "due_date" in fields:
        if body.due_date is None:
            k.due_date = None
            k.due_time = None
            k.duration_min = None
        else:
            try:
                k.due_date = _date.fromisoformat(body.due_date).isoformat()
            except ValueError:
                raise HTTPException(400, "Неверная дата")
    if "due_time" in fields:
        if body.due_time is None or body.due_time == "":
            k.due_time = None
            k.duration_min = None
        elif re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", body.due_time):
            k.due_time = body.due_time
        else:
            raise HTTPException(400, "Неверное время")
    if "duration_min" in fields:
        if body.duration_min is None or body.duration_min <= 0 or k.due_time is None:
            k.duration_min = None
        elif body.duration_min <= 1440:
            k.duration_min = body.duration_min
        else:
            raise HTTPException(400, "Слишком длинная задача")
    if "priority" in fields:
        k.priority = body.priority if body.priority in (1, 2, 3) else None
    if "tags" in fields and body.tags is not None:
        allowed = set(_tags(_board(db, k.board_id).tags))
        k.tags = json.dumps([t for t in _clean_tags(body.tags) if t in allowed], ensure_ascii=False)
    db.commit()
    if fields & {"title", "due_date", "due_time", "duration_min"}:
        gcal.sync_card(db, k, _board(db, k.board_id).name, USER_ID)
        db.commit()
    return card_out(k)


@app.delete("/api/cards/{kid}")
def card_delete(kid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    k = _card(db, kid)
    if k.gcal_event_id:
        gcal.delete_event(db, k.gcal_event_id, USER_ID)
    db.delete(k)
    db.commit()
    return {"ok": True}


@app.get("/api/gcal/status")
def gcal_status(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    return {"configured": gcal.configured(), "connected": gcal.connected(db, USER_ID)}


@app.get("/api/gcal/connect")
def gcal_connect(_: int = Depends(require_auth)):
    if not gcal.configured():
        raise HTTPException(400, "Google Календарь ещё не настроен на сервере")
    return {"url": gcal.auth_url(signer.sign(b"gcal").decode())}


@app.get("/api/gcal/callback")
def gcal_callback(code: str = "", state: str = "", db: Session = Depends(get_db), _: int = Depends(require_auth)):
    try:
        if signer.unsign(state, max_age=900) != b"gcal":
            raise BadSignature("state")
    except BadSignature:
        raise HTTPException(400, "Вход устарел, нажмите «Подключить» ещё раз")
    try:
        rt = gcal.exchange_code(code)
    except Exception as e:
        raise HTTPException(400, str(e))
    row = db.scalars(select(GCalToken).where(GCalToken.user_id == USER_ID)).first() or GCalToken(user_id=USER_ID)
    row.refresh_token = rt
    db.add(row)
    db.commit()
    return RedirectResponse("/#/hub")


@app.post("/api/gcal/disconnect")
def gcal_disconnect(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    for row in db.scalars(select(GCalToken).where(GCalToken.user_id == USER_ID)).all():
        db.delete(row)
    db.commit()
    return {"ok": True}


class ColOrder(BaseModel):
    id: int
    cards: list[int]


class BoardOrder(BaseModel):
    columns: list[ColOrder]


@app.post("/api/boards/{bid}/order")
def board_order(bid: int, body: BoardOrder, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Сохраняет порядок карточек на доске: в какой колонке и в каком порядке каждая карточка."""
    b = _board(db, bid)
    cols = {c.id: c for c in b.columns}
    for co in body.columns:
        col = cols.get(co.id)
        if not col:
            raise HTTPException(400, "Колонка не из этой доски")
        for idx, kid in enumerate(co.cards):
            k = db.get(Card, kid)
            if not k or k.board_id != bid:
                raise HTTPException(400, "Карточка не из этой доски")
            k.column_id = col.id
            k.sort = idx
    db.commit()
    return {"ok": True}


class IdsIn(BaseModel):
    ids: list[int]


@app.post("/api/boards/{bid}/columns/order")
def columns_order(bid: int, body: IdsIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Порядок колонок на доске: ids — все колонки доски в нужном порядке."""
    b = _board(db, bid)
    cols = {c.id: c for c in b.columns}
    if set(body.ids) != set(cols.keys()):
        raise HTTPException(400, "Список колонок не совпадает с доской")
    for idx, cid in enumerate(body.ids):
        cols[cid].sort = idx
    db.commit()
    return {"ok": True}


# ---------- сайт ----------
app.mount("/thumbs", StaticFiles(directory=DATA_DIR / "thumbs"), name="thumbs")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/")
def index():
    return FileResponse(BASE_DIR / "static" / "index.html")



# ---------- CRM: воронки, этапы, сделки, контакты и компании ----------
CRM_KINDS = ("work", "won", "lost")  # в работе, успешно, потеряно
CRM_FORMATS = ("white", "black")


class CrmFunnelIn(BaseModel):
    title: str = ""


class CrmStageIn(BaseModel):
    name: str = "Новый этап"
    kind: str = "work"


class CrmStagePatch(BaseModel):
    name: str | None = None
    kind: str | None = None


class CrmIdsIn(BaseModel):
    ids: list[int]


class CrmDealIn(BaseModel):
    title: str = ""
    stage_id: int


class CrmDealPatch(BaseModel):
    title: str | None = None
    amount: int | None = None
    stage_id: int | None = None
    format: str | None = None
    documents_url: str | None = None


class CrmIdIn(BaseModel):
    id: int


class CrmMessageIn(BaseModel):
    text: str


class CrmContactIn(BaseModel):
    first_name: str = ""
    last_name: str = ""
    middle_name: str = ""
    phone: str = ""
    email: str = ""
    telegram: str = ""
    position: str = ""
    city: str = ""
    website: str = ""


class CrmContactPatch(CrmContactIn):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    phone: str | None = None
    email: str | None = None
    telegram: str | None = None
    position: str | None = None
    city: str | None = None
    website: str | None = None
    company_ids: list[int] | None = None


class CrmCompanyIn(BaseModel):
    name: str = ""
    card_url: str | None = None
    inn: str | None = None
    website: str | None = None


class CrmCompanyPatch(BaseModel):
    name: str | None = None
    card_url: str | None = None
    inn: str | None = None
    website: str | None = None


def _crm_name(c: Contact) -> str:
    return " ".join(x for x in [c.first_name, c.last_name] if x) or "Без имени"


def _crm_company_brief(c: Company) -> dict:
    return {"id": c.id, "name": c.name or "Без названия", "inn": c.inn or ""}


def _crm_contact_brief(c: Contact) -> dict:
    return {"id": c.id, "name": _crm_name(c), "companies": [_crm_company_brief(x) for x in c.companies]}


def _crm_deal_brief(d: Deal) -> dict:
    return {"id": d.id, "title": d.title or "Без названия", "amount": d.amount or 0, "stage": d.stage_id,
            "stage_name": d.cstage.name if d.cstage else "", "stage_kind": d.cstage.kind if d.cstage else "work",
            "pipeline_id": d.pipeline_id,
            "created_at": d.created_at.date().isoformat() if d.created_at else None,
            "contacts": [_crm_contact_brief(c) for c in d.contacts],
            "companies": [_crm_company_brief(c) for c in d.companies],
            "open_tasks": sum(1 for t in d.tasks if t.status == "open")}


def _crm_owner_of(row) -> str:
    """Кому принадлежит сообщение или задача: сделке, контакту или компании."""
    return "deal" if row.deal_id else "contact" if row.contact_id else "company"


def _crm_task_out(t: CrmTask) -> dict:
    return {"id": t.id, "kind": "task", "title": t.title, "due_date": t.due_date, "due_time": t.due_time,
            "status": t.status, "result": t.result or "",
            "done_at": t.done_at.isoformat() if t.done_at else None,
            "created_at": t.created_at.isoformat(), "owner": _crm_owner_of(t)}


def _crm_msg_out(m: DealMessage) -> dict:
    return {"id": m.id, "kind": "message", "text": m.text, "created_at": m.created_at.isoformat(),
            "owner": _crm_owner_of(m)}


def _crm_stage_out(s: CrmStage, deals: list[Deal]) -> dict:
    return {"id": s.id, "name": s.name, "kind": s.kind, "sum": sum(d.amount or 0 for d in deals),
            "deals": [_crm_deal_brief(d) for d in deals]}


def _crm_deal_full(d: Deal, db: Session | None = None) -> dict:
    items = _crm_feed(db, "deals", d) if db is not None else []
    stages = [{"id": s.id, "name": s.name, "kind": s.kind} for s in d.pipeline.stages] if d.pipeline else []
    return {**_crm_deal_brief(d), "format": d.format, "documents_url": d.documents_url, "items": items,
            "stages": stages}


CRM_OWNER_COL = {"deals": "deal_id", "contacts": "contact_id", "companies": "company_id"}


def _crm_task_owner(db: Session, t: CrmTask) -> tuple[str, str, str]:
    """Кто владелец задачи: (вид, название, ссылка в приложении)."""
    if t.deal_id:
        d = db.get(Deal, t.deal_id)
        return "сделка", (d.title if d and d.title else "Без названия") if d else "Без названия", f"#/crm/deal/{t.deal_id}"
    if t.contact_id:
        c = db.get(Contact, t.contact_id)
        return "контакт", _crm_name(c) if c else "Без имени", f"#/crm/contact/{t.contact_id}"
    k = db.get(Company, t.company_id) if t.company_id else None
    return "компания", (k.name if k else "Без названия"), f"#/crm/company/{t.company_id}"


def _crm_sync_task(db: Session, t: CrmTask) -> None:
    """Задача уходит в Google Календарь; у выполненной в названии стоит галочка."""
    ns = SimpleNamespace(id=t.id, title=("✓ " if t.status == "done" else "") + (t.title or "Задача"),
                         due_date=t.due_date, due_time=t.due_time, duration_min=None,
                         gcal_event_id=t.gcal_event_id)
    _, owner_title, _ = _crm_task_owner(db, t)
    gcal.sync_card(db, ns, f"CRM · {owner_title}", USER_ID)
    t.gcal_event_id = ns.gcal_event_id
    db.commit()


def _crm_feed(db: Session, kind: str, obj) -> list[dict]:
    """Лента владельца: сообщения и задачи в хронологическом порядке.
    У сделки в ленту попадают и сообщения с задачами её контактов и компаний (с пометкой, чья запись)."""
    sources = [(kind, obj)]
    if kind == "deals":
        sources += [("contacts", c) for c in obj.contacts] + [("companies", k) for k in obj.companies]
    items = []
    for skind, sobj in sources:
        if skind == "deals":
            msgs, tasks = sobj.messages, sobj.tasks
        else:
            col = CRM_OWNER_COL[skind]
            msgs = db.scalars(select(DealMessage).where(getattr(DealMessage, col) == sobj.id)).all()
            tasks = db.scalars(select(CrmTask).where(getattr(CrmTask, col) == sobj.id)).all()
        frm = None if skind == kind else (_crm_name(sobj) if skind == "contacts" else (sobj.name or "Без названия"))
        items += [{**_crm_msg_out(m), "from": frm} for m in msgs]
        items += [{**_crm_task_out(t), "from": frm} for t in tasks]
    items.sort(key=lambda x: x["created_at"])
    return items


def _crm_contact_full(db: Session, c: Contact) -> dict:
    return {"id": c.id, "name": _crm_name(c), "first_name": c.first_name, "last_name": c.last_name,
            "middle_name": c.middle_name, "phone": c.phone, "email": c.email, "telegram": c.telegram,
            "position": c.position, "city": c.city, "website": c.website or "",
            "companies": [_crm_company_brief(x) for x in c.companies],
            "deals": _crm_group_deals(c.deals),
            "items": _crm_feed(db, "contacts", c)}


def _crm_company_full(db: Session, c: Company) -> dict:
    return {"id": c.id, "name": c.name or "Без названия", "card_url": c.card_url, "inn": c.inn or "", "website": c.website or "",
            "contacts": [_crm_contact_brief(x) for x in c.contacts],
            "deals": _crm_group_deals(c.deals),
            "items": _crm_feed(db, "companies", c)}


def _crm_group_deals(deals) -> dict:
    g = {"won": [], "lost": [], "active": []}
    for d in sorted(deals, key=lambda x: x.id, reverse=True):
        kind = d.cstage.kind if d.cstage else "work"
        key = "won" if kind == "won" else "lost" if kind == "lost" else "active"
        g[key].append(_crm_deal_brief(d))
    g["sums"] = {k: sum(x["amount"] for x in g[k]) for k in ("won", "lost", "active")}
    return g


def _crm_contact_fields(c: Contact, body) -> None:
    for f in ("first_name", "last_name", "middle_name", "phone", "email", "telegram", "position", "city", "website"):
        v = getattr(body, f, None)
        if v is not None:
            setattr(c, f, v.strip()[:200])


def _crm_funnel_or_404(db: Session, fid: int) -> CrmPipeline:
    f = db.get(CrmPipeline, fid)
    if not f:
        raise HTTPException(404, "Воронка не найдена")
    return f


def _crm_stage_or_404(db: Session, sid: int) -> CrmStage:
    st = db.get(CrmStage, sid)
    if not st:
        raise HTTPException(404, "Этап не найден")
    return st


def _crm_check_kind(kind: str) -> str:
    if kind not in CRM_KINDS:
        raise HTTPException(400, "Неизвестный вид этапа")
    return kind


def _crm_renumber(rows: list) -> None:
    for i, row in enumerate(rows):
        row.sort = i + 1


@app.get("/api/crm/funnels")
def crm_funnels(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    rows = db.scalars(select(CrmPipeline).order_by(CrmPipeline.sort, CrmPipeline.id)).all()
    return {"funnels": [{"id": f.id, "title": f.title or "Без названия"} for f in rows]}


@app.post("/api/crm/funnels")
def crm_funnel_create(body: CrmFunnelIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    last = db.scalar(select(func.max(CrmPipeline.sort))) or 0
    f = CrmPipeline(title=body.title.strip()[:200], sort=last + 1)
    db.add(f)
    db.flush()
    for i, (name, kind) in enumerate(CRM_NEW_FUNNEL_STAGES):
        db.add(CrmStage(pipeline_id=f.id, name=name, kind=kind, sort=i + 1))
    db.commit()
    return {"id": f.id, "title": f.title or "Без названия"}


@app.patch("/api/crm/funnels/{fid}")
def crm_funnel_patch(fid: int, body: CrmFunnelIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    f = _crm_funnel_or_404(db, fid)
    title = body.title.strip()[:200]
    if not title:
        raise HTTPException(400, "Напишите название воронки")
    f.title = title
    db.commit()
    return {"id": f.id, "title": f.title}


@app.delete("/api/crm/funnels/{fid}")
def crm_funnel_delete(fid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    f = _crm_funnel_or_404(db, fid)
    if db.scalar(select(func.count(Deal.id)).where(Deal.pipeline_id == f.id)):
        raise HTTPException(400, "В воронке есть сделки. Сначала перенесите их в другую воронку или удалите")
    db.delete(f)
    db.commit()
    return {"ok": True}


@app.get("/api/crm/funnels/{fid}/board")
def crm_funnel_board(fid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    f = _crm_funnel_or_404(db, fid)
    deals = db.scalars(select(Deal).where(Deal.pipeline_id == f.id).order_by(Deal.sort, Deal.id.desc())).all()
    by_stage: dict[int, list[Deal]] = {}
    for d in deals:
        by_stage.setdefault(d.stage_id, []).append(d)
    return {"id": f.id, "title": f.title or "Без названия",
            "stages": [_crm_stage_out(s, by_stage.get(s.id, [])) for s in f.stages]}


@app.post("/api/crm/funnels/{fid}/stages")
def crm_stage_create(fid: int, body: CrmStageIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    f = _crm_funnel_or_404(db, fid)
    last = db.scalar(select(func.max(CrmStage.sort)).where(CrmStage.pipeline_id == f.id)) or 0
    st = CrmStage(pipeline_id=f.id, name=(body.name.strip() or "Новый этап")[:200],
                  kind=_crm_check_kind(body.kind), sort=last + 1)
    db.add(st)
    db.commit()
    return _crm_stage_out(st, [])


@app.patch("/api/crm/stages/{sid}")
def crm_stage_patch(sid: int, body: CrmStagePatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    st = _crm_stage_or_404(db, sid)
    if body.name is not None:
        name = body.name.strip()[:200]
        if not name:
            raise HTTPException(400, "Напишите название этапа")
        st.name = name
    if body.kind is not None:
        st.kind = _crm_check_kind(body.kind)
    db.commit()
    return {"id": st.id, "name": st.name, "kind": st.kind}


@app.post("/api/crm/funnels/{fid}/stage-order")
def crm_stage_order(fid: int, body: CrmIdsIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Порядок этапов: как переставлены колонки на экране."""
    f = _crm_funnel_or_404(db, fid)
    by_id = {s.id: s for s in f.stages}
    if sorted(body.ids) != sorted(by_id):
        raise HTTPException(400, "Этапы не совпадают с воронкой")
    _crm_renumber([by_id[i] for i in body.ids])
    db.commit()
    return {"ok": True}


@app.delete("/api/crm/stages/{sid}")
def crm_stage_delete(sid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Этап удаляется, его сделки переходят в соседний этап слева (а у первого — справа)."""
    st = _crm_stage_or_404(db, sid)
    rest = [s for s in st.pipeline.stages if s.id != st.id]
    if not rest:
        raise HTTPException(400, "В воронке должен остаться хотя бы один этап")
    left = [s for s in rest if s.sort <= st.sort]
    target = left[-1] if left else rest[0]
    for d in db.scalars(select(Deal).where(Deal.stage_id == st.id)).all():
        d.stage_id = target.id
    db.delete(st)
    db.commit()
    return {"ok": True, "moved_to": target.id}


class CrmColumn(BaseModel):
    stage_id: int
    ids: list[int]


class CrmOrder(BaseModel):
    columns: list[CrmColumn]


@app.post("/api/crm/pipeline/order")
def crm_pipeline_order(body: CrmOrder, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Перенос карточек: этап и порядок внутри этапа, как на досках."""
    for col in body.columns:
        st = _crm_stage_or_404(db, col.stage_id)
        for i, did in enumerate(col.ids):
            d = db.get(Deal, did)
            if d:
                d.stage_id = st.id
                d.pipeline_id = st.pipeline_id
                d.sort = i + 1
    db.commit()
    return {"ok": True}


@app.post("/api/crm/deals")
def crm_deal_create(body: CrmDealIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    st = _crm_stage_or_404(db, body.stage_id)
    d = Deal(title=body.title.strip()[:200], stage_id=st.id, pipeline_id=st.pipeline_id)
    db.add(d)
    db.commit()
    return _crm_deal_brief(d)


@app.get("/api/crm/deals/{did}")
def crm_deal_get(did: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    d = db.get(Deal, did)
    if not d:
        raise HTTPException(404, "Сделка не найдена")
    return _crm_deal_full(d, db)


@app.patch("/api/crm/deals/{did}")
def crm_deal_patch(did: int, body: CrmDealPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    d = db.get(Deal, did)
    if not d:
        raise HTTPException(404, "Сделка не найдена")
    f = body.model_fields_set
    if "title" in f and body.title is not None:
        d.title = body.title.strip()[:200]
    if "amount" in f:
        if body.amount is not None and body.amount < 0:
            raise HTTPException(400, "Бюджет не может быть отрицательным")
        d.amount = body.amount
    if "stage_id" in f and body.stage_id is not None:
        st = _crm_stage_or_404(db, body.stage_id)
        d.stage_id = st.id
        d.pipeline_id = st.pipeline_id
    if "format" in f:
        d.format = body.format if body.format in CRM_FORMATS else None
    if "documents_url" in f:
        d.documents_url = (body.documents_url or "").strip()[:500] or None
    db.commit()
    return _crm_deal_full(d, db)


@app.delete("/api/crm/deals/{did}")
def crm_deal_delete(did: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    d = db.get(Deal, did)
    if d:
        for t in d.tasks:
            if t.gcal_event_id:
                gcal.delete_event(db, t.gcal_event_id, USER_ID)
        db.delete(d)
        db.commit()
    return {"ok": True}


class CrmTaskIn(BaseModel):
    title: str
    due_date: str
    due_time: str | None = None


class CrmTaskDone(BaseModel):
    result: str


@app.post("/api/crm/{kind}/{oid}/tasks")
def crm_task_create(kind: str, oid: int, body: CrmTaskIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    obj = _crm_owner(db, kind, oid)
    title = body.title.strip()[:300]
    if not title:
        raise HTTPException(400, "Напишите, что нужно сделать")
    try:
        due = _date.fromisoformat(body.due_date).isoformat()
    except ValueError:
        raise HTTPException(400, "Неверная дата")
    tm = (body.due_time or "").strip() or None
    if tm and not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", tm):
        raise HTTPException(400, "Неверное время")
    t = CrmTask(**{CRM_OWNER_COL[kind]: obj.id}, title=title, due_date=due, due_time=tm)
    db.add(t)
    db.commit()
    _crm_sync_task(db, t)
    return _crm_task_out(t)


class CrmTaskPatch(BaseModel):
    title: str | None = None
    due_date: str | None = None
    due_time: str | None = None
    result: str | None = None


@app.patch("/api/crm/tasks/{tid}")
def crm_task_patch(tid: int, body: CrmTaskPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    t = db.get(CrmTask, tid)
    if not t:
        raise HTTPException(404, "Задача не найдена")
    f = body.model_fields_set
    if "title" in f and body.title is not None:
        title = body.title.strip()[:300]
        if not title:
            raise HTTPException(400, "Напишите, что нужно сделать")
        t.title = title
    if "due_date" in f and body.due_date is not None:
        try:
            t.due_date = _date.fromisoformat(body.due_date).isoformat()
        except ValueError:
            raise HTTPException(400, "Неверная дата")
    if "due_time" in f:
        tm = (body.due_time or "").strip() or None
        if tm and not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", tm):
            raise HTTPException(400, "Неверное время")
        t.due_time = tm
    if "result" in f and body.result is not None:
        if t.status != "done":
            raise HTTPException(400, "Итог есть только у выполненной задачи")
        result = body.result.strip()
        if not result:
            raise HTTPException(400, "Напишите итог задачи")
        t.result = result[:5000]
    db.commit()
    _crm_sync_task(db, t)
    return _crm_task_out(t)


@app.delete("/api/crm/tasks/{tid}")
def crm_task_delete(tid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    t = db.get(CrmTask, tid)
    if t:
        if t.gcal_event_id:
            gcal.delete_event(db, t.gcal_event_id, USER_ID)
        db.delete(t)
        db.commit()
    return {"ok": True}


@app.get("/api/crm/tasks")
def crm_tasks_all(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Все задачи CRM для раздела «Задачи»: кто, какая компания, какая сделка, когда и что сделать."""
    out = []
    for t in db.scalars(select(CrmTask).order_by(CrmTask.due_date, CrmTask.due_time, CrmTask.id)).all():
        kind, owner_title, href = _crm_task_owner(db, t)
        names, comps, deal_title = [], [], None
        if t.deal_id and db.get(Deal, t.deal_id):
            d = db.get(Deal, t.deal_id)
            deal_title = d.title or "Без названия"
            names = [_crm_name(c) for c in d.contacts]
            comps = [k.name for k in d.companies]
        elif t.contact_id and db.get(Contact, t.contact_id):
            c = db.get(Contact, t.contact_id)
            names = [_crm_name(c)]
            comps = [k.name for k in c.companies]
        elif t.company_id and db.get(Company, t.company_id):
            comps = [db.get(Company, t.company_id).name]
        out.append({**_crm_task_out(t), "owner_kind": kind, "owner_title": owner_title, "href": href,
                    "deal_title": deal_title, "names": names, "companies": comps})
    return out


@app.post("/api/crm/tasks/{tid}/complete")
def crm_task_complete(tid: int, body: CrmTaskDone, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    t = db.get(CrmTask, tid)
    if not t:
        raise HTTPException(404, "Задача не найдена")
    result = body.result.strip()
    if not result:
        raise HTTPException(400, "Напишите итог задачи")
    t.status = "done"
    t.result = result[:5000]
    t.done_at = datetime.now(timezone.utc)
    db.commit()
    _crm_sync_task(db, t)
    return _crm_task_out(t)


@app.post("/api/crm/deals/{did}/contacts")
def crm_deal_add_contact(did: int, body: CrmIdIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    d, c = db.get(Deal, did), db.get(Contact, body.id)
    if not d or not c:
        raise HTTPException(404, "Не найдено")
    if c not in d.contacts:
        d.contacts.append(c)
    # компании контакта подтягиваются к сделке автоматически
    for comp in c.companies:
        if comp not in d.companies:
            d.companies.append(comp)
    db.commit()
    return _crm_deal_full(d, db)


@app.delete("/api/crm/deals/{did}/contacts/{cid}")
def crm_deal_remove_contact(did: int, cid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    d, c = db.get(Deal, did), db.get(Contact, cid)
    if d and c and c in d.contacts:
        d.contacts.remove(c)
        db.commit()
    return _crm_deal_full(d, db) if d else {"ok": True}


@app.post("/api/crm/deals/{did}/companies")
def crm_deal_add_company(did: int, body: CrmIdIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    d, c = db.get(Deal, did), db.get(Company, body.id)
    if not d or not c:
        raise HTTPException(404, "Не найдено")
    if c not in d.companies:
        d.companies.append(c)
    # и наоборот: контакты компании подтягиваются к сделке
    for person in c.contacts:
        if person not in d.contacts:
            d.contacts.append(person)
    db.commit()
    return _crm_deal_full(d, db)


@app.delete("/api/crm/deals/{did}/companies/{cid}")
def crm_deal_remove_company(did: int, cid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    d, c = db.get(Deal, did), db.get(Company, cid)
    if d and c and c in d.companies:
        d.companies.remove(c)
        db.commit()
    return _crm_deal_full(d, db) if d else {"ok": True}


def _crm_owner(db: Session, kind: str, oid: int):
    model = {"deals": Deal, "contacts": Contact, "companies": Company}.get(kind)
    if model is None:
        raise HTTPException(404, "Неизвестный раздел")
    obj = db.get(model, oid)
    if not obj:
        raise HTTPException(404, "Не найдено")
    return obj


@app.post("/api/crm/{kind}/{oid}/messages")
def crm_message_add(kind: str, oid: int, body: CrmMessageIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    obj = _crm_owner(db, kind, oid)
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Пустое сообщение")
    m = DealMessage(**{CRM_OWNER_COL[kind]: obj.id}, text=text[:5000])
    db.add(m)
    db.commit()
    return _crm_msg_out(m)


@app.get("/api/crm/contacts")
def crm_contacts(q: str = "", db: Session = Depends(get_db), _: int = Depends(require_auth)):
    rows = db.scalars(select(Contact)).all()
    q = q.strip().lower()
    out = []
    for c in rows:
        hay = " ".join([c.first_name, c.last_name, c.middle_name, c.phone, c.email, c.position, c.city]
                       + [x.name for x in c.companies]).lower()
        if not q or q in hay:
            out.append(_crm_contact_brief(c) | {"phone": c.phone, "email": c.email, "position": c.position})
    out.sort(key=lambda x: x["name"].lower())
    return out


@app.post("/api/crm/contacts")
def crm_contact_create(body: CrmContactIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = Contact()
    _crm_contact_fields(c, body)
    db.add(c)
    db.commit()
    return _crm_contact_full(db, c)


@app.get("/api/crm/contacts/{cid}")
def crm_contact_get(cid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = db.get(Contact, cid)
    if not c:
        raise HTTPException(404, "Контакт не найден")
    return _crm_contact_full(db, c)


@app.patch("/api/crm/contacts/{cid}")
def crm_contact_patch(cid: int, body: CrmContactPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = db.get(Contact, cid)
    if not c:
        raise HTTPException(404, "Контакт не найден")
    _crm_contact_fields(c, body)
    if body.company_ids is not None:
        c.companies = [x for x in (db.get(Company, i) for i in set(body.company_ids)) if x]
    db.commit()
    return _crm_contact_full(db, c)


def _crm_purge_owner(db: Session, col: str, oid: int) -> None:
    """Удаляет сообщения и задачи контакта или компании вместе с их событиями в календаре (SQLite не делает это сам)."""
    for t in db.scalars(select(CrmTask).where(getattr(CrmTask, col) == oid)).all():
        if t.gcal_event_id:
            gcal.delete_event(db, t.gcal_event_id, USER_ID)
        db.delete(t)
    for m in db.scalars(select(DealMessage).where(getattr(DealMessage, col) == oid)).all():
        db.delete(m)


@app.delete("/api/crm/contacts/{cid}")
def crm_contact_delete(cid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = db.get(Contact, cid)
    if c:
        _crm_purge_owner(db, "contact_id", c.id)
        db.delete(c)
        db.commit()
    return {"ok": True}


@app.get("/api/crm/companies")
def crm_companies(q: str = "", db: Session = Depends(get_db), _: int = Depends(require_auth)):
    q = q.strip().lower()
    out = [_crm_company_brief(c) | {"card_url": c.card_url} for c in db.scalars(select(Company)).all()
           if not q or q in c.name.lower()]
    out.sort(key=lambda x: x["name"].lower())
    return out


@app.post("/api/crm/companies")
def crm_company_create(body: CrmCompanyIn, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = Company(name=body.name.strip()[:200], card_url=(body.card_url or "").strip()[:500] or None,
                inn=(body.inn or "").strip()[:20] or None,
                website=(body.website or "").strip()[:500] or None)
    db.add(c)
    db.commit()
    return _crm_company_full(db, c)


@app.get("/api/crm/companies/{kid}")
def crm_company_get(kid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = db.get(Company, kid)
    if not c:
        raise HTTPException(404, "Компания не найдена")
    return _crm_company_full(db, c)


@app.patch("/api/crm/companies/{kid}")
def crm_company_patch(kid: int, body: CrmCompanyPatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = db.get(Company, kid)
    if not c:
        raise HTTPException(404, "Компания не найдена")
    f = body.model_fields_set
    if "name" in f and body.name is not None:
        c.name = body.name.strip()[:200]
    if "card_url" in f:
        c.card_url = (body.card_url or "").strip()[:500] or None
    if "inn" in f:
        c.inn = (body.inn or "").strip()[:20] or None
    if "website" in f:
        c.website = (body.website or "").strip()[:500] or None
    db.commit()
    return _crm_company_full(db, c)


@app.delete("/api/crm/companies/{kid}")
def crm_company_delete(kid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    c = db.get(Company, kid)
    if c:
        _crm_purge_owner(db, "company_id", c.id)
        db.delete(c)
        db.commit()
    return {"ok": True}


class CrmMessagePatch(BaseModel):
    text: str


@app.patch("/api/crm/messages/{mid}")
def crm_message_patch(mid: int, body: CrmMessagePatch, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    m = db.get(DealMessage, mid)
    if not m:
        raise HTTPException(404, "Сообщение не найдено")
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "Пустое сообщение")
    m.text = text[:5000]
    db.commit()
    return _crm_msg_out(m)


@app.delete("/api/crm/messages/{mid}")
def crm_message_delete(mid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    m = db.get(DealMessage, mid)
    if m:
        db.delete(m)
        db.commit()
    return {"ok": True}
