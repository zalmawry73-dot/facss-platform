# Database Architecture & Entity Relationships (PostgreSQL)

---

## 1. Engine & Connectivity
- **Engine:** PostgreSQL 16
- **ORM:** Prisma Client
- **Configuration:** Connection string specified in `.env` under `DATABASE_URL`.
- **Default Port:** `5433` (isolated local development cluster) or `5432` (standard server).

---

## 2. Entity Model Definitions

### Core Entities:
1. `User`: Primary identity table storing credentials, names, roles, contact details, and relation to client profiles or assigned tickets.
2. `ClientProfile`: Extended corporate client details (company name, business sector, tax ID, verification status).
3. `ServiceCategory` & `Service`: Categorized catalog of operational security services and electronic systems.
4. `ServiceRequest`: Service request ticket with structured reference ID (`FACSS-SR-YYYY-XXXXXX`), priority, status, and description.
5. `ServiceRequestNote`: Timeline communication notes (internal vs client-visible).
6. `ServiceRequestDocument`: Confidential reports and assessment attachments.
7. `CourseCategory` & `Course`: Security training programs, capacities, trainers, and requirements.
8. `TrainingRegistration`: Student course enrollment status (`PENDING` -> `ACCEPTED` -> `COMPLETED`).
9. `AttendanceRecord`: Session attendance tracking (`PRESENT`, `ABSENT`, `EXCUSED`).
10. `Certificate`: Accredited completion certificate with unique verification code.
11. `ResearchCategory` & `ResearchPublication`: Strategic research papers and policy intelligence with visibility filters (`PUBLIC`, `CLIENT_ONLY`, `PRIVATE`).
12. `NewsArticle`: Center news and announcements.
13. `ContactMessage`: Inquiries submitted via the public contact form.
14. `Notification`: In-app alert system for clients, trainees, and staff.
15. `SystemSetting`: Key-value store for contact information, social links, slogans, and SEO meta tags.
16. `ActivityLog`: Immutable chronological audit log for institutional oversight.
