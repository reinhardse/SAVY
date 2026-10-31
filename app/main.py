"""MY LIBRARY — API и сайт. Запуск: uvicorn app.main:app"""
import csv
import io
import json
import os
import secrets
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from itsdangerous import BadSignature, TimestampSigner
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import meta
from .db import BASE_DIR, DATA_DIR, STATUSES, Category, Item, SessionLocal, Tag, init_db

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
        "status": i.status, "is_favorite": bool(i.is_favorite), "note": i.note or "",
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
def process_item(item_id: int):
    with SessionLocal() as db:
        item = db.get(Item, item_id)
        if not item:
            return
        m = meta.fetch_metadata(item.url, item.source)
        # из сайта берём только заголовок (до 100 символов) и обложку; описание и автора не подтягиваем
        item.title = item.title or (m["title"] or "")[:100] or None
        item.meta_state = m["meta_state"]
        item.meta_raw = {"tried": m["tried"]}
        if m["thumbnail_url"]:
            dest = DATA_DIR / "thumbs" / f"{item.id}.jpg"
            if meta.download_thumb(m["thumbnail_url"], dest):
                item.thumb_path = str(dest)
        db.commit()


def save_url(db: Session, url: str, note: str | None, category: str | None, tasks: BackgroundTasks) -> tuple[dict, bool]:
    norm = meta.normalize_url(url)
    exists = db.scalars(select(Item).where(Item.user_id == USER_ID, Item.url_norm == norm)).first()
    if exists:
        return item_out(exists), False
    source = meta.detect_source(norm)
    ctype, auto_cat = meta.guess_type_and_category(norm, source)
    cat = cat_by_slug(db, category or auto_cat)
    item = Item(user_id=USER_ID, url=url.strip(), url_norm=norm, source=source, content_type=ctype,
                note=note, category_id=cat.id if cat else None)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return item_out(db.scalars(select(Item).where(Item.user_id == USER_ID, Item.url_norm == norm)).first()), False
    tasks.add_task(process_item, item.id)
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


@app.post("/api/items")
def add_item(body: ItemIn, tasks: BackgroundTasks, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Добавляет одну ссылку; если в тексте несколько адресов — берёт первый."""
    urls = meta.extract_urls(body.url) or ([body.url] if "." in body.url and " " not in body.url.strip() else [])
    if not urls:
        raise HTTPException(400, "В тексте нет ссылки")
    item, created = save_url(db, urls[0], body.note, body.category, tasks)
    return {"item": item, "created": created}


@app.get("/api/items")
def list_items(status: str | None = None, category: str | None = None, favorite: bool = False,
               q: str | None = None, tag: str | None = None, limit: int = 100, offset: int = 0,
               db: Session = Depends(get_db), _: int = Depends(require_auth)):
    stmt = select(Item).where(Item.user_id == USER_ID)
    if status:
        stmt = stmt.where(Item.status == status)
    else:
        stmt = stmt.where(Item.status != "archived")
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
        if c and item.status == "new":
            item.status = "planned"
    if "note" in fields:
        item.note = body.note
    if "title" in fields:
        item.title = (body.title or "").strip()[:100] or None
    if "description" in fields:
        item.description = body.description
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
    base = (Item.user_id == USER_ID, Item.status != "archived")
    total = db.scalar(select(func.count()).select_from(Item).where(*base))
    new = db.scalar(select(func.count()).select_from(Item).where(*base, Item.status == "new"))
    done = db.scalar(select(func.count()).select_from(Item).where(Item.user_id == USER_ID, Item.status == "done"))
    fav = db.scalar(select(func.count()).select_from(Item).where(*base, Item.is_favorite.is_(True)))
    per_cat = dict(db.execute(select(Item.category_id, func.count()).where(*base).group_by(Item.category_id)).all())
    cats = [{**cat_out(c), "count": per_cat.get(c.id, 0)} for c in db.scalars(select(Category).order_by(Category.sort))]
    return {"total": total, "new": new, "done": done, "favorites": fav, "categories": cats}


@app.get("/api/categories")
def categories(db: Session = Depends(get_db), _: int = Depends(require_auth)):
    return [cat_out(c) for c in db.scalars(select(Category).order_by(Category.sort))]


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
def tags_list(category: str | None = None, db: Session = Depends(get_db), _: int = Depends(require_auth)):
    """Теги: все теги библиотеки или только теги материалов раздела (появляются и исчезают сами)."""
    stmt = select(Item).where(Item.user_id == USER_ID)
    if category:
        c = cat_by_slug(db, category)
        if not c:
            return []
        stmt = stmt.where(Item.category_id == c.id)
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


# ---------- сайт ----------
app.mount("/thumbs", StaticFiles(directory=DATA_DIR / "thumbs"), name="thumbs")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/")
def index():
    return FileResponse(BASE_DIR / "static" / "index.html")
