#!/usr/bin/env bash
set -euo pipefail

# --- Config (can be overridden) ---
: "${TS_API_KEY:?Set TS_API_KEY to a Tailscale API key}"
: "${TS_TAILNET:?Set TS_TAILNET to your tailnet (e.g. user.github or org.github)}"

DAYS="${DAYS:-14}"     # consider stale if lastSeen older than this many days AND offline
OUTDIR="${OUTDIR:-./tailscale_audit}"
API="https://api.tailscale.com/api/v2"

# Devices to ALWAYS keep (regex matches on hostname)
PROTECT_NAME_REGEX="${PROTECT_NAME_REGEX:-'(tailscale-operator|ts-operator|operator|svc-|proxy|k8s)'}"
# Tags to ALWAYS keep (regex matches on tag string)
PROTECT_TAG_REGEX="${PROTECT_TAG_REGEX:-'(^tag:k8s|tag:k8s-operator)'}"

# Deletion mode: set DELETE=1 to delete candidates after confirmation
DELETE="${DELETE:-0}"
FORCE="${FORCE:-0}"    # set to 1 to skip confirmation prompt (CI mode)

mkdir -p "$OUTDIR"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need curl
need jq
need python3

fetch_devices() {
  curl -sS -u "${TS_API_KEY}:" \
    "${API}/tailnet/${TS_TAILNET}/devices"
}

# returns days since lastSeen (float) using python (robust on macOS/Linux)
age_days() {
  python3 - <<'PY' "$1"
import sys, datetime
from dateutil import parser as dp

# Fallback if python-dateutil isn't installed: try fromisoformat; else basic parse
def parse_iso(s):
    try:
        return dp.isoparse(s)
    except Exception:
        try:
            return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
        except Exception:
            # as a last resort, strip subseconds
            if '.' in s:
                s = s.split('.')[0] + 'Z'
            return datetime.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)

s = sys.argv[1]
now = datetime.datetime.now(datetime.timezone.utc)
dt = parse_iso(s)
delta = (now - dt).total_seconds() / 86400
print(f"{delta:.2f}")
PY
}

# Render nice table
print_header() {
  printf "%-20s  %-40s  %-8s  %-10s  %-20s  %s\n" "DEVICE_ID" "HOSTNAME" "ONLINE" "AUTHORIZED" "LAST_SEEN" "TAGS"
  printf "%s\n" "------------------------------------------------------------------------------------------------------------------------------------------"
}

# Main
echo "== Fetching Tailscale devices for tailnet: ${TS_TAILNET}"
RAW_JSON="$(fetch_devices)"
echo "$RAW_JSON" | jq -e . >/dev/null || { echo "Invalid JSON from Tailscale API"; exit 1; }

REPORT_JSON="${OUTDIR}/devices.json"
REPORT_CSV="${OUTDIR}/devices.csv"
CANDIDATES="${OUTDIR}/candidates.txt"

echo "$RAW_JSON" | jq '.devices' > "$REPORT_JSON"

# Build CSV
echo "deviceId,hostname,online,authorized,lastSeen,addresses,tags,os,clientVersion,user" > "$REPORT_CSV"
jq -r '.devices[] | [
  .id,
  .hostname,
  (if .online then "true" else "false" end),
  (if (.authorized // true) then "true" else "false" end),
  (.lastSeen // ""),
  (.addresses | join(";")),
  ((.tags // []) | join(";")),
  (.os // ""),
  (.clientVersion // ""),
  (.user // "")
] | @csv' <<<"$RAW_JSON" >> "$REPORT_CSV"

echo "== Wrote JSON: $REPORT_JSON"
echo "== Wrote CSV:  $REPORT_CSV"
echo

# Print table
print_header
jq -r '.devices[] | "\(.id)  \(.hostname)  \(.online)  \((.authorized // true))  \(.lastSeen // "")  \(((.tags // []) | join(";")))"' \
  <<<"$RAW_JSON" | while IFS= read -r line; do
  # pretty align columns (best effort)
  id="$(awk '{print $1}' <<<"$line")"
  host="$(awk '{print $2}' <<<"$line")"
  online="$(awk '{print $3}' <<<"$line")"
  auth="$(awk '{print $4}' <<<"$line")"
  last="$(awk '{print $5}' <<<"$line")"
  tags="$(cut -d' ' -f6- <<<"$line")"
  printf "%-20s  %-40s  %-8s  %-10s  %-20s  %s\n" "$id" "$host" "$online" "$auth" "$last" "$tags"
done
echo

# Determine deletion candidates
echo "== Evaluating deletion candidates (offline AND lastSeen older than ${DAYS} days)"
: > "$CANDIDATES"

jq -r '.devices[] | @base64' <<<"$RAW_JSON" | while read -r row; do
  d() { echo "$row" | base64 -d | jq -r "$1"; }
  id="$(d '.id')"
  host="$(d '.hostname')"
  online="$(d '.online')"
  last="$(d '.lastSeen // empty')"
  tags="$(d '(.tags // []) | join(";")')"

  # Skip if online
  [[ "$online" == "true" ]] && continue

  # Protect by name
  if [[ "$host" =~ $PROTECT_NAME_REGEX ]]; then
    continue
  fi
  # Protect by tag
  if [[ -n "$tags" && "$tags" =~ $PROTECT_TAG_REGEX ]]; then
    continue
  fi

  # If no lastSeen, consider stale
  days_old="9999"
  if [[ -n "$last" ]]; then
    days_old="$(age_days "$last" || echo "9999")"
  fi

  # Compare float with awk
  older="$(awk -v a="$days_old" -v b="$DAYS" 'BEGIN{print (a>b) ? "yes" : "no"}')"
  if [[ "$older" == "yes" ]]; then
    printf "%s\n" "$id" >> "$CANDIDATES"
    printf "  - %-40s  lastSeen=%-20s  age=%s days  tags=%s\n" "$host" "$last" "$days_old" "$tags"
  fi
done

if [[ -s "$CANDIDATES" ]]; then
  echo
  echo "== Candidates file: $CANDIDATES"
  echo "   (These look safe to delete: offline & older than ${DAYS}d, not operator/k8s/proxy)"
else
  echo "== No deletion candidates found under current rules."
fi

# Deletion flow
if [[ "$DELETE" == "1" && -s "$CANDIDATES" ]]; then
  echo
  echo "== Deletion requested (DELETE=1). Candidates:"
  nl -ba "$CANDIDATES"

  if [[ "$FORCE" != "1" ]]; then
    read -r -p "Proceed to DELETE these devices from your tailnet? (y/N): " ans
    [[ "${ans:-N}" =~ ^[Yy]$ ]] || { echo "Aborting deletion."; exit 0; }
  fi

  while IFS= read -r dev; do
    echo "Deleting device: $dev"
    curl -sS -X DELETE -u "${TS_API_KEY}:" "${API}/device/${dev}" -o /dev/null -w "%{http_code}\n" \
      | grep -qE '^(200|204)$' || { echo "  ! Failed to delete ${dev}"; }
  done < "$CANDIDATES"

  echo "== Deletion pass complete."
fi

echo
echo "Done. Tips:"
echo "  - Adjust DAYS=, PROTECT_NAME_REGEX=, PROTECT_TAG_REGEX= to tune selection."
echo "  - Set DELETE=1 to actually delete, FORCE=1 to skip prompt."
echo "  - Outputs are in ${OUTDIR}/ (devices.json, devices.csv, candidates.txt)."
