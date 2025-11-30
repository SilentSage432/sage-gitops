# EXACT Trace: "Register YubiKey" Button Click

## Complete Call Chain with Line References

### 1. Entry Point
**File:** `onboarding/frontend/app/page.tsx`
- **Line 11:** `<YubiKeyGate />` component is rendered

### 2. Component Definition
**File:** `onboarding/frontend/components/YubiKeyGate.tsx`
- **Line 8:** `export function YubiKeyGate()`
- **Line 146-152:** The "Register YubiKey" button:
```tsx
<button
  onClick={handleRegister}  // ← Handler attached here
  disabled={status !== 'idle'}
  className="w-full px-4 py-3 bg-[#6366f1] hover:bg-[#585ae8] text-white rounded-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  Register YubiKey
</button>
```

### 3. Click Handler
**File:** `onboarding/frontend/components/YubiKeyGate.tsx`
- **Line 42:** `const handleRegister = async () => {`
- **Line 43:** `setStatus('registering');`
- **Line 47:** **CALLS:** `const result = await performWebAuthnRegistration();`

### 4. WebAuthn Registration Function
**File:** `onboarding/frontend/lib/api/auth.ts`
- **Line 130:** `export async function performWebAuthnRegistration(): Promise<{ success: boolean; deviceName?: string }> {`
- **Line 132:** **CALLS:** `const challengeResponse = await requestWebAuthnChallenge();`

### 5. Challenge Request Function
**File:** `onboarding/frontend/lib/api/auth.ts`
- **Line 46:** `export async function requestWebAuthnChallenge(): Promise<WebAuthnChallengeResponse> {`
- **Line 48:** **AXIOS CALL:** `const response = await axios.post('/api/auth/register/begin', { operator: 'prime' });`
- **URL:** `/api/auth/register/begin` (relative URL, proxied by Next.js)

### 6. Next.js Rewrite (Proxy)
**File:** `onboarding/frontend/next.config.ts`
- **Line 9-12:** Rewrite rule:
```typescript
{
  source: "/api/auth/:path*",
  destination: `${backendUrl}/api/auth/:path*`,  // → http://localhost:8081/api/auth/:path*
}
```
- **Proxies to:** `http://localhost:8081/api/auth/register/begin`

### 7. Go Backend Handler
**File:** `onboarding/backend/router.go`
- **Line 176:** Route registration: `r.Post("/register/begin", handleWebAuthnBegin)`

**File:** `onboarding/backend/webauthn_handlers.go`
- **Line 24:** `func handleWebAuthnBegin(w http.ResponseWriter, r *http.Request) {`
- **Line 39:** Gets operator: `user, err := handlers.GetOperatorKey(ctx, getDB(ctx), req.Operator)`
- **Line 62:** Generates challenge: `options, session, err := WAuth.BeginRegistration(user)`
- **Line 73:** Saves session: `SaveSession(ctx, req.Operator, session)`
- **Line 86:** Returns options: `json.NewEncoder(w).Encode(options)`

## Summary

**Button Location:**
- File: `onboarding/frontend/components/YubiKeyGate.tsx`
- Line: 146-152
- onClick: `handleRegister` (defined at line 42)

**Handler Chain:**
1. `handleRegister()` → `YubiKeyGate.tsx:42`
2. `performWebAuthnRegistration()` → `lib/api/auth.ts:130`
3. `requestWebAuthnChallenge()` → `lib/api/auth.ts:46`
4. `axios.post('/api/auth/register/begin')` → `lib/api/auth.ts:48`
5. Next.js rewrite → `next.config.ts:10`
6. Go backend → `webauthn_handlers.go:24` (`handleWebAuthnBegin`)

**Final URL:** `http://localhost:8081/api/auth/register/begin` (via Next.js proxy)

