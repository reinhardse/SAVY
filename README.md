# MY LIBRARY — веб-черновик

Личная библиотека ссылок: сохранить, разобрать, вернуться. FastAPI + SQLite + сайт без сборки.

## Запуск

```bash
pip install -r requirements.txt
LIBRARY_PASSWORD='ваш-пароль' uvicorn app.main:app --port 8000
```

Откройте http://localhost:8000. Данные лежат в папке `data/` (база и обложки).

## Переменные окружения

| Переменная | Для чего |
| --- | --- |
| LIBRARY_PASSWORD | пароль входа (обязательна) |
| LIBRARY_API_TOKEN | токен для бота и «Быстрых команд» iOS: заголовок `Authorization: Bearer ...` |
| LIBRARY_HTTPS=1 | включить у cookie флаг secure (на сервере с HTTPS) |
| DATABASE_URL | например `postgresql+psycopg://...`; по умолчанию SQLite |
| LIBRARY_DATA | папка для базы и обложек |

## Добавить ссылку без сайта (для бота и iOS)

```bash
curl -X POST http://localhost:8000/api/items \
  -H "Authorization: Bearer $LIBRARY_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/dQw4w9WgXcQ"}'
```

Бот в Telegram будет вызывать именно этот запрос.

## Экспорт

`/api/export?format=json` и `/api/export?format=csv` (после входа).

## Что дальше

Бот Telegram, разведка Instagram (поле `meta_raw` у каждого материала хранит, какие способы получения данных сработали), Docker Compose и HTTPS через Caddy на сервере.

## Установка на сервер (Ubuntu 24.04)

```bash
sudo git clone https://github.com/ЛОГИН/my-library /opt/mylibrary
cd /opt/mylibrary
sudo bash deploy/install.sh
```

Скрипт спросит пароль для входа, создаст службу `mylibrary` и запустит сайт на 127.0.0.1:8000.
Подключение к интернету (nginx и HTTPS) настраивается отдельно.
