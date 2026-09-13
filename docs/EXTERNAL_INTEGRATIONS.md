# External Services & Integrations Setup Guide

This document outlines all external service integrations, their current local/development implementation, and precise instructions for connecting live production credentials without modifying source code.

---

## 1. Master Integration Matrix

| Integration | Purpose | Required in Prod? | Current Dev Implementation | Environment Variables | Where to Obtain Credentials | Configuration Location | How to Test | Production Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Database** | Primary Relational Data Storage | **Yes** | PostgreSQL 16 (Port 5433 cluster) | `DATABASE_URL` | Cloud DB (AWS RDS, Supabase, Neon, or on-premise PostgreSQL) | `.env` | Run `npx prisma db push` | Ensure SSL mode is enabled (`?sslmode=require`) |
| **Authentication** | Session & Access Control | **Yes** | Local JWT (`jose` + `bcryptjs`) | `AUTH_SECRET` | Generate random 32+ character hex or base64 string | `.env` | Login with demo accounts | Generate unique secret per environment |
| **File Storage** | Documents, Reports, Media | Optional (Local works) | Local disk storage (`public/uploads`, `storage/secure_docs`) | `STORAGE_DRIVER`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | AWS S3, Cloudflare R2, or MinIO | `.env` | Upload document in request editor | Restrict bucket public access for sensitive reports |
| **Email SMTP** | Transactional & Status Alerts | Recommended | Development logging | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | SendGrid, Mailgun, Amazon SES, or custom corporate SMTP | `.env` | Trigger request status change | Use SPF and DKIM DNS records for deliverability |
| **SMS Gateway** | Urgent Security Alerts | Optional | Development mock | `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID` | Twilio, Unifonic, or local Yemeni Telecom | `.env` | Submit urgent ticket | Register formal sender ID `FACSS` |
| **WhatsApp Business** | Instant Client Updates | Optional | Development mock | `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID` | Meta for Developers / WhatsApp Cloud API | `.env` | Dispatch ticket status update | Requires Meta business verification |
| **Google Maps** | Headquarters Geo-Location | Optional | CSS styled coordinate badge | `NEXT_PUBLIC_MAPS_API_KEY` | Google Cloud Console | `.env` | View contact page | Embed iframe or Leaflet map |
| **Web Analytics** | Traffic & Usage Metrics | Optional | Disabled | `NEXT_PUBLIC_ANALYTICS_ID` | Plausible, Google Analytics 4 | `.env` | Load homepage | Use privacy-preserving self-hosted analytics |
