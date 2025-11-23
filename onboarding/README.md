# SAGE Onboarding System

Complete onboarding system with hardware authentication (YubiKey), wizard flow, and bootstrap kit delivery.

## Structure

```
onboarding/
├── frontend/      # Next.js 14 + TypeScript + Tailwind CSS
├── backend/       # Go service with WebAuthn + JWT
└── db/
    └── migrations/  # PostgreSQL migrations
```

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd onboarding/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Run development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Backend Setup

1. Navigate to backend directory:
```bash
cd onboarding/backend
```

2. Install Go dependencies:
```bash
go mod download
```

3. Set environment variables:
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/sage_os?search_path=public"
export PORT=8080
export JWT_PRIVATE_KEY=""  # Optional: base64-encoded RSA private key
```

4. Run the service:
```bash
go run main.go handlers.go
```

The backend will be available at `http://localhost:8080`

## Database Setup

1. Ensure PostgreSQL is running with database `sage_os`:
```bash
psql -d sage_os
```

2. Set search_path to public:
```sql
SET search_path TO public;
```

3. Run migrations:
```bash
psql -d sage_os -f db/migrations/001_init.sql
```

## Security Requirements

- ✅ Only external YubiKey allowed (no platform passkeys)
- ✅ Single registered device (Tyson only)
- ✅ OCT tokens expire after 10 minutes
- ✅ Full audit logging
- ✅ No password fallback

## Routes

### Frontend Routes

- `/` - Landing page with YubiKey gate
- `/initiator` - Initiator dashboard (requires OCT)
- `/wizard` - Redirects to `/wizard/company`
- `/wizard/company` - Company information step
- `/wizard/data` - Data regions selection
- `/wizard/agents` - Agent plan selection
- `/wizard/access` - Access model configuration
- `/wizard/review` - Review and submit
- `/wizard/complete` - Completion with kit delivery

### Backend Endpoints

- `POST /v1/init/webauthn/challenge` - Initiate WebAuthn challenge
- `POST /v1/init/webauthn/verify` - Verify WebAuthn credential
- `POST /rho2/auth/issue` - Issue Operator Capability Token (OCT)
- `POST /rho2/auth/verify` - Verify OCT token
- `POST /tenants` - Create tenant (requires OCT with `tenant.create` scope)
- `POST /bootstrap/kit` - Download bootstrap kit (requires OCT with `bootstrap.sign` scope)
- `GET /bootstrap/meta` - Get bootstrap metadata (requires OCT)
- `GET /health` - Health check

## OCT Scopes

- `tenant.create` - Create new tenants
- `agent.plan.create` - Create agent plans
- `bootstrap.sign` - Sign and download bootstrap kits

## Celestial Glass Theme

The UI uses a "Celestial Glass" theme with:
- Soft pearl white background (`#f8fafc`)
- Frosted glass surfaces with backdrop blur
- 24px rounded corners
- Soft radiance glow on focus elements

## Development Notes

- Frontend state is persisted in localStorage via Zustand
- OCT tokens are stored in localStorage (never persist secrets)
- All database operations use `public` schema
- WebAuthn only allows cross-platform authenticators
- User verification is required

