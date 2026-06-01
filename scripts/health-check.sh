#!/bin/bash
# ARKON Health Check Script — for monitoring integration
# TASK-OPS-001: monitoring & alerting
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"  # Telegram/Slack webhook URL

check_api() {
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" --max-time 5)
  if [[ "$status" == "200" ]]; then
    echo "✅ API Health: OK"
    return 0
  else
    echo "❌ API Health: FAILED (HTTP $status)"
    return 1
  fi
}

send_alert() {
  local message="$1"
  if [[ -n "$ALERT_WEBHOOK" ]]; then
    curl -s -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"🚨 ARKON Alert: $message\"}" > /dev/null
    echo "Alert sent to webhook"
  fi
}

main() {
  if ! check_api; then
    send_alert "API health check failed at $(date)"
    exit 1
  fi
}

main
