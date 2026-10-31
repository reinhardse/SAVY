"""Разбор ссылок и сбор метаданных. Любой сбой не должен ломать сохранение: ссылка уже в базе."""
import ipaddress
import re
import socket
from urllib.parse import parse_qsl, quote, urlencode, urljoin, urlsplit, urlunsplit

import httpx
from bs4 import BeautifulSoup

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
TRACKING = {"fbclid", "igsh", "igshid", "gclid", "yclid", "si", "feature", "ref", "ref_src", "mc_cid", "mc_eid"}
MAX_BYTES = 1_500_000
TIMEOUT = 8.0

MAPS_HOSTS = ("maps.google.", "google.com/maps", "maps.app.goo.gl", "yandex.ru/maps", "yandex.com/maps", "2gis.", "maps.apple.com")
SHOP_HOSTS = ("ozon.", "wildberries.", "market.yandex.", "aliexpress.", "amazon.", "ebay.", "lamoda.")
BOOK_HOSTS = ("litres.", "labirint.", "goodreads.", "bookmate.", "fantlab.")


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
    return "web"


def guess_type_and_category(url_norm: str, source: str) -> tuple[str, str | None]:
    low = url_norm.lower()
    path = urlsplit(url_norm).path
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


def _get(client: httpx.Client, url: str, **kw) -> httpx.Response | None:
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
                if len(body) > MAX_BYTES:
                    break
            # Тело уже распаковано клиентом, поэтому заголовки кодирования убираем,
            # иначе httpx попробует распаковать его второй раз (DecodingError).
            headers = {k: v for k, v in r.headers.items()
                       if k.lower() not in ("content-encoding", "content-length", "transfer-encoding")}
            resp = httpx.Response(r.status_code, headers=headers, content=body, request=r.request)
            return resp
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
    img = meta("og:image", "twitter:image")
    return {
        "title": title,
        "description": meta("og:description", "description", "twitter:description"),
        "author": meta("author", "article:author", "og:site_name"),
        "thumbnail_url": urljoin(base, img) if img else None,
    }


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
        if not (out["title"] and out["thumbnail_url"]):
            try:
                r = _get(client, url)
                info = {"method": "open_graph", "status": r.status_code if r else None}
                if r is not None and r.status_code == 200:
                    og = _og(r.text, url)
                    info["fields"] = [k for k, v in og.items() if v]
                    for k, v in og.items():
                        if v and not out.get(k):
                            out[k] = v
                out["tried"].append(info)
            except Exception as e:  # noqa: BLE001
                out["tried"].append({"method": "open_graph", "error": type(e).__name__})
    got = [bool(out["title"]), bool(out["thumbnail_url"])]
    out["meta_state"] = "ok" if all(got) else "partial" if any(got) else "failed"
    return out


def download_thumb(url: str, dest) -> bool:
    try:
        with httpx.Client(timeout=TIMEOUT, headers={"User-Agent": UA}) as client:
            r = _get(client, url)
        if r is None or r.status_code != 200 or not r.headers.get("content-type", "").startswith("image/"):
            return False
        dest.write_bytes(r.content)
        return True
    except Exception:  # noqa: BLE001
        return False
