"""Разбор ссылок и сбор метаданных. Любой сбой не должен ломать сохранение: ссылка уже в базе."""
import ipaddress
import os
import re
import socket
from urllib.parse import parse_qsl, quote, urlencode, urljoin, urlsplit, urlunsplit

import httpx
from bs4 import BeautifulSoup

from .db import DATA_DIR

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
TRACKING = {"fbclid", "igsh", "igshid", "gclid", "yclid", "si", "feature", "ref", "ref_src", "mc_cid", "mc_eid"}
MAX_BYTES = 1_500_000
TIMEOUT = 15.0
DESKTOP_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
THUMB_MAX = 8_000_000  # обложка больше этого размера не сохраняется: обрезанная картинка битая
ATTEMPTS = 3  # сайты иногда отвечают медленно или с ошибкой; повторяем, прежде чем сдаться

MAPS_HOSTS = ("maps.google.", "google.com/maps", "maps.app.goo.gl", "yandex.ru/maps", "yandex.com/maps", "2gis.", "maps.apple.com")
SHOP_HOSTS = ("ozon.", "wildberries.", "market.yandex.", "aliexpress.", "amazon.", "ebay.", "lamoda.")
BOOK_HOSTS = ("litres.", "labirint.", "goodreads.", "bookmate.", "fantlab.")


KP_FILE = DATA_DIR / "kp_token"


def kp_token() -> str | None:
    """Ключ kinopoisk.dev: из переменной окружения или из файла, который заполняется на странице приложения."""
    t = os.environ.get("LIBRARY_KP_TOKEN")
    if t and t.strip():
        return t.strip()
    try:
        return KP_FILE.read_text().strip() or None
    except OSError:
        return None


def set_kp_token(token: str) -> None:
    if token:
        KP_FILE.write_text(token)
        os.chmod(KP_FILE, 0o600)
    elif KP_FILE.exists():
        KP_FILE.unlink()


SERVICE_HOSTS = ("sso.kinopoisk.ru", "sso.passport.yandex.ru", "passport.yandex.ru")


def service_link_hint(url: str) -> str | None:
    """Служебные ссылки входа (Яндекс/Кинопоиск) не ведут на страницу: сохранять их бессмысленно."""
    host = (urlsplit(url).hostname or "").lower()
    if host in SERVICE_HOSTS:
        return ("Это служебная ссылка входа, а не страница фильма. Откройте фильм на Кинопоиске и скопируйте адрес "
                "из адресной строки — он выглядит как kinopoisk.ru/film/301/")
    return None


def extract_urls(text: str) -> list[str]:
    found = re.findall(r"https?://[^\s<>\"']+", text or "")
    return [u.rstrip(".,);]") for u in found]


def normalize_url(url: str) -> str:
    url = url.strip()
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    p = urlsplit(url)
    host = (p.hostname or "").lower()
    for prefix in ("www.", "m."):
        if host.startswith(prefix):
            host = host[len(prefix):]
    if host == "youtu.be":  # короткая ссылка -> стандартная
        vid = p.path.strip("/")
        return f"https://youtube.com/watch?v={vid}"
    query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
             if k not in TRACKING and not k.startswith("utm_")]
    path = p.path.rstrip("/") or ""
    netloc = host + (f":{p.port}" if p.port and p.port not in (80, 443) else "")
    return urlunsplit((p.scheme.lower(), netloc, path, urlencode(query), ""))


def detect_source(url_norm: str) -> str:
    host = (urlsplit(url_norm).hostname or "")
    if host.endswith("instagram.com"):
        return "instagram"
    if host.endswith("youtube.com") or host == "youtu.be":
        return "youtube"
    if host in ("t.me", "telegram.me"):
        return "telegram"
    if host.endswith("tiktok.com"):
        return "tiktok"
    if host.endswith("litres.ru"):
        return "litres"
    if host.endswith("kinopoisk.ru"):
        return "kinopoisk"
    return "web"


