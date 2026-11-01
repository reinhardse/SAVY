"""Google Календарь: вход через OAuth и синхронизация дат карточек (событие на каждую карточку с датой).

Нужны переменные окружения: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI (адрес сайта + /api/gcal/callback).
Часовой пояс событий: GCAL_TZ (по умолчанию Europe/Moscow).
"""
import logging
import os
from datetime import date, datetime, timedelta, timezone

import httpx
from sqlalchemy import select

from .db import Card, GCalToken

SCOPE = "https://www.googleapis.com/auth/calendar.events"
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
EVENTS = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
TZ = os.environ.get("GCAL_TZ", "Europe/Moscow")
log = logging.getLogger("gcal")


def configured() -> bool:
    return bool(os.environ.get("GOOGLE_CLIENT_ID") and os.environ.get("GOOGLE_CLIENT_SECRET") and os.environ.get("GOOGLE_REDIRECT_URI"))


def connected(db, user_id: int) -> bool:
    return db.scalars(select(GCalToken).where(GCalToken.user_id == user_id)).first() is not None


def auth_url(state: str) -> str:
    q = httpx.QueryParams({
        "client_id": os.environ["GOOGLE_CLIENT_ID"],
        "redirect_uri": os.environ["GOOGLE_REDIRECT_URI"],
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    })
    return f"{AUTH_URL}?{q}"


def exchange_code(code: str) -> str:
    """Меняет код из Google на долгосрочный refresh_token."""
    r = httpx.post(TOKEN_URL, data={
        "code": code,
        "client_id": os.environ["GOOGLE_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
        "redirect_uri": os.environ["GOOGLE_REDIRECT_URI"],
        "grant_type": "authorization_code",
    }, timeout=15)
    r.raise_for_status()
    rt = r.json().get("refresh_token")
    if not rt:
        raise ValueError("Google не вернул постоянный доступ. Отключите доступ SAVE в аккаунте Google и войдите снова.")
    return rt


def _headers(db, user_id: int) -> dict | None:
    row = db.scalars(select(GCalToken).where(GCalToken.user_id == user_id)).first()
    if not row or not configured():
        return None
    r = httpx.post(TOKEN_URL, data={
        "refresh_token": row.refresh_token,
        "client_id": os.environ["GOOGLE_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
        "grant_type": "refresh_token",
    }, timeout=15)
    r.raise_for_status()
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _body(card: Card, board_name: str) -> dict:
    title = card.title or "Без названия"
    desc = f"Из SAVE · доска «{board_name}»"
    if card.due_time:
        # смещение указываем явно: Москва, +03:00 круглый год
        start = datetime.fromisoformat(f"{card.due_date}T{card.due_time}:00").replace(tzinfo=timezone(timedelta(hours=3)))
        end = start + timedelta(minutes=card.duration_min or 60)
        return {"summary": title, "description": desc,
                "start": {"dateTime": start.isoformat(), "timeZone": TZ},
                "end": {"dateTime": end.isoformat(), "timeZone": TZ}}
    d = date.fromisoformat(card.due_date)
    return {"summary": title, "description": desc,
            "start": {"date": d.isoformat()},
            "end": {"date": (d + timedelta(days=1)).isoformat()}}


def sync_card(db, card: Card, board_name: str, user_id: int) -> None:
    """Создаёт, меняет или удаляет событие карточки. Сбой Google не мешает сохранению карточки."""
    try:
        headers = _headers(db, user_id)
        if not headers:
            return
        if not card.due_date:
            if card.gcal_event_id:
                httpx.delete(f"{EVENTS}/{card.gcal_event_id}", headers=headers, timeout=15)
                card.gcal_event_id = None
            return
        body = _body(card, board_name)
        if card.gcal_event_id:
            r = httpx.patch(f"{EVENTS}/{card.gcal_event_id}", json=body, headers=headers, timeout=15)
            if r.status_code < 400:
                return
            # Google не принял изменение: запишем причину и пересоздадим событие
            log.error("Google Calendar PATCH %s: %s %s", card.gcal_event_id, r.status_code, r.text)
            httpx.delete(f"{EVENTS}/{card.gcal_event_id}", headers=headers, timeout=15)
            card.gcal_event_id = None
        r = httpx.post(EVENTS, json=body, headers=headers, timeout=15)
        if r.status_code >= 400:
            log.error("Google Calendar POST: %s %s", r.status_code, r.text)
            r.raise_for_status()
        card.gcal_event_id = r.json()["id"]
    except Exception:
        log.exception("Google Calendar: карточка %s не синхронизирована", card.id)


def delete_event(db, event_id: str, user_id: int) -> None:
    try:
        headers = _headers(db, user_id)
        if headers:
            httpx.delete(f"{EVENTS}/{event_id}", headers=headers, timeout=15)
    except Exception:
        log.exception("Google Calendar: событие %s не удалено", event_id)
