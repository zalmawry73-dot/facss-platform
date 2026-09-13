# Training Module & Academy Architecture

---

## 1. Academy Mission & Vision
In alignment with the center's developmental mission:
- Open specialized training pathways for Yemeni youth in guarding, VIP protection, civil defense, OHS occupational safety, and tactical first aid.
- Partnerships with regional and international initiative sponsors (e.g. AGFUND and peer organizations).

---

## 2. Course Lifecycle
1. **Curriculum Design (`Course`):**
   - Title (AR / EN), detailed syllabus, trainer credentials, duration, capacity, location.
   - Status: `OPEN`, `FULL`, `ONGOING`, `COMPLETED`, `DRAFT`.
2. **Student Enrollment (`TrainingRegistration`):**
   - Trainee submits application online.
   - Initial status: `PENDING` -> Reviewed by Academy Director -> `ACCEPTED` / `REJECTED`.
3. **Session Attendance Tracking (`AttendanceRecord`):**
   - Instructors log attendance per session (`PRESENT`, `ABSENT`, `EXCUSED`).
4. **Graduation & Certification (`Certificate`):**
   - Automatically issues digital certificate with unique reference ID (`FACSS-CERT-YYYY-XXXX`) and verification hash.