def guess_type_and_category(url_norm: str, source: str) -> tuple[str, str | None]:
    low = url_norm.lower()
    path = urlsplit(url_norm).path
    if source == "kinopoisk":  # фильмы и сериалы никуда не относим сами: категорию выбирает пользователь
        return "video", None
    if source == "youtube" or source == "tiktok":
        return "video", "watch"
    if source == "instagram":
        if "/reel" in path or "/tv/" in path:
            return "video", "watch"
        return "image", "ideas"
    if any(h in low for h in MAPS_HOSTS):
        return "place", "places"
    if any(h in low for h in SHOP_HOSTS):
        return "product", "buy"
    if any(h in low for h in BOOK_HOSTS):
        return "book", "read"
    if source == "web":
        return "article", "read"
    return "other", None


def is_public_host(host: str) -> bool:
    """Защита от запросов во внутреннюю сеть: резолвим имя и проверяем, что все адреса публичные."""
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return False
    return bool(infos) and all(ipaddress.ip_address(i[4][0]).is_global for i in infos)


def _get(client: httpx.Client, url: str, limit: int = MAX_BYTES, **kw) -> httpx.Response | None:
    """GET с ручными редиректами (каждый переход проверяется), читает не больше MAX_BYTES."""
    for _ in range(5):
        host = urlsplit(url).hostname or ""
        if not is_public_host(host):
            return None
        with client.stream("GET", url, follow_redirects=False, **kw) as r:
            if r.status_code in (301, 302, 303, 307, 308) and r.headers.get("location"):
                url = urljoin(url, r.headers["location"])
                continue
            body = b""
            for chunk in r.iter_bytes():
                body += chunk
                if len(body) > limit:
                    break
            # Тело уже распаковано клиентом, поэтому заголовки кодирования убираем,
            # иначе httpx попробует распаковать его второй раз (DecodingError).
            headers = {k: v for k, v in r.headers.items()
                       if k.lower() not in ("content-encoding", "content-length", "transfer-encoding")}
            resp = httpx.Response(r.status_code, headers=headers, content=body, request=r.request)
            return resp
    return None


TITLE_TAIL = re.compile(r"\s*[|—–-]\s*(ЛитРес|Литрес|LitRes|Litres|Читать|Купить|Labirint|Лабиринт|Bookmate|Википедия).*$", re.I)


def _ld_image(soup) -> str | None:
    """Обложка из данных Schema.org (JSON-LD): книжные сайты часто отдают её так, даже без og:image."""
    import json

    def find(node):
        if isinstance(node, dict):
            img = node.get("image")
            if isinstance(img, str):
                return img
            if isinstance(img, list) and img and isinstance(img[0], str):
                return img[0]
            if isinstance(img, dict) and isinstance(img.get("url"), str):
                return img["url"]
            for v in node.values():
                r = find(v)
                if r:
                    return r
        elif isinstance(node, list):
            for v in node:
                r = find(v)
                if r:
                    return r
        return None

    for tag in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            found = find(json.loads(tag.string or ""))
        except (ValueError, TypeError):
            continue
        if found:
            return found
    return None


def _get_retry(client: httpx.Client, url: str, **kw) -> httpx.Response | None:
    """Повторяет запрос при таймауте, обрыве и ответах 429/5xx (с паузой), но не при 403/404."""
    import time
    last = None
    for attempt in range(ATTEMPTS):
        try:
            r = _get(client, url, **kw)
            if r is not None and r.status_code not in (429, 500, 502, 503, 504):
                return r
            last = r
        except httpx.TransportError as e:  # таймаут, обрыв соединения
            last = e
        if attempt < ATTEMPTS - 1:
            time.sleep(1.5 * (attempt + 1))
    return last if isinstance(last, httpx.Response) else None


def _icon(soup) -> str | None:
    """Иконка сайта: apple-touch-icon обычно крупная, годится как запасная картинка."""
    for rel in ("apple-touch-icon", "apple-touch-icon-precomposed", "image_src"):
        tag = soup.find("link", attrs={"rel": rel})
        if tag and tag.get("href"):
            return tag["href"].strip()
    return None


