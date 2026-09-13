# Environment Variables Reference

---

## Core Variables

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://postgres:postgres@localhost:5433/facss_db?schema=public` | **Yes** |
| `APP_URL` | Application base domain / URL | `http://localhost:3000` | **Yes** |
| `AUTH_SECRET` | 32+ character JWT secret string | `facss-aden-security-platform-dev-secret-key-2026-min-32-chars` | **Yes** |
| `STORAGE_DRIVER` | File storage driver (`local` or `s3`) | `local` | **Yes** |
| `STORAGE_PATH` | Local file storage path | `./storage` | **Yes** |

---

## Production External Services (Optional / As Needed)

| Service | Environment Variable | Purpose |
| :--- | :--- | :--- |
| **Email SMTP** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Sending transactional service ticket and course acceptance emails |
| **SMS Gateway** | `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID` | Critical emergency dispatch notifications |
| **WhatsApp Business** | `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID` | Direct client notifications |
| **Cloud S3 Storage** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | Offloading PDF downloads and media assets |
