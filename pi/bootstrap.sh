#!/bin/bash

MANIFEST=/etc/sage/manifest.json

if [ ! -f "$MANIFEST" ]; then
  echo "No manifest found. Cannot join federation."
  exit 1
fi

TOKEN=$(jq -r '.federationEnvelope.token // .federation.token // empty' "$MANIFEST")

if [ -z "$TOKEN" ]; then
  echo "No federation token found in manifest."
  exit 1
fi

FEDERATION_API="${FEDERATION_API:-http://federation-api.arc/federation}"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"federation\":{\"token\":\"$TOKEN\"}}" \
  "$FEDERATION_API/auth/node/join")

if [ $? -eq 0 ]; then
  echo "✔ Node joined federation successfully"
  echo "$RESPONSE" | jq .
else
  echo "✗ Failed to join federation"
  exit 1
fi
