# FACSS Corporate Platform — Project Overview
**مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية**
*Aden First Center for Security Services and Strategic Studies*

---

## 1. Executive Mission & Identity
FACSS is a specialized Yemeni corporate and strategic security entity headquartered in Aden, delivering a unified ecosystem of operational security services, electronic defense systems, tactical training programs, and strategic research intelligence.

- **Primary Motto (Arabic):** «أمانٌ يبدأ من عدن»
- **Primary Motto (English):** First in Security, First in Trust
- **Institutional Subtitle:** منظومةٌ أمنيةٌ متكاملة: من التدريب إلى الحراسات، إلى التحليل الأمني وتقييم المخاطر، والأبحاث والدراسات الأمنية والاستراتيجية (Comprehensive Security Ecosystem: From Training to Guarding, to Security Analysis & Risk Assessment, and Strategic & Security Research).
- **Headquarters:** عدن، الجمهورية اليمنية (Aden, Republic of Yemen).

---

## 2. Platform Architecture & Portals
The platform is engineered into four interconnected environments:
1. **Public Corporate Website:** Multi-lingual (Arabic RTL / English LTR), showcasing institutional profile, 6 preventive pillars, service catalog, electronic defense systems, training academy, research center, methodology, and direct service quote requests.
2. **Client Portal (`/portal/client`):** Secure authenticated hub for authorized corporate clients to track real-time field request lifecycles (`FACSS-SR-YYYY-XXXXXX`), review progress timelines, communicate with assigned operations officers, and download confidential risk assessments.
3. **Trainee Portal (`/portal/trainee`):** Dedicated portal for students and security personnel enrolled in the training academy to track curriculum progress, log attendance, and view verified digital certificates of completion.
4. **Administration Console / CMS (`/admin`):** Full-featured management console featuring live database analytics, service requests management, training courses administration, strategic research publishing, contact inquiries inbox, RBAC user role assignments, and immutable audit logs.

---

## 3. Technology Stack
- **Full-Stack Framework:** Next.js 14+ (App Router, React 18, TypeScript)
- **Database & ORM:** PostgreSQL (via Prisma ORM)
- **Styling Architecture:** Bespoke Vanilla CSS Design System with CSS custom properties, Dark Green (`#0B2518`) & Imperial Gold (`#C59B27`) brand identity, glassmorphism, micro-animations, and full RTL/LTR logical property alignment.
- **Authentication:** Local JWT session engine via signed `httpOnly` secure cookies with bcryptjs password hashing and role-based access control (RBAC).
