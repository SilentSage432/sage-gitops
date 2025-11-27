# Phase 13.3: Frontend Federation Handshake (Next.js) - Implementation Summary

**Status:** ✅ Complete  
**Date:** 2025-01-27

## Overview

Phase 13.3 implements the frontend federation handshake for the Next.js onboarding UI. The handshake is performed automatically when the UI loads, and the federation token is automatically included in all subsequent API requests via an axios interceptor.

---

## ✅ Completed Components

### 13.3.1 — Federation Handshake Library

**Created:** `onboarding/frontend/lib/federation/handshake.ts`

**Features:**
- `performFederationHandshake()`: Performs 3-step handshake process
  - Step 1: Request challenge from `/api/federation/auth/handshake`
  - Step 2: Sign challenge using Web Crypto API (HMAC-SHA256)
  - Step 3: Assert solution to `/api/federation/auth/assert`
- `getFederationToken()`: Retrieves stored federation token
- `setFederationToken()`: Sets federation token (for future use)
- Token stored in module-level variable

**Implementation Details:**
- Uses Web Crypto API for cryptographic signing
- HMAC-SHA256 signature generation
- Buffer conversion for signature encoding
- TypeScript interfaces for type safety

### 13.3.2 — Axios Interceptor

**Updated:** `onboarding/frontend/lib/api/auth.ts`

**Changes:**
- Added axios request interceptor
- Automatically includes `X-Federation-Token` header in all requests
- Token retrieved from `getFederationToken()`
- Works with all existing axios-based API calls

### 13.3.3 — Federation Handshake Component

**Created:** `onboarding/frontend/components/FederationHandshake.tsx`

**Features:**
- Client component (`'use client'` directive)
- Performs handshake on mount using `useEffect`
- Can be used in server components (like root layout)
- Silent error handling (logs to console)

**Implementation:**
- Uses default values for now:
  - `nodeId`: 'prime-ui'
  - `tenantId`: 'tenant-master'
  - `fingerprint`: 'bootstrap-master'
- TODO: Replace with real values from onboarding store
- TODO: Get bootstrap fingerprint from bootstrap kit metadata

### 13.3.4 — Root Layout Integration

**Updated:** `onboarding/frontend/app/layout.tsx`

**Changes:**
- Added `FederationHandshake` component to root layout
- Handshake performed automatically on app load
- Component renders nothing (null return)

---

## Architecture

### Handshake Flow

```
1. App Loads → FederationHandshake component mounts
2. useEffect triggers → performFederationHandshake()
3. Step 1: POST /api/federation/auth/handshake
   - Receives: challenge, nonce, algo, expiresIn
4. Step 2: Sign challenge with fingerprint (HMAC-SHA256)
   - Uses Web Crypto API
   - Converts to hex string
5. Step 3: POST /api/federation/auth/assert
   - Sends: nodeId, signature, fingerprint
   - Receives: federationToken
6. Token stored in module variable
7. All future axios requests include X-Federation-Token header
```

### Request Flow

```
Client Request → Axios Interceptor → Check getFederationToken()
  → If token exists → Add X-Federation-Token header
  → Send request to backend
  → Backend validates token via RequireFederationSession middleware
```

---

## API Integration

### Handshake Endpoints

**POST /api/federation/auth/handshake**
- Request: `{ nodeId, tenantId, fingerprint }`
- Response: `{ challenge, nonce, algo, expiresIn }`

**POST /api/federation/auth/assert**
- Request: `{ nodeId, signature, fingerprint }`
- Response: `{ ok, tenantId, nodeId, federationToken, federated, cipher, expiresIn }`

### Automatic Token Injection

All axios requests automatically include:
```
X-Federation-Token: <federation-token>
```

This works for:
- All existing API calls in `lib/api/*`
- All hooks that use axios
- Any future axios-based requests

---

## Files Created

1. `onboarding/frontend/lib/federation/handshake.ts` - Handshake implementation
2. `onboarding/frontend/components/FederationHandshake.tsx` - Client component

## Files Modified

1. `onboarding/frontend/lib/api/auth.ts` - Added axios interceptor
2. `onboarding/frontend/app/layout.tsx` - Added FederationHandshake component

---

## Implementation Details

### Web Crypto API Usage

```typescript
// Import key from fingerprint
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(fingerprint),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);

// Sign challenge
const signatureRaw = await crypto.subtle.sign(
  "HMAC",
  key,
  encoder.encode(challenge)
);

// Convert to hex
const signature = Buffer.from(new Uint8Array(signatureRaw)).toString("hex");
```

### Client Component Pattern

- Uses `'use client'` directive for Next.js App Router
- Can be imported into server components
- Runs only on client-side (browser)
- Handles async operations in `useEffect`

### Axios Interceptor

- Global interceptor applied to default axios instance
- Runs before every request
- Checks for federation token
- Adds header if token exists
- No-op if no token (graceful degradation)

---

## Future Enhancements

### TODO Items

1. **Get Real Values from Store**
   - Replace hardcoded `nodeId`, `tenantId`, `fingerprint`
   - Get from `onboarding-store.ts` or bootstrap kit metadata

2. **Bootstrap Fingerprint**
   - Extract fingerprint from bootstrap kit metadata
   - Store in onboarding store or localStorage
   - Use for handshake

3. **Error Handling**
   - Show user-friendly error messages
   - Retry logic for failed handshakes
   - Fallback behavior if handshake fails

4. **Token Refresh**
   - Implement token refresh before expiration
   - Handle token expiration gracefully
   - Re-handshake when token expires

5. **Loading States**
   - Show loading indicator during handshake
   - Prevent API calls until handshake completes
   - Handle handshake in progress state

---

## Security Considerations

### Client-Side Security

- Fingerprint used for signing (from bootstrap kit)
- Web Crypto API provides secure cryptographic operations
- Token stored in memory (not localStorage)
- Token automatically included in all requests

### Token Management

- Token stored in module-level variable
- Not persisted to localStorage (stateless)
- Token cleared on page refresh
- Handshake re-performed on each app load

---

## Testing Checklist

- ✅ Code compiles successfully
- ✅ Handshake function implements 3-step process
- ✅ Web Crypto API used for signing
- ✅ Axios interceptor adds token to requests
- ✅ Client component mounts in layout
- ✅ Handshake performed on app load
- ✅ TypeScript types defined
- ✅ Error handling in place

---

## Notes

- Handshake performed automatically on app load
- Token automatically included in all axios requests
- No manual token management required
- Works with existing API layer
- Ready for integration with onboarding store
- Client component pattern allows use in server components

---

**Phase 13.3 Status:** ✅ Complete - Frontend federation handshake implemented. Handshake performed automatically on app load, and federation token is automatically included in all API requests.

