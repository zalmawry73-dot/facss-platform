# Administrator Guide & Content Management System (FACSS CMS)

---

## 1. Accessing the Management Console
Navigate to `http://localhost:3000/login` and sign in with an administrative account (e.g. `admin@facss-aden.com` or `services@facss-aden.com`).
The system will automatically direct you to `/admin`.

---

## 2. Managing Service Requests
1. Navigate to **إدارة طلبات الخدمات** (`/admin/requests`).
2. Search requests by reference code (`FACSS-SR-YYYY-XXXXXX`) or client entity name.
3. Click **إدارة وتحديث** on any request to open the operational update modal.
4. **Update Status:** Change status through the 9 lifecycle stages (`NEW`, `UNDER_REVIEW`, `APPROVED`, `IN_PROGRESS`, `REPORT_READY`, `COMPLETED`, etc.).
5. **Add Progress Notes:**
   - Check *"إظهار هذه الملاحظة للعميل"* to make the update visible to the client in their portal.
   - Leave unchecked for private internal dispatch instructions.

---

## 3. Training & Academy Administration
1. Navigate to **قطاع التدريب والدورات** (`/admin/training`).
2. View course rosters, participant limits, and enrollment statuses.
3. Review pending trainee applications, mark attendance, and generate verified digital completion certificates.

---

## 4. Strategic Studies & Research Publishing
1. Navigate to **الدراسات والأبحاث** (`/admin/research`).
2. Author papers and set visibility:
   - `PUBLIC`: Readable and downloadable by any website visitor.
   - `CLIENT_ONLY`: Restricted strictly to verified corporate clients.
   - `PRIVATE`: Internal draft.

---

## 5. System Settings & Contact Details
1. Navigate to **إعدادات النظام والاتصال** (`/admin/settings`).
2. Verify and manage institutional contact numbers, official emails, social media URLs, and slogans.
