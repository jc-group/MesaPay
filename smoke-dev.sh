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

table_menu_response="$(curl -fsS "${BASE_BACKEND_URL}/api/v1/public/tables/mesa-12-demo/menu")"
echo "[OK] /api/v1/public/tables/mesa-12-demo/menu -> ${table_menu_response}"

join_table_response="$(curl -fsS -X POST "${BASE_BACKEND_URL}/api/v1/public/tables/mesa-12-demo/join" -H "Content-Type: application/json" -d '{"guestName":"Smoke"}')"
echo "[OK] /api/v1/public/tables/mesa-12-demo/join -> ${join_table_response}"

member_id="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["member"]["id"])' "${join_table_response}")"

add_items_response="$(curl -fsS -X POST "${BASE_BACKEND_URL}/api/v1/public/tables/mesa-12-demo/items" -H "Content-Type: application/json" -d "{\"memberId\":${member_id},\"items\":[{\"menuItemId\":1,\"quantity\":1},{\"menuItemId\":3,\"quantity\":1}]}")"
echo "[OK] /api/v1/public/tables/mesa-12-demo/items -> ${add_items_response}"

bill_response="$(curl -fsS "${BASE_BACKEND_URL}/api/v1/public/tables/mesa-12-demo/bill")"
echo "[OK] /api/v1/public/tables/mesa-12-demo/bill -> ${bill_response}"

line_item_ids="$(python3 -c 'import json,sys; d=json.loads(sys.argv[1]); ids=[str(i["id"]) for i in d["lineItems"] if i["status"]=="unpaid"][:2]; print("["+",".join(ids)+"]")' "${bill_response}")"

checkout_response="$(curl -fsS -X POST "${BASE_BACKEND_URL}/api/v1/public/tables/mesa-12-demo/checkout" -H "Content-Type: application/json" -d "{\"payerMemberId\":${member_id},\"guestName\":\"Smoke\",\"lineItemIds\":${line_item_ids},\"card\":{\"holderName\":\"Smoke User\",\"number\":\"4111111111111111\",\"expiry\":\"12/28\",\"cvv\":\"123\"}}")"
echo "[OK] /api/v1/public/tables/mesa-12-demo/checkout -> ${checkout_response}"

order_id="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["order"]["id"])' "${checkout_response}")"

if [ -n "${MESAPAY_ADMIN_JWT:-}" ]; then
  refund_response="$(curl -fsS -X POST "${BASE_BACKEND_URL}/api/v1/public/tables/mesa-12-demo/refund" -H "Content-Type: application/json" -H "Authorization: Bearer ${MESAPAY_ADMIN_JWT}" -d "{\"orderId\":${order_id}}")"
  echo "[OK] /api/v1/public/tables/mesa-12-demo/refund -> ${refund_response}"

  refunded_ids="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["refundedLineItems"])' "${refund_response}")"
  bill_after_refund_response="$(curl -fsS "${BASE_BACKEND_URL}/api/v1/public/tables/mesa-12-demo/bill")"

  python3 - "${refunded_ids}" "${bill_after_refund_response}" <<'PY'
import json
import sys

refunded = set(json.loads(sys.argv[1]))
bill = json.loads(sys.argv[2])

if not refunded:
    raise SystemExit("[ERROR] Refund did not return line items")

items = {item["id"]: item for item in bill["lineItems"]}
for line_id in refunded:
    if line_id not in items:
        raise SystemExit(f"[ERROR] Refunded line item {line_id} missing in bill")
    if items[line_id]["status"] != "unpaid":
        raise SystemExit(f"[ERROR] Refunded line item {line_id} not unpaid")

print("[OK] Refunded line items marked unpaid")
PY
else
  echo "[SKIP] Refund flow (MESAPAY_ADMIN_JWT not set)"
fi

frontend_status="$(curl -sS -o /tmp/mesapay_smoke_home.html -w "%{http_code}" "${BASE_FRONTEND_URL}")"
if [ "${frontend_status}" != "200" ]; then
  echo "[ERROR] Frontend returned status ${frontend_status}"
  exit 1
fi

echo "[OK] Frontend / -> HTTP ${frontend_status}"

table_page_status="$(curl -sS -o /tmp/mesapay_smoke_table_page.html -w "%{http_code}" "${BASE_FRONTEND_URL}/mesa/mesa-12-demo")"
if [ "${table_page_status}" != "200" ]; then
  echo "[ERROR] Table page returned status ${table_page_status}"
  exit 1
fi

echo "[OK] Frontend /mesa/mesa-12-demo -> HTTP ${table_page_status}"
echo "Smoke test passed."
