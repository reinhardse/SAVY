#!/usr/bin/env bash
# Установка MY LIBRARY на Ubuntu 24.04.
# Запуск (из папки проекта): sudo bash deploy/install.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Запустите через sudo: sudo bash deploy/install.sh"
  exit 1
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SVC_USER="${SUDO_USER:-admin}"
DATA_DIR=/var/lib/mylibrary
ENV_FILE=/etc/mylibrary.env

echo "==> Устанавливаю системные пакеты"
apt-get update -y
apt-get install -y python3-venv python3-pip

echo "==> Создаю окружение Python и ставлю зависимости"
python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --quiet --upgrade pip
"$APP_DIR/venv/bin/pip" install --quiet -r "$APP_DIR/requirements.txt"

mkdir -p "$DATA_DIR"
chown -R "$SVC_USER":"$SVC_USER" "$DATA_DIR" "$APP_DIR/venv"

if [ ! -f "$ENV_FILE" ]; then
  echo "==> Пароль для входа на сайт (латиница, цифры, точка, дефис, минимум 8 символов)"
  while true; do
    read -r -s -p "Придумайте пароль: " PW; echo
    if [[ "$PW" =~ ^[A-Za-z0-9._-]{8,}$ ]]; then break; fi
    echo "Не подходит: нужны латинские буквы и цифры, минимум 8 символов."
  done
  TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  cat > "$ENV_FILE" <<ENVEOF
LIBRARY_PASSWORD=$PW
LIBRARY_API_TOKEN=$TOKEN
LIBRARY_HTTPS=1
LIBRARY_DATA=$DATA_DIR
ENVEOF
  chmod 600 "$ENV_FILE"
fi

echo "==> Создаю службу, которая держит сайт запущенным"
cat > /etc/systemd/system/mylibrary.service <<UNITEOF
[Unit]
Description=MY LIBRARY
After=network.target

[Service]
User=$SVC_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$APP_DIR/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNITEOF

systemctl daemon-reload
systemctl enable --now mylibrary
sleep 3

CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/ || true)"
if [ "$CODE" = "200" ]; then
  echo "==> Готово: сайт отвечает на сервере (код 200)."
else
  echo "==> Что-то не так: код $CODE. Покажите вывод команды: sudo journalctl -u mylibrary -n 30 --no-pager"
fi
