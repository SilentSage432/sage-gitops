# WebAuthn Registration Path - Complete Static Analysis

## 1. ENDPOINT FLOW TRACE WITH LINE REFERENCES

### `/api/auth/register/begin`
**Router:** `onboarding/backend/router.go:176`
- Handler: `handleWebAuthnBegin` (`webauthn_handlers.go:24`)
- Flow:
  1. **Line 25-30:** Decode request → `RegistrationBeginRequest`
  2. **Line 32-36:** Check `WAuth` initialized
  3. **Line 39:** Get operator: `handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)`
     - **File:** `handlers/register.go:16`
     - **Query:** `SELECT credential FROM public.operators WHERE name = $1` (line 20)
     - **Table:** `operators` ✅
  4. **Line 62:** Call `WAuth.BeginRegistration(user)`
  5. **Line 73:** Save session: `SaveSession(ctx, req.Operator, session)`
     - **File:** `webauthn_handlers.go:180`
     - **Query:** `INSERT INTO public.operator_keys (id, user_id, session_data, created_at) ...` (line 189)
     - **Table:** `operator_keys` ⚠️ **SCHEMA MISMATCH** (see below)
  6. **Line 83:** Return options

### `/api/auth/register/finish`
**Router:** `onboarding/backend/router.go:177`
- Handler: `handleWebAuthnFinish` (`webauthn_handlers.go:100`)
- Flow:
  1. **Line 101-105:** Decode request → `RegistrationFinishRequest`
  2. **Line 108:** Get operator: `handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)`
     - **Table:** `operators` ✅
  3. **Line 115:** Load session: `LoadSession(ctx, req.Operator)`
     - **File:** `webauthn_handlers.go:198`
     - **Query:** `SELECT session_data FROM public.operator_keys WHERE user_id = $1 ...` (line 203)
     - **Table:** `operator_keys` ⚠️ **SCHEMA MISMATCH** (see below)
  4. **Line 144:** Call `WAuth.FinishRegistration(user, *sessionData, newReq)`
  5. **Line 151:** Save credential: `handlers.SaveOperatorKey(ctx, getDB(ctx), req.Operator, cred)`
     - **File:** `handlers/register.go:62`
     - **Query:** `INSERT INTO public.operators (name, credential, created_at) ...` (line 71)
     - **Table:** `operators` ✅

### `/api/auth/verify/begin`
**Router:** `onboarding/backend/router.go:178`
- Handler: `handleWebAuthnVerifyBegin` (`webauthn_handlers.go:247`)
- Flow:
  1. **Line 248-252:** Decode request → `VerifyBeginRequest`
  2. **Line 255:** Get operator: `handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)`
     - **Table:** `operators` ✅
  3. **Line 262:** Check credentials exist
  4. **Line 267:** Call `WAuth.BeginLogin(user)`
  5. **Line 273:** Save session: `SaveSession(ctx, req.Operator, session)`
     - **Table:** `operator_keys` ⚠️ **SCHEMA MISMATCH**

### `/api/auth/verify/finish`
**Router:** `onboarding/backend/router.go:179`
- Handler: `handleWebAuthnVerifyFinish` (`webauthn_handlers.go:284`)
- Flow:
  1. **Line 285-289:** Decode request → `VerifyFinishRequest`
  2. **Line 292:** Load session: `LoadSession(ctx, req.Operator)`
     - **Table:** `operator_keys` ⚠️ **SCHEMA MISMATCH**
  3. **Line 306:** Get operator: `handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)`
     - **Table:** `operators` ✅
  4. **Line 325:** Call `WAuth.FinishLogin(user, *sessionData, newReq)`

## 2. PERSISTENCE HELPER FUNCTIONS

### Active Functions:
- ✅ `handlers.GetOperatorKey()` - `handlers/register.go:16` - Uses `operators` table
- ✅ `handlers.SaveOperatorKey()` - `handlers/register.go:62` - Uses `operators` table
- ⚠️ `SaveSession()` - `webauthn_handlers.go:180` - Uses `operator_keys` table, **IGNORES ERRORS**
- ⚠️ `LoadSession()` - `webauthn_handlers.go:198` - Uses `operator_keys` table, **SILENT FAILURES**

### Deprecated/Unused Functions:
- ❌ `GetOperator()` - `webauthn_handlers.go:162` - Hardcoded, **NOT USED**
- ❌ `SaveCredential()` - `webauthn_handlers.go:223` - Uses `operator_keys.credential_data`, **NOT USED**
- ⚠️ `GetOperatorWithCredentials()` - `webauthn_handlers.go:341` - Wrapper, **NOT DIRECTLY USED**

## 3. DATABASE SCHEMA ANALYSIS

