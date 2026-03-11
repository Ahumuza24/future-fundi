# API Reference

Base URL (development): `http://localhost:8000/api`

All endpoints (except auth) require:
```
Authorization: Bearer <access_token>
```

Multi-tenant endpoints also require:
```
X-School-ID: <school_uuid>
```

---

## Authentication

### Login
```
POST /auth/login/
```
**Body:**
```json
{ "email": "user@example.com", "password": "password" }
```
**Response:**
```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": { "id": 1, "email": "...", "role": "learner", "first_name": "...", "tenant_id": "..." }
}
```

### Refresh Token
```
POST /auth/token/refresh/
```
**Body:** `{ "refresh": "<token>" }`
**Response:** `{ "access": "<new_token>" }`

### Register
```
POST /auth/register/
```
**Body:** `{ "email", "password", "first_name", "last_name", "role" }`

### Logout
```
POST /auth/logout/
```
**Body:** `{ "refresh": "<token>" }` — blacklists the refresh token

---

## Student

### Dashboard
```
GET /student/dashboard/
```
Returns the full student dashboard payload:
```json
{
  "learner": { "id", "firstName", "lastName", "currentSchool", "currentClass" },
  "pathways": [
    {
      "id": "<enrollment_id>",
      "title": "Robotics",
      "progress": 45,
      "currentModule": "Introduction to Sensors",
      "currentLevel": "Level 2: Building",
      "status": "good | warning | critical | not_started",
      "color": "#f97316",
      "icon": "Bot",
      "totalLevels": 3,
      "microCredentialsEarned": 2,
      "totalMicroCredentials": 6
    }
  ],
  "upcomingLessons": [
    {
      "id", "title", "pathway", "microcredential",
      "fullDate", "date", "startTime", "endTime", "color"
    }
  ],
  "badges": [
    { "id", "name", "icon", "earnedDate", "color", "isLocked": false }
  ]
}
```

### Artifacts
```
GET /student/artifacts/
```
Returns the learner's uploaded artifacts with signed media URLs.

---

## Pathway Learning

### Get pathway detail
```
GET /pathway-learning/{enrollment_id}/
```

### Update progress
```
POST /pathway-learning/{enrollment_id}/update_progress/
```
**Body:** `{ "level_id": "<uuid>", "modules_completed": 2, "artifacts_submitted": 1 }`

---

## Teacher

### Sessions (CRUD)
```
GET    /teacher/sessions/
POST   /teacher/sessions/
GET    /teacher/sessions/{id}/
PUT    /teacher/sessions/{id}/
DELETE /teacher/sessions/{id}/
```
**Session body:**
```json
{
  "module": "<module_id>",
  "date": "2026-03-15",
  "start_time": "09:00",
  "end_time": "11:00",
  "learners": ["<learner_id>", ...]
}
```

### Mark Attendance
```
POST /teacher/sessions/{id}/mark_attendance/
```
**Body:** `{ "learner_id": "<uuid>", "status": "present | absent | late | excused" }`

### Quick Artifact Capture
```
POST /teacher/quick-artifacts/
Content-Type: multipart/form-data
```
**Fields:** `learner_id`, `title`, `reflection`, `session_id`, `file` (optional)

### Students (teacher's view)
```
GET /teacher/students/
GET /teacher/students/{id}/
```

### Learner Portfolio
```
GET /teacher/students/{id}/portfolio/
```

### Badges / Achievements
```
GET  /teacher/badges/
POST /teacher/badges/
```

### Tasks
```
GET    /teacher/tasks/
POST   /teacher/tasks/
PUT    /teacher/tasks/{id}/
DELETE /teacher/tasks/{id}/
```

---

## School Admin

### Dashboard overview
```
GET /school/dashboard/overview/
```
Returns school-wide stats: student count, session count, pathway breakdown.

### Students
```
GET /school/students/
GET /school/students/{id}/
```

### Teachers
```
GET /school/teachers/
```

### Pathways
```
GET /school/pathways/
```

### Classes
```
GET  /school/classes/
POST /school/classes/
```

### Sessions (school-wide view)
```
GET /school/dashboard/sessions/
```

---

## Courses & Curriculum

### Courses (Pathways)
```
GET  /courses/
POST /courses/        # admin only
GET  /courses/{id}/
PUT  /courses/{id}/   # admin only
```

### Course Levels
```
GET  /course-levels/
POST /course-levels/  # admin only
```

### Modules (Microcredentials)
```
GET  /modules/
POST /modules/        # admin only
GET  /modules/{id}/
```

### Enrollments
```
GET  /enrollments/
POST /enrollments/    # admin/teacher
```

### Progress
```
GET /progress/
GET /progress/{id}/
```

### Achievements (Badges)
```
GET  /achievements/
POST /achievements/   # teacher/admin
```

---

## Admin

### Users
```
GET    /admin/users/
POST   /admin/users/
GET    /admin/users/{id}/
PUT    /admin/users/{id}/
DELETE /admin/users/{id}/
```

### Schools (Tenants)
```
GET  /admin/tenants/
POST /admin/tenants/
GET  /admin/tenants/{id}/
PUT  /admin/tenants/{id}/
```

### Analytics Overview
```
GET /admin/analytics/overview/
```

### Monitor
```
GET /admin/monitor/sessions/
GET /admin/monitor/tasks/
GET /admin/monitor/attendance/
```

---

## Parent

### Children
```
GET  /children/
POST /children/      # link a child by learner ID + relationship
GET  /children/{id}/
```

---

## Utilities

### Health Check
```
GET /health/
```
Returns `{ "status": "ok" }`

### Dashboard KPIs
```
GET /dashboard/kpis/
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Human-readable message",
  "code": "machine_readable_code",
  "detail": { ... }
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthenticated (missing or expired token) |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 429 | Rate limited (60 req/min burst, 1000 req/hr sustained) |
| 500 | Server error |

---

## Rate Limits

| Limit | Value |
|---|---|
| Anonymous requests | 20 / minute |
| Burst (authenticated) | 60 / minute |
| Sustained (authenticated) | 1000 / hour |
| Login attempts | 5 / minute |
| Registration | 3 / minute |
