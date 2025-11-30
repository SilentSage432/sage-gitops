# WebAuthn 500 Error - Complete Trace

## Click Flow Trace

### 1. Click → Component
**File:** `onboarding/frontend/app/page.tsx:11`
- Component: `<YubiKeyGate />`

### 2. Component → Handler
**File:** `onboarding/frontend/components/YubiKeyGate.tsx:147`
- Button: "Register YubiKey" (line 151)
- onClick: `handleRegister` (line 147)
- Handler: `handleRegister()` function (line 42)

### 3. Handler → API Call
**File:** `onboarding/frontend/components/YubiKeyGate.tsx:47`
- Calls: `performWebAuthnRegistration()` from `@/lib/api/auth`

### 4. API Function → URL
**File:** `onboarding/frontend/lib/api/auth.ts:73-75`
- Function: `performWebAuthnRegistration()`
- Calls: `requestWebAuthnChallenge()` (line 75)

**File:** `onboarding/frontend/lib/api/auth.ts:46-48`
- Function: `requestWebAuthnChallenge()`
- URL: `${API_BASE_URL}/v1/init/webauthn/challenge`
- API_BASE_URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'` (line 5)
- **ACTUAL URL:** `http://localhost:8080/v1/init/webauthn/challenge` ❌

### 5. Server Handler
**PROBLEM:** No Next.js API route exists for `/v1/init/webauthn/challenge`
- This endpoint doesn't exist in the Next.js app
- Axios is trying to call `http://localhost:8080/v1/init/webauthn/challenge`
- This likely returns 500 because:
  - Port 8080 might not be running
  - Or there's a Next.js API route that's failing
  - Or it's hitting a different backend that doesn't have this endpoint

## Root Cause

The `YubiKeyGate` component uses the OLD WebAuthn API (`/v1/init/webauthn/challenge`) which:
1. Points to port 8080 (not 8081 where Go backend runs)
2. Uses a different endpoint path (`/v1/init/webauthn/challenge` vs `/api/auth/register/begin`)
3. Expects a different response format

The NEW `RegisterYubiKey` component correctly uses:
- Direct Go backend URL: `http://localhost:8081/api/auth/register/begin`
- Or Next.js rewrite: `/api/auth/register/begin` → `http://localhost:8081/api/auth/register/begin`

## Solution

Update `YubiKeyGate` component to use the working Go backend endpoints via Next.js rewrites:
- `/api/auth/register/begin` (already configured in next.config.ts)
- `/api/auth/register/finish` (already configured in next.config.ts)

