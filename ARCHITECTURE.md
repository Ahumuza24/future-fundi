# Architecture Overview

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      Browser (SPA)                        │
│         React 19 + Vite 8 + Tailwind CSS 4               │
│                  Hosted on Vercel                         │
└─────────────────────────┬─────────────────────────────────┘
                          │ HTTPS / JWT (Authorization header)
                          │ X-School-ID header (multi-tenant)
┌─────────────────────────▼─────────────────────────────────┐
│                   Django REST API                         │
│       DRF + SimpleJWT + Whitenoise + Throttling           │
│                  Hosted on Render                         │
│                                                           │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  apps/users  │  │  apps/core    │  │   apps/api    │  │
│  │  Custom User │  │  Domain Models│  │  ViewSets,    │  │
│  │  Auth backend│  │  + Middleware  │  │  Serializers, │  │
│  └──────────────┘  └───────────────┘  │  Permissions  │  │
│                                        └───────────────┘  │
└─────────────────────────┬─────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
┌─────────▼──────────┐         ┌──────────▼──────────┐
│  SQLite (dev) or   │         │   Media file storage │
│  PostgreSQL (prod) │         │   /media/  (local)   │
│  + Optional read   │         │   (S3 in future)     │
│  replica support   │         └─────────────────────┘
└────────────────────┘
```

---

## Domain Model

### Core entities and their relationships

```
School (Tenant)
├── User (auth)  → role: admin | teacher | learner | parent | program_manager | school | data_entry
├── Learner      → linked 1:1 with User (role=learner)
│   ├── LearnerCourseEnrollment → Course (Pathway)
│   │   ├── current_level  → CourseLevel
│   │   └── level_progress → LevelProgress (per-level completion tracking)
│   ├── Session (many-to-many, through Attendance)
│   ├── Artifact (uploaded project work)
│   └── Achievement (earned badges/microcredentials)
├── Teacher (User, role=teacher)
│   ├── Session    → Module → Course
│   └── TeacherTask
└── Course (Pathway)
    ├── CourseLevel (Level 1, Level 2 …)
    │   └── required_modules → Module (microcredentials)
    └── Module (individual microcredential/topic)
        └── Session (class delivery of this module)
