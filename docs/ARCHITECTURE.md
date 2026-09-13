# Technical Architecture: FACSS Digital Platform

---

## 1. Architectural Layers

The system follows a clean modular architecture separating presentation, server actions, business logic, data persistence, and security gates:

```
+-------------------------------------------------------------+
|                 Next.js App Router (14+)                    |
|   +-----------------------+     +-----------------------+   |
|   | Public Pages (SSR)    |     | Client & Trainee (CSR)|   |
|   +-----------------------+     +-----------------------+   |
|   +-----------------------------------------------------+   |
|   |            Admin Dashboard & CMS (SSR/CSR)          |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                     Security & Context                      |
|   +-----------------------+     +-----------------------+   |
|   | AuthContext & JWT     |     | LanguageContext (i18n)|   |
|   | (Role-Based RBAC)     |     | (Arabic RTL / EN LTR) |   |
|   +-----------------------+     +-----------------------+   |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                    REST API Endpoints                       |
|   /api/auth/*     /api/requests/*     /api/contact          |
|   /api/services   /api/courses        /api/research         |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                   Data Persistence Layer                    |
|   Prisma ORM (Schema, Migrations, Client, Seed Scripts)     |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                    PostgreSQL Database                      |
|   Normalized Schema with Foreign Keys, Indexes, Enums       |
+-------------------------------------------------------------+
```

---

## 2. Directory Structure
- `app/`: Next.js 14 App Router routes, layouts, and API endpoints.
  - `admin/`: CMS modules (Requests, Training, Research, Messages, Users, Settings, Logs).
  - `portal/client/`: Client portal views (Dashboard, Requests, Reports, Profile).
  - `portal/trainee/`: Trainee portal views (Dashboard, Courses, Certificates, Profile).
  - `api/`: REST handlers with input validation and security.
- `components/`: Reusable components (Header, Footer, Navigation).
- `contexts/`: React context providers (`AuthContext.tsx`, `LanguageContext.tsx`).
- `lib/`: Core helpers (`prisma.ts`, `auth.ts`, `i18n.ts`).
- `prisma/`: Prisma schema definition (`schema.prisma`).
- `scripts/`: Seeding and maintenance scripts (`seed.js`).
- `docs/`: Comprehensive technical and operational guides.
- `public/`: Static assets, brand emblems (`public/images/logo.png`), favicon.
