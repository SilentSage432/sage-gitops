#!/usr/bin/env bash
set -euo pipefail

### ====== EDIT THESE FOR YOUR ENV ====== ###
# Talos node (API) IP or DNS for your SAGE machine:
export TALOS_NODE="192.168.1.117"
# Public or LAN IP/hostname for SAGE that your Mac can reach for WG Endpoint:
export SAGE_ENDPOINT="192.168.1.117"
# WireGuard UDP port to use:
export WG_PORT="51820"
### ===================================== ###

# Sanity checks
command -v talosctl >/dev/null || { echo "talosctl not found. Install & configure Talos credentials."; exit 1; }
command -v wg >/dev/null || command -v wg-quick >/dev/null || { echo "wireguard-tools not found. On mac: brew install wireguard-tools"; exit 1; }
mkdir -p /tmp/sage-wg
cd /tmp/sage-wg

echo "==> Generating WireGuard keypairs (Laptop & SAGE)…"
# Laptop keypair
umask 077
wg genkey | tee laptop.priv | wg pubkey > laptop.pub
# SAGE keypair (we generate here, then inject into Talos config)
wg genkey | tee sage.priv   | wg pubkey > sage.pub

# Base64 encode SAGE private key for Talos machineconfig
SAGE_PRIV_B64="$(base64 -w0 < sage.priv 2>/dev/null || base64 < sage.priv)"
SAGE_PUB="$(cat sage.pub)"
LAPTOP_PUB="$(cat laptop.pub)"
LAPTOP_PRIV="$(cat laptop.priv)"

# Chosen point-to-point /30
WG_SAGE_IP="10.99.0.1/30"
WG_LAPTOP_IP="10.99.0.2/30"

echo "==> Creating Talos patch for wg0…"
cat > talos-wg0-patch.yaml <<YAML
# Talos machineconfig patch to add WireGuard wg0
# Safe: additive; does not replace existing interfaces
network:
  interfaces:
    - interface: wg0
      addresses: ["${WG_SAGE_IP}"]
      mtu: 1420
      wireguard:
        privateKey: "${SAGE_PRIV_B64}"
        listenPort: ${WG_PORT}
        peers:
          - publicKey: "${LAPTOP_PUB}"
            allowedIPs:
              - "10.99.0.2/32"
            persistentKeepalive: 15
YAML

echo "==> Applying Talos machineconfig patch (wg0)…"
talosctl --nodes "${TALOS_NODE}" patch mc --mode=no-reboot --patch @talos-wg0-patch.yaml
echo "==> Restarting networkd to apply wg0 (no full reboot)…"
talosctl --nodes "${TALOS_NODE}" service restart networkd
sleep 3
echo "==> Verifying wg interface on SAGE…"
talosctl --nodes "${TALOS_NODE}" read /proc/net/dev | grep -E '(^| )wg0:' || echo "Note: wg0 will appear after first handshake."

echo "==> Writing Laptop wg0.conf…"
/usr/bin/env mkdir -p /usr/local/etc/wireguard
cat > /usr/local/etc/wireguard/wg0.conf <<CONF
# SAGE <-> Laptop point-to-point mesh
[Interface]
Address = ${WG_LAPTOP_IP}
PrivateKey = ${LAPTOP_PRIV}
# (Optional) DNS = 10.99.0.1

[Peer]
PublicKey = ${SAGE_PUB}
AllowedIPs = 10.99.0.1/32
Endpoint = ${SAGE_ENDPOINT}:${WG_PORT}
PersistentKeepalive = 15
# OPTIONAL: If you want to reach cluster ranges through SAGE later,
# add them to AllowedIPs and enable forwarding on SAGE:
# AllowedIPs = 10.99.0.1/32, 10.244.0.0/16, 10.96.0.0/12
CONF

echo "==> Bringing wg0 up on the Laptop…"
sudo wg-quick down wg0 >/dev/null 2>&1 || true
sudo wg-quick up wg0

echo "==> Quick handshake check (Laptop view)…"
wg show

echo "==> Ping test Laptop -> SAGE wg IP…"
ping -c 3 10.99.0.1 || echo "Ping may fail until first WG handshake completes; continue."

echo "==> Optional: test SAGE UI via current method (port-forward stays the same)"
echo "    If you already run: kubectl -n arc-ui port-forward svc/sage-enterprise-ui 8080:8080"
echo "    then open: http://localhost:8080"

echo "==> Done. Laptop wg0 is up. If you need to stop later:  sudo wg-quick down wg0"

# ---- ROLLBACK SNIPPETS (only if you decide to remove wg0 later) ----
cat > /tmp/sage-wg/ROLLBACK_REMOVE_WG0.yaml <<'ROLL'
# Remove wg0 interface from Talos if needed
# Use talosctl to patch with this removal
network:
  interfaces:
    - interface: wg0
      remove: true
ROLL

echo
echo "Rollback instructions (if ever needed):"
echo "  talosctl --nodes ${TALOS_NODE} patch mc --mode=no-reboot --patch @/tmp/sage-wg/ROLLBACK_REMOVE_WG0.yaml"
echo "  talosctl --nodes ${TALOS_NODE} service restart networkd"
echo "  sudo wg-quick down wg0"
