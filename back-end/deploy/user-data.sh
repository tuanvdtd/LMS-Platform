#!/bin/bash
# EC2 user data: chỉ chạy MỘT lần khi launch máy. Việc cần làm mỗi lần boot nằm ở skillpath.service.
set -euxo pipefail

dnf install -y docker
systemctl enable --now docker

# Amazon Linux 2023 không có docker compose plugin trong dnf → tải binary bản cố định.
COMPOSE_VERSION=v5.7.0
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Máy chỉ có 2GB RAM → thêm 1GB swap để đỡ lúc đỉnh.
if [ ! -f /swapfile ]; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Thư mục chứa .env (bí mật) → chỉ root đọc được.
mkdir -p /opt/skillpath
chmod 700 /opt/skillpath

cat > /etc/systemd/system/skillpath.service <<'UNIT'
[Unit]
Description=SkillPath API: pull image mới, migrate, khởi động
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target
# Lần boot đầu chưa có deploy.sh (CI ghi ở lần deploy đầu tiên) → bỏ qua, không báo lỗi.
ConditionPathExists=/opt/skillpath/deploy.sh

[Service]
Type=oneshot
ExecStart=/opt/skillpath/deploy.sh
TimeoutStartSec=900

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable skillpath.service
