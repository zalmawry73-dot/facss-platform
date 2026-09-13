# Role-Based Access Control (RBAC) Architecture

---

## 1. Role Hierarchy & Matrix

The platform enforces strict role-based access control at both the UI presentation layer and backend API routes:

| Role | Access Level | Permitted Operations |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Root Center Management | Complete system access, user management, audit logs, system settings, all modules |
| `ADMIN` | Senior Executive | Full operational oversight, service requests, training, studies, inbox |
| `SERVICE_MANAGER` | Security Operations Lead | Field requests dispatch, status updates, internal/client notes, cadre assignments |
| `TRAINING_MANAGER` | Academy Director | Courses administration, trainee applications review, attendance, certificate issuance |
| `RESEARCH_MANAGER` | Research Arm Editor | Authoring and publishing strategic studies, setting visibility (`PUBLIC`/`CLIENT_ONLY`/`PRIVATE`) |
| `EMPLOYEE` | Field Security Officer | View assigned tickets, update field progress |
| `CLIENT` | Registered Corporation / Entity | Submit requests, view own ticket timelines, access confidential reports, update profile |
| `TRAINEE` | Academy Student | View enrolled courses, review attendance, download verified digital certificates |

---

## 2. Server-side Gate Enforcement
Access gates are evaluated on the server via `getCurrentUser()` and `hasRole(user.role, allowedRoles)`. Unauthorized API calls return `401 Unauthorized` or `403 Forbidden` JSON payloads.
