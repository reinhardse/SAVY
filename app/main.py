"""MY LIBRARY — API и сайт. Запуск: uvicorn app.main:app"""
import csv
import io
import json
import os
import re
import secrets
from contextlib import asynccontextmanager
from datetime import date as _date

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from itsdangerous import BadSignature, TimestampSigner
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import gcal, meta
from urllib.parse import urlparse
from .db import BASE_DIR, DATA_DIR, STATUSES, Board, BoardLink, Card, Category, GCalToken, Item, KColumn, SessionLocal, Tag, init_db

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
            "board_id": c.board_id, "tags": _tags(c.tags), "due_date": c.due_date, "due_time": c.due_time, "duration_min": c.duration_min}


def board_out(b: Board) -> dict:
    return {"id": b.id, "name": b.name, "tags": _tags(b.tags), "columns": [
        {"id": col.id, "name": col.name, "cards": [card_out(k) for k in col.cards]} for col in b.columns]}


@app.get("/api/calendar")
def calendar_items(frm: str, to: str, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Все карточки с датой из всех досок за период: для экрана «Календарь»."""
    try:
        a = _date.fromisoformat(frm).isoformat()
        b = _date.fromisoformat(to).isoformat()
    except ValueError:
        raise HTTPException(400, "Неверная дата")
    names = {bd.id: bd.name for bd in db.scalars(select(Board).where(Board.user_id == USER_ID)).all()}
    rows = db.scalars(select(Card).join(Board, Card.board_id == Board.id)
                      .where(Board.user_id == USER_ID, Card.due_date >= a, Card.due_date <= b)
                      .order_by(Card.due_date, Card.due_time)).all()
    return [{"id": c.id, "title": c.title or "", "due_date": c.due_date, "due_time": c.due_time,
             "duration_min": c.duration_min, "board_id": c.board_id, "board_name": names.get(c.board_id, "")}
            for c in rows]


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
    b.columns = [KColumn(name=n, sort=i) for i, n in enumerate(["К выполнению", "В работе", "Готово"])]
    db.add(b)
    db.commit()
    return {"id": b.id, "name": b.name}


@app.get("/api/boards/{bid}")
def board_read(bid: int, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    out = board_out(_board(db, bid))
    out["links"] = [link_out(l) for l in db.scalars(select(BoardLink).where(BoardLink.board_id == bid).order_by(BoardLink.id)).all()]
    return out


# ----- ссылки-«хайлайты» над доской -----
class LinkIn(BaseModel):
    url: str


class LinkPatch(BaseModel):
    url: str | None = None
    comment: str | None = None


def link_out(l: BoardLink) -> dict:
    host = (urlparse(l.url).hostname or l.url).removeprefix("www.")
    return {"id": l.id, "url": l.url, "title": l.title or host, "host": host, "comment": l.comment or ""}


def _fetch_title(url: str) -> str | None:
    try:
        return (meta.fetch_metadata(url, "web") or {}).get("title") or None
    except Exception:
        return None


def _refresh_title(lid: int, url: str) -> None:
    """Название подтягиваем в фоне: сама ссылка уже сохранена и открывается сразу."""
    title = _fetch_title(url)
    if not title:
        return
    with SessionLocal() as s:
        l = s.get(BoardLink, lid)
        if l and l.url == url:
            l.title = title
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
    l = BoardLink(board_id=b.id, url=url, title=None, comment="")
    db.add(l)
    db.commit()
    bg.add_task(_refresh_title, l.id, url)
    return link_out(l)


@app.patch("/api/links/{lid}")
def link_patch(lid: int, body: LinkPatch, bg: BackgroundTasks, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    l = _link(db, lid)
    if body.url is not None and body.url.strip():
        url = _norm(body.url)
        if url != l.url:
            l.url = url
            l.title = None
            bg.add_task(_refresh_title, l.id, url)
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
    return card_out(_card(db, kid))


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
