#!/usr/bin/env sh
set -eu

BASE_BACKEND_URL="${BASE_BACKEND_URL:-http://localhost:3001}"
BASE_FRONTEND_URL="${BASE_FRONTEND_URL:-http://localhost:3000}"

echo "Running MesaPay smoke test (dev)..."

health_response="$(curl -fsS "${BASE_BACKEND_URL}/health")"
echo "[OK] /health -> ${health_response}"

version_response="$(curl -fsS "${BASE_BACKEND_URL}/api/v1/version")"
echo "[OK] /api/v1/version -> ${version_response}"

db_ping_response="$(curl -fsS "${BASE_BACKEND_URL}/api/v1/db/ping")"
echo "[OK] /api/v1/db/ping -> ${db_ping_response}"

frontend_status="$(curl -sS -o /tmp/mesapay_smoke_home.html -w "%{http_code}" "${BASE_FRONTEND_URL}")"
if [ "${frontend_status}" != "200" ]; then
  echo "[ERROR] Frontend returned status ${frontend_status}"
  exit 1
fi

echo "[OK] Frontend / -> HTTP ${frontend_status}"
echo "Smoke test passed."
