# Phase 1.2: API Routing Standardization - Implementation Summary

## ✅ COMPLETED

### Backend Changes

1. **Updated Router** (`main.go`)
   - Added new `/api/onboarding/*` route namespace
   - Kept legacy routes for backward compatibility:
     - `/tenants` → `handleCreateTenant`
     - `/bootstrap/kit` → `handleBootstrapKit`
     - `/bootstrap/meta` → `handleBootstrapMeta`

2. **New Standardized Routes** (`main.go`)
   - `POST /api/onboarding/tenants` → `handleCreateTenant`
   - `POST /api/onboarding/bootstrap/kit` → `handleBootstrapKit`
   - `GET /api/onboarding/bootstrap/meta` → `handleBootstrapMeta`
   - `POST /api/onboarding/bootstrap/verify` → `handleBootstrapVerify` (stub)
   - `GET /api/onboarding/agents` → `handleListAgents` (stub)
   - `GET /api/onboarding/regions` → `handleListRegions` (stub)

3. **New Stub Handlers** (`handlers.go`)
   - `handleListAgents()` - Returns list of agents from database or hardcoded fallback
   - `handleListRegions()` - Returns hardcoded list of regions
   - `handleBootstrapVerify()` - Verifies bootstrap kit fingerprint (stub with database check)

### Frontend Changes

1. **KitDeliveryPanel.tsx**
   - Updated: `/bootstrap/kit` → `/api/onboarding/bootstrap/kit`
   - Updated: `/bootstrap/meta` → `/api/onboarding/bootstrap/meta`

2. **review/page.tsx** (Modern flow)
   - Updated: `/api/bootstrap/kit` → `/api/onboarding/bootstrap/kit`

3. **wizard/review/page.tsx** (Legacy flow)
   - Updated: `/tenants` → `/api/onboarding/tenants`

### Verification

- ✅ Backend compiles successfully (`go build`)
- ✅ No linter errors
- ✅ All frontend API calls updated to new paths
- ✅ Legacy routes maintained for backward compatibility

---

## API Endpoint Summary

### New Standardized Endpoints

| Method | Endpoint | Handler | Status |
|--------|----------|---------|--------|
| POST | `/api/onboarding/tenants` | `handleCreateTenant` | ✅ Full |
| POST | `/api/onboarding/bootstrap/kit` | `handleBootstrapKit` | ✅ Full |
| GET | `/api/onboarding/bootstrap/meta` | `handleBootstrapMeta` | ✅ Full |
| POST | `/api/onboarding/bootstrap/verify` | `handleBootstrapVerify` | ⚠️ Stub |
| GET | `/api/onboarding/agents` | `handleListAgents` | ⚠️ Stub |
| GET | `/api/onboarding/regions` | `handleListRegions` | ⚠️ Stub |

### Legacy Endpoints (Backward Compatibility)

| Method | Endpoint | Handler | Status |
|--------|----------|---------|--------|
| POST | `/tenants` | `handleCreateTenant` | ✅ Full |
| POST | `/bootstrap/kit` | `handleBootstrapKit` | ✅ Full |
| GET | `/bootstrap/meta` | `handleBootstrapMeta` | ✅ Full |

---

## Stub Handler Details

### `handleListAgents()`
- **Returns:** JSON array of agents
- **Logic:** 
  1. Tries to fetch from `public.agents` table
  2. Falls back to hardcoded list if database query fails
- **Response:**
  ```json
  {
    "agents": [
      {"id": "researcher", "name": "Researcher Agent", "description": "..."},
      ...
    ]
  }
  ```

### `handleListRegions()`
- **Returns:** JSON array of regions
- **Logic:** Hardcoded list (matches frontend)
- **Response:**
  ```json
  {
    "regions": [
      {"id": "us-east", "name": "US-East", "location": "..."},
      ...
    ]
  }
  ```

### `handleBootstrapVerify()`
- **Accepts:** `{"fingerprint": "sha256:...", "tenantId": "..."}`
- **Logic:**
  1. Checks `public.bootstrap_kits` table if it exists
  2. Falls back to basic validation (checks format)
- **Response (valid):**
  ```json
  {
    "valid": true,
    "message": "Bootstrap kit fingerprint verified"
  }
  ```
- **Response (invalid):**
  ```json
  {
    "valid": false,
    "message": "Bootstrap kit fingerprint not found or invalid"
  }
  ```

---

## Files Modified

### Backend
- ✅ `onboarding/backend/main.go` - Added new route namespace
- ✅ `onboarding/backend/handlers.go` - Added 3 stub handlers

### Frontend
- ✅ `onboarding/frontend/components/KitDeliveryPanel.tsx` - Updated API paths
- ✅ `onboarding/frontend/app/onboarding/review/page.tsx` - Updated API paths
- ✅ `onboarding/frontend/app/wizard/review/page.tsx` - Updated API paths

---

## Testing Instructions

### 1. Start Backend
```bash
cd onboarding/backend
go run .
```

### 2. Test New Endpoints
```bash
# List agents
curl http://localhost:8080/api/onboarding/agents

# List regions
curl http://localhost:8080/api/onboarding/regions

# Verify bootstrap (stub)
curl -X POST http://localhost:8080/api/onboarding/bootstrap/verify \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "sha256:test123"}'
```

### 3. Test Legacy Endpoints (Backward Compatibility)
```bash
# Should still work
curl -X POST http://localhost:8080/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{...}'
```

### 4. Test Frontend
1. Start frontend: `cd onboarding/frontend && npm run dev`
2. Complete onboarding flow
3. Verify all API calls use `/api/onboarding/*` paths
4. Check browser network tab for correct endpoints

---

## Next Steps

✅ **Phase 1.2 Complete** - API routing standardized

**Recommended Next:**
- Phase 2: Implement actual bootstrap kit generation
- Phase 3: Replace stub handlers with full implementations
- Phase 4: Add Next.js API route proxy (if needed for relative paths)

---

## Notes

- All frontend files now use standardized `/api/onboarding/*` paths
- Legacy routes maintained for backward compatibility
- Stub handlers return valid JSON responses to prevent frontend breakage
- Backend compiles and runs successfully