def _og(html: str, base: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    def meta(*names):
        for n in names:
            tag = soup.find("meta", attrs={"property": n}) or soup.find("meta", attrs={"name": n})
            if tag and tag.get("content"):
                return tag["content"].strip()
        return None

    title = meta("og:title", "twitter:title") or (soup.title.string.strip() if soup.title and soup.title.string else None)
    if title:
        title = TITLE_TAIL.sub("", title).strip() or title
    img = meta("og:image", "og:image:secure_url", "twitter:image", "twitter:image:src") or _ld_image(soup)
    icon = _icon(soup)
    return {
        "title": title,
        "description": meta("og:description", "description", "twitter:description"),
        "author": meta("author", "article:author", "og:site_name"),
        "thumbnail_url": urljoin(base, img) if img else None,
        "icon_url": urljoin(base, icon) if icon else None,
    }


WD_UA = {"User-Agent": "SAVE-personal-library/1.0 (https://github.com/reinhardse/SAVY)", "Accept": "application/json"}


def _wikidata_title(client: httpx.Client, kp_id: str, dbg: list | None = None) -> str | None:
    """Русское (а если нет — английское) название фильма по номеру Кинопоиска: свойство P2603 в Wikidata.
    Сам Кинопоиск роботам страницу не отдаёт, поэтому спрашиваем у открытой базы. dbg — для журнала: что вернулось."""
    dbg = dbg if dbg is not None else []
    sparql = ('SELECT ?ru ?en WHERE { ?f wdt:P2603 "%s" . '
              'OPTIONAL { ?f rdfs:label ?ru FILTER(LANG(?ru) = "ru") } '
              'OPTIONAL { ?f rdfs:label ?en FILTER(LANG(?en) = "en") } } LIMIT 1' % kp_id)
    try:
        r = _get_retry(client, "https://query.wikidata.org/sparql?format=json&query=" + quote(sparql), headers=WD_UA)
        dbg.append({"sparql": r.status_code if r is not None else None})
        if r is not None and r.status_code == 200:
            rows = r.json().get("results", {}).get("bindings", [])
            if rows:
                row = rows[0]
                title = (row.get("ru") or row.get("en") or {}).get("value")
                if title:
                    return title
            dbg.append({"sparql_rows": len(rows)})
    except (ValueError, KeyError, TypeError, httpx.HTTPError) as e:
        dbg.append({"sparql_error": type(e).__name__})
    # запасной путь: поиск по утверждению
    try:
        r = _get_retry(client, "https://www.wikidata.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch="
                       + quote(f"haswbstatement:P2603={kp_id}"), headers=WD_UA)
        dbg.append({"search": r.status_code if r is not None else None})
        if r is None or r.status_code != 200:
            return None
        hits = r.json().get("query", {}).get("search", [])
        if not hits:
            return None
        qid = hits[0]["title"]
        r = _get_retry(client, f"https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels&languages=ru|en&ids={qid}",
                       headers=WD_UA)
        if r is None or r.status_code != 200:
            return None
        labels = r.json().get("entities", {}).get(qid, {}).get("labels", {})
        return (labels.get("ru") or labels.get("en") or {}).get("value")
    except (ValueError, KeyError, TypeError, httpx.HTTPError) as e:
        dbg.append({"search_error": type(e).__name__})
        return None


def _kp_api(client: httpx.Client, kp_id: str, dbg: list) -> tuple[str | None, str | None, str | None]:
    """Название и постер из API по бесплатному ключу: kinopoisk.dev (LIBRARY_KP_TOKEN) или kinopoiskapiunofficial.tech
    (LIBRARY_KPU_TOKEN). Без ключа ничего не делает."""
    token = kp_token()
    if token:
        try:
            r = _get_retry(client, f"https://api.kinopoisk.dev/v1.4/movie/{kp_id}",
                           headers={"X-API-KEY": token, "Accept": "application/json"})
            dbg.append({"kinopoisk_dev": r.status_code if r is not None else None})
            if r is not None and r.status_code == 200:
                j = r.json()
                poster = j.get("poster") or {}
                title = j.get("name") or j.get("alternativeName") or j.get("enName")
                desc = j.get("description") or j.get("shortDescription")
                if title:
                    return title, poster.get("url") or poster.get("previewUrl"), desc
        except (ValueError, KeyError, TypeError, httpx.HTTPError) as e:
            dbg.append({"kinopoisk_dev_error": type(e).__name__})
    token = os.environ.get("LIBRARY_KPU_TOKEN")
    if token:
        try:
            r = _get_retry(client, f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{kp_id}",
                           headers={"X-API-KEY": token, "Accept": "application/json"})
            dbg.append({"kpu": r.status_code if r is not None else None})
            if r is not None and r.status_code == 200:
                j = r.json()
                title = j.get("nameRu") or j.get("nameOriginal") or j.get("nameEn")
                if title:
                    return title, j.get("posterUrl") or j.get("posterUrlPreview"), j.get("description")
        except (ValueError, KeyError, TypeError, httpx.HTTPError) as e:
            dbg.append({"kpu_error": type(e).__name__})
    return None, None, None


def share_title(text: str) -> str | None:
    """Название из текста «Поделиться» (например, «Манчестер у моря (2016) https://...»): всё, что осталось без ссылок."""
    t = re.sub(r"https?://\S+", " ", text or "")
    t = re.sub(r"(?i)\s*[—–-]?\s*смотреть\s+онлайн.*$", "", t)
    t = re.sub(r"\s+", " ", t).strip(" \t\n—–-:|•")
    return t[:100] if 2 <= len(t) <= 200 else None


def fetch_metadata(url: str, source: str) -> dict:
    """Возвращает title/description/author/thumbnail_url + служебные поля tried и meta_state."""
    out = {"title": None, "description": None, "author": None, "thumbnail_url": None, "tried": []}
    headers = {"User-Agent": UA, "Accept-Language": "ru,en;q=0.8"}
    with httpx.Client(timeout=TIMEOUT, headers=headers) as client:
        if source == "youtube":
            try:
                r = _get(client, "https://www.youtube.com/oembed?format=json&url=" + quote(url, safe=""))
                out["tried"].append({"method": "youtube_oembed", "status": r.status_code if r else None})
                if r is not None and r.status_code == 200:
                    j = r.json()
                    out.update(title=j.get("title"), author=j.get("author_name"), thumbnail_url=j.get("thumbnail_url"))
            except Exception as e:  # noqa: BLE001
                out["tried"].append({"method": "youtube_oembed", "error": type(e).__name__})
        elif source == "instagram":
            try:
                r = _get(client, "https://graph.facebook.com/v26.0/instagram_oembed?omitscript=true&url=" + quote(url, safe=""))
                info = {"method": "meta_oembed", "status": r.status_code if r else None}
                if r is not None and r.status_code == 200:
                    j = r.json()
                    info["fields"] = sorted(j.keys())
                    out.update(title=j.get("title"), author=j.get("author_name"), thumbnail_url=j.get("thumbnail_url"))
                out["tried"].append(info)
            except Exception as e:  # noqa: BLE001
                out["tried"].append({"method": "meta_oembed", "error": type(e).__name__})
        if source == "instagram" and not out["thumbnail_url"]:
            # без токена Meta Инстаграм отдаёт обложку и подпись ботам соцсетей: представляемся ссылочным ботом Facebook
            try:
                with httpx.Client(timeout=TIMEOUT, headers={"User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "Accept-Language": "ru,en;q=0.8"}) as fb:
                    r = _get_retry(fb, url)
                    info = {"method": "open_graph_fb", "status": r.status_code if r else None}
                    if r is not None and r.status_code == 200:
                        og = _og(r.text, url)
                        info["fields"] = [k for k, v in og.items() if v]
                        for k, v in og.items():
                            if v and not out.get(k):
                                out[k] = v
                    out["tried"].append(info)
            except Exception as e:  # noqa: BLE001
                out["tried"].append({"method": "open_graph_fb", "error": type(e).__name__})
        if not (out["title"] and out["thumbnail_url"]):
            try:
                r = _get_retry(client, url)
                info = {"method": "open_graph", "status": r.status_code if r else None}
                if r is not None and r.status_code == 200:
                    og = _og(r.text, url)
                    if source in ("litres", "kinopoisk") and og.get("title") and " — " in og["title"]:
                        og["title"] = og["title"].split(" — ")[0].strip()  # «Название — Автор Издательство» -> «Название»
                    info["fields"] = [k for k, v in og.items() if v]
                    for k, v in og.items():
                        if v and not out.get(k):
                            out[k] = v
                out["tried"].append(info)
            except Exception as e:  # noqa: BLE001
                out["tried"].append({"method": "open_graph", "error": type(e).__name__})
    if not out["thumbnail_url"] and source == "web":
        # мобильная версия сайта иногда отдаёт страницу без картинки: пробуем как десктоп
        try:
            with httpx.Client(timeout=TIMEOUT, headers={"User-Agent": DESKTOP_UA, "Accept-Language": "ru,en;q=0.8"}) as dc:
                r = _get_retry(dc, url)
                info = {"method": "open_graph_desktop", "status": r.status_code if r else None}
                if r is not None and r.status_code == 200:
                    og = _og(r.text, url)
                    info["image"] = bool(og.get("thumbnail_url"))
                    if og.get("thumbnail_url"):
                        out["thumbnail_url"] = og["thumbnail_url"]
                    if og.get("icon_url") and not out.get("icon_url"):
                        out["icon_url"] = og["icon_url"]
                    if not out["title"] and og.get("title"):
                        out["title"] = og["title"]
                out["tried"].append(info)
        except Exception as e:  # noqa: BLE001
            out["tried"].append({"method": "open_graph_desktop", "error": type(e).__name__})
    if source == "youtube" and not out["thumbnail_url"]:
        # обложка ролика лежит на CDN Ютуба по номеру ролика, даже когда страница и oEmbed с сервера не открылись
        ym = re.search(r"(?:[?&]v=|youtu\.be/|/shorts/|/embed/|/live/)([\w-]{11})", url)
        if ym:
            out["thumbnail_url"] = f"https://i.ytimg.com/vi/{ym.group(1)}/hqdefault.jpg"
            out["tried"].append({"method": "youtube_cdn_thumb"})
    if not out["thumbnail_url"] and out.get("icon_url"):
        out["thumbnail_url"] = out["icon_url"]
        out["tried"].append({"method": "site_icon"})
    if source == "kinopoisk":
        m = re.search(r"/(?:film|series)/(\d+)", url)
        if m:
            kp_id = m.group(1)
            dbg: list = []
            with httpx.Client(timeout=TIMEOUT) as api:
                t, poster, desc = _kp_api(api, kp_id, dbg)
                if t and not out["title"]:
                    out["title"] = t
                if desc and not out["description"]:
                    out["description"] = desc.strip()
                if poster and not out["thumbnail_url"]:
                    out["thumbnail_url"] = poster
                if not out["thumbnail_url"]:
                    # постер по номеру: /film/301/ -> картинка с CDN Кинопоиска
                    out["thumbnail_url"] = f"https://st.kp.yandex.net/images/film_big/{kp_id}.jpg"
                    out["tried"].append({"method": "kp_poster", "status": "fallback"})
                if not out["title"]:
                    out["title"] = _wikidata_title(api, kp_id, dbg)
            out["tried"].append({"method": "kinopoisk_title", "found": bool(out["title"]), "debug": dbg})
    got = [bool(out["title"]), bool(out["thumbnail_url"])]
    out["meta_state"] = "ok" if all(got) else "partial" if any(got) else "failed"
    return out


def download_thumb(url: str, dest) -> bool:
    try:
        with httpx.Client(timeout=TIMEOUT, headers={"User-Agent": UA, "Accept": "image/*,*/*;q=0.8"}) as client:
            r = _get_retry(client, url, limit=THUMB_MAX)
        if r is None or r.status_code != 200:
            return False
        ctype = r.headers.get("content-type", "")
        by_ext = urlsplit(url).path.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"))
        if not (ctype.startswith("image/") or (by_ext and ctype.startswith("application/octet-stream"))):
            return False
        if len(r.content) > THUMB_MAX or not r.content:
            return False
        dest.write_bytes(r.content)
        return True
    except Exception:  # noqa: BLE001
        return False
