# Tailscale Device Audit & Cleanup Script

A comprehensive script to audit and clean up stale Tailscale devices from your tailnet.

## Features

- **Device Audit**: Lists all devices with hostname, online status, last seen, tags
- **CSV Export**: Generates detailed CSV report for analysis
- **Smart Filtering**: Identifies deletion candidates based on configurable rules
- **Safety First**: Protects operator, proxy, and tagged devices by default
- **Confirmation**: Interactive confirmation before deletion
- **CI Mode**: Non-interactive mode for automation

## Prerequisites

- `curl` - for API calls
- `jq` - for JSON processing  
- `python3` - for reliable date math
- Tailscale API key with device management permissions

## Setup

1. **Get API Key**:
   - Go to https://login.tailscale.com/admin/settings/keys
   - Create a new API key with "Devices" scope
   - Copy the key (starts with `tskey-`)

2. **Set Environment Variables**:
   ```bash
   export TS_API_KEY="tskey-xxxxxxxxxxxxxxxx"
   export TS_TAILNET="yourname.github"  # or orgname.github
   ```

## Usage Examples

### 1. Dry Run (Recommended First)
```bash
# Basic audit - shows all devices and candidates
bash scripts/tailscale_clean.sh
```

### 2. Tune Parameters
```bash
# Consider devices stale after 21 days instead of 14
DAYS=21 bash scripts/tailscale_clean.sh

# Protect specific hostname patterns
PROTECT_NAME_REGEX='(operator|omega|grafana|core-node)' bash scripts/tailscale_clean.sh

# Protect specific tag patterns  
PROTECT_TAG_REGEX='(^tag:k8s|^tag:critical|^tag:ops)' bash scripts/tailscale_clean.sh
```

### 3. Delete with Confirmation
```bash
# Review candidates and delete with confirmation prompt
DAYS=21 DELETE=1 bash scripts/tailscale_clean.sh
```

### 4. Non-Interactive (CI/Automation)
```bash
# Delete without prompts (use with caution!)
DAYS=30 DELETE=1 FORCE=1 bash scripts/tailscale_clean.sh
```

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `DAYS` | `14` | Consider stale if offline AND older than N days |
| `OUTDIR` | `./tailscale_audit` | Output directory for reports |
| `PROTECT_NAME_REGEX` | `'(tailscale-operator\|ts-operator\|operator\|svc-\|proxy\|k8s)'` | Hostname patterns to protect |
| `PROTECT_TAG_REGEX` | `'(^tag:k8s\|tag:k8s-operator)'` | Tag patterns to protect |
| `DELETE` | `0` | Set to `1` to enable deletion |
| `FORCE` | `0` | Set to `1` to skip confirmation prompts |

## Output Files

The script generates several files in the output directory:

- **`devices.json`** - Full JSON export of all devices
- **`devices.csv`** - CSV report for spreadsheet analysis
- **`candidates.txt`** - List of device IDs marked for deletion

## Safety Features

### Protected Devices
The script automatically protects:
- **Operator devices**: `tailscale-operator`, `ts-operator`, `operator`
- **Service devices**: `svc-*`, `proxy`, `k8s`
- **Tagged devices**: `tag:k8s*`, `tag:k8s-operator`

### Deletion Criteria
Devices are only considered for deletion if they are:
1. **Offline** (not currently connected)
2. **Older than threshold** (lastSeen > DAYS)
3. **Not protected** (don't match protection regexes)

## Example Output

```
== Fetching Tailscale devices for tailnet: yourname.github
== Wrote JSON: ./tailscale_audit/devices.json
== Wrote CSV:  ./tailscale_audit/devices.csv

DEVICE_ID             HOSTNAME                                    ONLINE    AUTHORIZED  LAST_SEEN              TAGS
------------------------------------------------------------------------------------------------------------------------------------------
d1234567890           my-laptop                                   true      true        2025-10-26T04:00:00Z   tag:personal
d0987654321           old-device                                  false     true        2025-09-01T12:00:00Z   
d5555555555           tailscale-operator-abc123                   false     true        2025-10-20T08:00:00Z   tag:k8s-operator

== Evaluating deletion candidates (offline AND lastSeen older than 14 days)
  - old-device                                    lastSeen=2025-09-01T12:00:00Z  age=55.67 days  tags=

== Candidates file: ./tailscale_audit/candidates.txt
   (These look safe to delete: offline & older than 14d, not operator/k8s/proxy)
```

## Advanced Usage

### Custom Protection Rules
```bash
# Protect devices with specific patterns
PROTECT_NAME_REGEX='(omega|grafana|loki|promtail)' \
PROTECT_TAG_REGEX='(^tag:production|^tag:critical)' \
bash scripts/tailscale_clean.sh
```

### Batch Operations
```bash
# Clean up very old devices (60+ days)
DAYS=60 DELETE=1 bash scripts/tailscale_clean.sh

# Aggressive cleanup (7 days)
DAYS=7 DELETE=1 bash scripts/tailscale_clean.sh
```

### Integration with CI/CD
```bash
# Weekly cleanup job
#!/bin/bash
export TS_API_KEY="$TAILSCALE_API_KEY"
export TS_TAILNET="$TAILSCALE_TAILNET"
DAYS=30 DELETE=1 FORCE=1 bash scripts/tailscale_clean.sh
```

## Troubleshooting

### Common Issues

1. **"Missing dependency: jq"**
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt install jq
   ```

2. **"Invalid JSON from Tailscale API"**
   - Check your API key permissions
   - Verify tailnet name format (user.github or org.github)

3. **"Failed to delete device"**
   - Check API key has device deletion permissions
   - Verify device ID is correct

### Debug Mode
```bash
# Enable verbose output
set -x
bash scripts/tailscale_clean.sh
```

## Security Notes

- API keys are sensitive - store securely
- Review candidates carefully before deletion
- Use dry run mode first to understand impact
- Consider protecting production devices with specific tags

## Contributing

To improve the script:
1. Test with dry runs first
2. Use protection patterns for your environment
3. Submit improvements via pull request
