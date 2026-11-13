#!/usr/bin/env bash
# Kéo image mới, migrate DB, khởi động lại app. Gọi bởi CI (qua SSM) và bởi skillpath.service mỗi lần máy boot.
set -euo pipefail
cd /opt/skillpath

# SSM và systemd có thể không đặt HOME; docker tìm thông tin đăng nhập GHCR ở $HOME/.docker.
export HOME=/root

# Boot và CI có thể gọi cùng lúc → xếp hàng thay vì chạy chồng.
exec 9>/var/lock/skillpath-deploy.lock
flock 9

echo "==> pull"
docker compose pull --quiet

echo "==> migrate"
# Lỗi ở đây thì dừng trước `up`: container cũ vẫn chạy.
docker compose run --rm --no-deps api node_modules/.bin/prisma migrate deploy

echo "==> up"
docker compose up -d --remove-orphans

echo "==> chờ API trả lời"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:4000/api; then
    echo "API OK"
    docker image prune -f > /dev/null
    exit 0
  fi
  sleep 2
done

# Không in log app: output này hiện trong log CI, mà repo public.
echo "API không lên sau 60s. Xem: sudo docker compose -f /opt/skillpath/compose.yaml logs api" >&2
exit 1