### `operator_keys` Table (from `onboarding/db/migrations/001_init.sql:10`)
```sql
CREATE TABLE IF NOT EXISTS public.operator_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    session_data JSONB,  -- ⚠️ CODE EXPECTS BYTEA/TEXT
    credential_data JSONB,  -- ⚠️ UNUSED (credentials go to operators table)
    device_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Code Expectations vs Schema:**
- ❌ **MISMATCH:** Code inserts `id` as TEXT (UUID string) at line 190, but schema expects UUID
- ❌ **MISMATCH:** Code expects `session_data` as BYTEA/TEXT, but schema has JSONB
- ✅ `user_id` matches (VARCHAR(255))
- ✅ `created_at` matches
- ✅ `updated_at` matches

### `operators` Table (from `onboarding/backend/db/migrations/2025_create_operator_table.sql:6`)
```sql
CREATE TABLE IF NOT EXISTS operators (
    name TEXT PRIMARY KEY,
    credential TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Status:** ✅ Matches code expectations perfectly

## 4. IDENTIFIED MISMATCHES

### CRITICAL MISMATCH #1: `operator_keys.id` Type Mismatch
- **Schema:** `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Code (line 190):** `uuid.New().String()` → TEXT string
- **Impact:** Will fail if table uses UUID type
- **Fix:** Either change schema to TEXT, or use UUID type in code

### CRITICAL MISMATCH #2: `operator_keys.session_data` Type Mismatch
- **Schema:** `session_data JSONB`
- **Code (line 192):** `sessionJSON` (JSON bytes) → Expects TEXT/BYTEA
- **Impact:** JSONB should work, but code doesn't handle JSONB properly
- **Fix:** Code should work with JSONB, but verify

### CRITICAL MISMATCH #3: Error Handling
- **`SaveSession()` line 188:** `_, _ = getDB(ctx).Exec(...)` - **IGNORES ALL ERRORS** ❌
- **`LoadSession()` line 202:** Returns `nil` on ANY error - **SILENT FAILURE** ❌
- **Impact:** Database errors are invisible, causing mysterious failures

### CRITICAL MISMATCH #4: Unused Functions
- `GetOperator()` - Not called anywhere
- `SaveCredential()` - Not called anywhere (writes to wrong table anyway)
- **Impact:** Code confusion, maintenance burden

## 5. ERROR TRACE: "Database error"

### Actual Error Points:

#### Error Point 1: `handlers.GetOperatorKey()` - Line 19
```go
err := db.QueryRow(ctx,
    "SELECT credential FROM public.operators WHERE name = $1",
    operatorName,
).Scan(&credentialJSON)
```
**Errors:**
- Table doesn't exist → `relation "operators" does not exist`
- **Handled:** Returns error to caller ✅

#### Error Point 2: `handlers.SaveOperatorKey()` - Line 70
```go
_, err = db.Exec(ctx,
    "INSERT INTO public.operators (name, credential, created_at) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET credential = $2",
    ...
)
```
**Errors:**
- Table doesn't exist → `relation "operators" does not exist`
- **Handled:** Returns error, logged at line 152 ✅

#### Error Point 3: `SaveSession()` - Line 188
```go
_, _ = getDB(ctx).Exec(ctx,
    "INSERT INTO public.operator_keys (id, user_id, session_data, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET session_data = $3, updated_at = $4",
    uuid.New().String(),  // ⚠️ TEXT, but schema expects UUID
    id,
    sessionJSON,  // ⚠️ JSON bytes, schema has JSONB
    time.Now(),
)
```
**Errors:**
- Table doesn't exist → **SILENT FAILURE** ❌
- Type mismatch (UUID vs TEXT) → **SILENT FAILURE** ❌
- **Handled:** Errors are IGNORED ❌

#### Error Point 4: `LoadSession()` - Line 202
```go
err := getDB(ctx).QueryRow(ctx,
    "SELECT session_data FROM public.operator_keys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    id,
).Scan(&sessionData)  // ⚠️ Expects []byte, but schema has JSONB
```
**Errors:**
- Table doesn't exist → Returns `nil` (silent) ❌
- Type mismatch → Returns `nil` (silent) ❌
- **Handled:** Returns `nil` on ANY error (silent failure) ❌

## 6. ROOT CAUSE ANALYSIS

### The "Database error" likely occurs at:
1. **`SaveSession()` line 188** - If `operator_keys` table doesn't exist or has wrong schema
2. **`LoadSession()` line 202** - If `operator_keys` table doesn't exist or has wrong schema
3. **`handlers.GetOperatorKey()` line 19** - If `operators` table doesn't exist
4. **`handlers.SaveOperatorKey()` line 70** - If `operators` table doesn't exist

### Most Likely Cause:
**`operator_keys` table schema mismatch:**
- Code expects `id TEXT`, schema has `id UUID`
- Code expects `session_data BYTEA/TEXT`, schema has `session_data JSONB`
- Code ignores errors, so failures are silent

## 7. HOLISTIC FIX REQUIRED

### Files to Modify:
1. `onboarding/backend/webauthn_handlers.go` - Fix error handling, remove unused functions, fix type handling
2. `onboarding/db/migrations/001_init.sql` - Verify schema matches code expectations
3. `onboarding/backend/db/migrations/2025_create_operator_table.sql` - Ensure migration exists

### Changes Needed:
1. ✅ Fix `SaveSession()` to return errors
2. ✅ Fix `LoadSession()` to return errors
3. ✅ Remove `GetOperator()` function
4. ✅ Remove `SaveCredential()` function
5. ✅ Fix `operator_keys` schema to match code (or vice versa)
6. ✅ Add proper error logging
7. ✅ Ensure both tables exist via migrations
