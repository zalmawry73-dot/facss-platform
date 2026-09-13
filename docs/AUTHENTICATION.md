# Authentication Architecture & Local Development Setup

---

## 1. Zero External Lock-in Architecture
In strict compliance with project governance:
- **No external provider accounts** (Google OAuth, Auth0, Clerk, Firebase, Supabase) have been created on behalf of the owner.
- The platform features an **independent, self-contained local authentication engine** powered by cryptographically signed JWT tokens and bcrypt password hashing.
- Tokens are stored in secure, `httpOnly`, `sameSite=lax` cookies (`facss_session_token`), mitigating XSS token theft.

---

## 2. Token Specification & Security
- **Algorithm:** HMAC-SHA256 (`HS256`) via `jose` library.
- **Payload Schema:**
  ```json
  {
    "userId": "cm1...",
    "email": "user@example.com",
    "fullName": "Name",
    "role": "CLIENT",
    "organization": "Company",
    "iat": 1726160000,
    "exp": 1726764800
  }
  ```
- **Session Duration:** 7 days.
- **Password Security:** Salted hashes generated with bcrypt (cost factor 10).

---

## 3. Production OAuth / SSO Readiness
If the owner chooses to integrate an enterprise identity provider in the future (e.g. Microsoft Azure AD, Google Workspace SSO, or Keycloak):
1. Pre-configured environment variables exist in `.env.example`:
   ```env
   AUTH_PROVIDER_ID=""
   AUTH_PROVIDER_SECRET=""
   ```
2. Integration adapters can be placed in `lib/auth.ts` without altering the core database schema or RBAC permission gates.
