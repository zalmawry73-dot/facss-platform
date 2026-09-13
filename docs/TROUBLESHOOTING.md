# Troubleshooting & FAQ Guide

---

## Common Issues & Solutions

### 1. Database Connection Failed (`ECONNREFUSED 127.0.0.1:5433` or `5432`)
- **Cause:** PostgreSQL is not running or listening on a different port.
- **Solution:**
  - Check whether your PostgreSQL runs on port `5432` or `5433`.
  - Update `DATABASE_URL` in `.env` to match your active port.
  - Test connection:
    ```bash
    psql -h 127.0.0.1 -p 5433 -U postgres -d facss_db
    ```

### 2. Dependency Conflict on `npm install` (`ERESOLVE`)
- **Cause:** Peer dependency resolution strictness on newer npm versions.
- **Solution:**
  ```bash
  npm install --legacy-peer-deps
  ```

### 3. Prisma Client Out of Sync with Schema
- **Cause:** Schema was modified without regenerating client types.
- **Solution:**
  ```bash
  npx prisma generate
  ```

### 4. Admin Access Denied (`403 Forbidden` or Redirect)
- **Cause:** Logged-in user does not possess administrative role (`SUPER_ADMIN`, `ADMIN`, `*MANAGER`).
- **Solution:**
  - Log out and log in with `admin@facss-aden.com` or `services@facss-aden.com`.
  - Or use the 1-click demo login buttons on `/login`.
