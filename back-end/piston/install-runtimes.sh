#!/usr/bin/env bash
# Cài runtime cho Piston — một lần mỗi môi trường (package nằm trong volume), chạy lại được: package đã có thì bỏ qua.
# Version phải khớp LANGUAGES ở code-runner.ts.
set -euo pipefail
URL="${PISTON_URL:-http://127.0.0.1:2000}"
for pkg in "node 20.11.1" "python 3.12.0" "gcc 10.2.0"; do
  set -- $pkg
  # /runtimes trả `{"language":..,"version":..,"aliases":[..],"runtime":"node"}`; tên package khớp `runtime` (node, gcc) hoặc `language` (python).
  installed=$(curl -fsS "$URL/api/v2/runtimes")
  if grep -Fq -e "\"language\":\"$1\",\"version\":\"$2\"" <<<"$installed" ||
    grep -Eq "\"version\":\"${2//./\\.}\"[^}]*\"runtime\":\"$1\"" <<<"$installed"; then
    echo "$1 $2: đã có"
    continue
  fi
  curl -fsS -X POST "$URL/api/v2/packages" -H 'Content-Type: application/json' -d "{\"language\":\"$1\",\"version\":\"$2\"}"
  echo
done
curl -fsS "$URL/api/v2/runtimes"