```

### Key terminology mapping

| UI Label | Django Model | Notes |
|---|---|---|
| **Pathway** | `Course` | Top-level learning journey, e.g. "Robotics" |
| **Level** | `CourseLevel` | Sequential steps within a pathway |
| **Microcredential** | `Module` | Individual topic/unit taught in sessions |
| **Session** | `Session` | A single class delivered by a teacher |
| **Artifact** | `Artifact` | Student project/portfolio submission |
| **Badge** | `Achievement` | Awarded on level/course completion |
| **School** | `School` (via `TenantModel`) | Multi-tenant isolation unit |

---

## Multi-Tenancy

Every piece of user-created data is scoped to a **School (tenant)**. The `TenantModel` base class adds a `tenant` FK to every relevant model.

The `SchoolContextMiddleware` reads the `X-School-ID` header sent by the frontend and attaches `request.school` so ViewSets can filter automatically.

Teachers **must** select an active school before accessing teaching tools — this is enforced in `TeacherSchoolSelect` and stored in `localStorage` as `selected_school_id`.

---

## Authentication Flow

```
1. POST /api/auth/login/   → { access, refresh, user }
2. Store access in sessionStorage, refresh in sessionStorage
3. Every request: Authorization: Bearer <access>
4. On 401: auto-refresh via /api/auth/token/refresh/
5. On refresh fail: redirect to /login + clear tokens
```

- **Access token lifetime:** 15 minutes
- **Refresh token lifetime:** 7 days (rotating — old refresh is blacklisted after use)
- **Email-based auth:** `apps.users.backends.EmailBackend` allows login with email instead of username

---

## Role-Based Access Control (RBAC)

Permissions live in `apps/api/permissions.py`. Each role has a dedicated permission class:

| Permission Class | Allowed Roles |
|---|---|
| `IsLearner` | `learner` |
| `IsTeacher` | `teacher` |
| `IsParent` | `parent` |
| `IsProgramManager` | `program_manager`, `admin` |
| `IsSchoolAdmin` | `school`, superuser |
| `IsTeacherOrProgramManager` | `teacher`, `program_manager`, `admin` |
| `IsLearnerOrParent` | `learner`, `parent` |

Frontend route guards (`ProtectedRoute`) mirror this — each route declares `allowedRoles`.

---

## API Layer Structure (`apps/api/`)

| File | Responsibility |
|---|---|
| `views.py` | Generic learner/artifact/KPI views |
| `student_views.py` | Student dashboard data aggregation |
| `teacher_views.py` | Sessions, attendance, artifact capture, tasks |
| `school_views.py` | School admin panel (students, teachers, pathways, classes) |
| `admin_views.py` | Platform admin — users, tenants, analytics |
| `admin_monitor_views.py` | Real-time monitoring (sessions, tasks, attendance) |
| `course_views.py` | Courses, levels, modules, enrollments, achievements |
| `pathway_learning_views.py` | Student pathway detail + progress updates |
| `child_views.py` | Parent → child data access |
| `serializers.py` | All DRF serializers |
| `permissions.py` | Role permission classes |
| `throttles.py` | Rate limiting (burst: 60/min, sustained: 1000/hr) |
| `exceptions.py` | Custom exception handler |
| `middleware/` | Security headers, request logging |
| `urls.py` | API URL routing (DRF DefaultRouter) |

---

## Frontend Structure (`frontend/src/`)

### Pages by role

```
pages/
├── student/
│   ├── StudentDashboard.tsx   # Main student home (pathways, lessons, artifacts)
│   └── PathwayLearning.tsx    # Pathway detail + progress update
├── teacher/
│   ├── TeacherDashboard.tsx
│   ├── TeacherSessions.tsx    # Create/edit sessions
│   ├── TeacherAttendance.tsx  # Mark attendance per session
│   ├── TeacherArtifactCapture.tsx
│   ├── TeacherPathways.tsx
│   ├── TeacherStudents.tsx
│   └── … (assessments, tasks, communication, portfolio)
├── school/
│   ├── SchoolDashboard.tsx    # Whole-school overview
│   ├── SchoolStudents.tsx
│   ├── SchoolTeachers.tsx
│   └── … (pathways, progress, badges, analytics)
├── parent/
│   ├── ParentPortal.tsx
│   ├── ParentMyChildren.tsx
│   └── ParentWeeklyUpdates.tsx
└── admin/
    ├── AdminDashboard.tsx
    ├── AdminCourseManagement.tsx
    ├── UserManagement.tsx
    └── … (monitor, analytics, curriculum entry, activities)
```

### Key shared components

| Component | Purpose |
|---|---|
| `Sidebar.tsx` | Role-aware navigation sidebar |
| `TopBar.tsx` | Header with user menu |
| `ProtectedRoute.tsx` | Route guard that checks JWT + role |
| `PageLayout.tsx` | Shell wrapping sidebar + topbar |
| `ErrorBoundary.tsx` | Catches React render errors gracefully |
| `components/student/PathwayCard.tsx` | Pathway card showing microcredential progress |
| `components/student/MicroCredentialBadge.tsx` | Badge display component |

### API client (`lib/api.ts`)

Single Axios instance with:
- Base URL from `VITE_API_URL` env var
- JWT auto-injection via request interceptor
- Automatic token refresh on 401 via response interceptor
- `X-School-ID` header injection for multi-tenancy
- Named API groups: `studentApi`, `teacherApi`, `schoolApi`, `parentApi`, `adminApi`

---

## Key Design Decisions

### 1. SQLite for development, PostgreSQL for production
The `USE_SQLITE=true` env flag eliminates the need for a local Postgres setup. Simply switch to `false` and set `POSTGRES_*` variables for production.

### 2. sessionStorage for tokens (not localStorage)
Access and refresh tokens are kept in `sessionStorage` so they're automatically cleared when the browser tab closes, limiting the exposure window of stolen tokens.

### 3. Rotating refresh tokens with blacklisting
`rest_framework_simplejwt` is configured to rotate and blacklist refresh tokens after each use. This means a stolen refresh token can only be used once before it's invalidated.

### 4. `currentModule` reflects actual teaching activity
The student dashboard shows the **most recently taught microcredential** (from session history) rather than the enrollment's current level name, so students see what's actually happening in class.
