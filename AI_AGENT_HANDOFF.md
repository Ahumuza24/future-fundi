# Future Fundi - AI Agent Handoff Document

**Project:** Future Fundi - STEAM Education Platform  
**Last Updated:** April 17, 2026  
**Prepared For:** Next AI Agent Taking Over Development

---

## 1. Project Overview

Future Fundi is a full-stack educational platform for STEAM (Science, Technology, Engineering, Arts, Mathematics) learning. The platform supports:

- **Multi-tenant architecture** (schools/organizations as tenants)
- **Three user roles:** Students, Teachers, Parents
- **Learning pathways** (courses) with micro-credentials (modules)
- **Artifact-based assessment** (project uploads with teacher approval)
- **Real-time progress tracking** and gamification (badges)

### Core Value Proposition
Students learn through hands-on projects, upload artifacts as proof of learning, and teachers review/approve these artifacts to track progress toward micro-credentials.

---

## 2. Tech Stack

### Backend (Django REST Framework)
- **Framework:** Django 5.x with Django REST Framework
- **Database:** PostgreSQL
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Multi-tenancy:** Custom `TenantModel` with school-based scoping
- **File Storage:** Local filesystem (development) / S3-compatible (production)
- **Key Dependencies:**
  - `django-cors-headers` - CORS handling
  - `drf-nested-routers` - Nested API routing
  - `Pillow` - Image processing
  - `python-dotenv` - Environment management

### Frontend (React + TypeScript)
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Routing:** TanStack Router
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui + Radix UI primitives
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios with interceptors

---

## 3. Project Structure

```
future-fundi/
├── backend/                    # Django backend
│   ├── apps/
│   │   ├── api/               # REST API endpoints
│   │   │   ├── serializers.py # DRF serializers
│   │   │   ├── student_views.py
│   │   │   ├── teacher_views.py
│   │   │   └── urls.py
│   │   ├── core/              # Core models
│   │   │   └── models.py      # Artifact, Course, Module, Learner, etc.
│   │   ├── users/             # User management
│   │   │   └── models.py      # User, School (Tenant)
│   │   └── parents/           # Parent-specific features
│   ├── config/                # Django settings
│   └── manage.py
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/ui/     # shadcn components
│   │   ├── features/          # Feature-based organization
│   │   │   ├── student/
│   │   │   ├── teacher/
│   │   │   └── parent/
│   │   ├── lib/              # Utilities
│   │   │   ├── api.ts        # API layer (CRITICAL FILE)
│   │   │   └── utils.ts
│   │   ├── pages/            # Route pages
│   │   └── App.tsx           # Main app with routing
│   ├── package.json
│   └── tsconfig.app.json
│
├── .env.example              # Environment template
└── README.md
```

---

## 4. Key Features Implemented

### ✅ Completed Features

#### Authentication & User Management
- JWT-based authentication with refresh tokens
- Role-based access control (student/teacher/parent)
- Parent can add children (learners)
- School/tenant scoping

#### Learning Management
- Course (Pathway) and Module (Micro-credential) structure
- Levels within courses
- Learner enrollments with progress tracking
- Session scheduling and attendance

#### Artifact System (FULLY IMPLEMENTED)
**Student Side:**
- Upload artifacts with title, reflection, files
- Select pathway and micro-credential during upload
- View pending/approved/rejected status
- See teacher feedback on rejected artifacts

**Teacher Side:**
- Review student submissions dashboard
- Click artifact cards to see detailed view
- Approve artifacts (turns green - Fundi brand color)
- Return artifacts with rejection reason
- Media gallery view for multiple files

**Technical Implementation:**
- `Artifact` model with `status`, `uploaded_by_student`, `rejection_reason`
- Tenant scoping supports null tenants (independent learners)
- File upload via `multipart/form-data`
- Media refs stored as JSON with URLs

#### Dashboards
- **Student Dashboard:** Progress cards, upcoming lessons, artifact gallery
- **Teacher Dashboard:** Session management, pending tasks, quick actions
- **Parent Dashboard:** Child progress overview

---

## 5. Critical Files & Locations

### Backend - Key Files

| File | Purpose |
|------|---------|
| `backend/apps/core/models.py` | All core models: Artifact, Course, Module, Learner, Session |
| `backend/apps/api/serializers.py` | DRF serializers including `StudentArtifactUploadSerializer` |
| `backend/apps/api/student_views.py` | Student dashboard API, upload endpoint |
| `backend/apps/api/teacher_views.py` | Teacher review endpoints, artifact approval |
| `backend/apps/users/models.py` | User, School (Tenant), LearnerProfile |
| `backend/apps/api/urls.py` | API route definitions |

### Frontend - Key Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/api.ts` | **CRITICAL:** All API calls. Uses axios with interceptors. |
| `frontend/src/features/student/dashboard/components/StudentArtifactUploadModal.tsx` | Student upload modal with pathway/module selection |
| `frontend/src/pages/teacher/TeacherReviewSubmissions.tsx` | Teacher artifact review interface |
| `frontend/src/pages/teacher/TeacherDashboard.tsx` | Teacher main dashboard |
| `frontend/src/App.tsx` | Route definitions |

---

## 6. API Endpoints Reference

### Student Endpoints
```
GET  /api/student/dashboard/           # Dashboard data
GET  /api/student/artifacts/             # Student's artifacts
GET  /api/student/my-modules/           # Enrolled pathways + modules
POST /api/student/upload-artifact/      # Upload new artifact
```

### Teacher Endpoints
```
GET  /api/teacher/dashboard/            # Teacher dashboard data
GET  /api/teacher/quick-artifacts/student-submissions/  # Pending reviews
POST /api/teacher/quick-artifacts/{id}/review/          # Approve/reject
```

### Auth Endpoints
```
POST /api/auth/login/                   # JWT login
POST /api/auth/refresh/                # Token refresh
POST /api/auth/register/               # User registration
```

---

## 7. Database Models (Key Relationships)

```
User
├── Learner (one-to-one, student role)
│   ├── Enrollment → Course
│   └── Artifact (uploaded artifacts)
├── TeacherProfile
│   └── TeacherAssignment → School
└── ParentProfile
    └── children → Learner

Course (Pathway)
├── Level
│   └── Module (Micro-credential)
└── Enrollment → Learner

Artifact
├── learner (FK)
├── module (FK, optional)
├── tenant (FK, optional - null for independent learners)
├── status (pending/approved/rejected)
├── media_refs (JSON array)
└── rejection_reason (text)
```

### Multi-Tenancy Note
- `TenantModel` base class provides `tenant` field
- `tenant` can be `null` for independent learners (schools not in DB)
- Teacher reviews use `current_school` text field to match learners

---

## 8. Important Technical Details

### File Uploads (CRITICAL)
- **Frontend:** Use `FormData`, let Axios set `Content-Type` automatically
- **Backend:** Access files via `request.FILES.getlist("files")`
- **Storage:** Files saved to `media/artifacts/{artifact_id}/`
- **URLs:** Built using `request.build_absolute_uri()`

### Authentication Flow
1. User logs in → receives `access` and `refresh` JWT tokens
2. Axios interceptor adds `Authorization: Bearer {token}` to requests
3. Token refresh happens automatically on 401 responses

### Multi-Tenancy Resolution
- Teachers: School context resolved via `?school={id}` query param or header
- Students: Tenant inferred from learner's `tenant` field (can be null)
- Critical method: `_resolve_school_context()` in teacher views

---

## 9. Recent Major Changes & Fixes

### Artifact Upload Workflow (Completed April 2026)
1. **Problem:** 500 errors on upload, tenant validation issues
2. **Solution:** 
   - Made `tenant` nullable on Artifact model
   - Removed strict tenant check in `upload_artifact`
   - Fixed serializer read-only fields
   - Proper FormData handling in frontend

### Teacher Review System (Completed April 2026)
1. **Problem:** Teachers couldn't approve student artifacts
2. **Solution:**
   - Fixed permission check for null-tenant artifacts
   - Added `current_school` text matching logic
   - Created review dialog with rejection reason
   - Added detail view for artifact review

### Pathway/Module Selection (Completed April 2026)
1. **Problem:** Students couldn't specify which credential artifact was for
2. **Solution:**
   - Added `/api/student/my-modules/` endpoint
   - Added native HTML select dropdowns (avoid Radix clipping issues)
   - Updated `StudentArtifactUploadSerializer` with `module_id` field

---

## 10. Known Issues & Technical Debt

### Minor Issues
1. **TypeScript deprecation warning:** `baseUrl` deprecated - replaced with `rootDir`
2. **Build process:** Ensure `pnpm build` passes before deploying

### Potential Improvements
1. **File storage:** Currently local filesystem - migrate to S3 for production
2. **Image optimization:** No automatic resizing on upload
3. **Email notifications:** Not implemented yet
4. **Real-time updates:** WebSocket not implemented (polling used instead)

---

## 11. Development Workflow

### Starting Development
```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
pnpm install
pnpm dev
```

### Environment Variables
See `.env.example` for required variables:
- `SECRET_KEY`
- `DATABASE_URL`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`

### Adding New Features
1. **Backend:** Add to appropriate app in `apps/`
2. **API:** Add to `apps/api/` with proper serializers
3. **Frontend:** Add to `features/` following existing patterns
4. **Routes:** Update `App.tsx` for new pages

---

## 12. Testing Approach

### Backend Testing
```bash
cd backend
python manage.py test apps.api.tests
```

### Frontend Testing
```bash
cd frontend
pnpm test
```

### Manual Testing Checklist
- [ ] Student can upload artifact with pathway/module selection
- [ ] Teacher sees submission in review dashboard
- [ ] Teacher can click card to open detail view
- [ ] Teacher can approve (Fundi orange button)
- [ ] Teacher can return with reason
- [ ] Student sees status change and feedback
- [ ] Independent learners (null tenant) can upload

---

## 13. Brand Colors (CSS Variables)

```css
--fundi-orange: #f97316    /* Primary brand color - use for approve buttons */
--fundi-black: #1a1a1a     /* Text and headers */
--fundi-cyan: #06b6d4      /* Secondary accent */
--fundi-lime: #84cc16      /* Success indicators */
--fundi-purple: #8b5cf6     /* Tertiary accent */
--fundi-red: #ef4444       /* Error/rejection states */
--fundi-yellow: #f59e0b    /* Warning states */
```

---

## 14. Quick Reference Commands

```bash
# Backend management
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py shell

# Frontend development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run linter

# Database
python manage.py dbshell
```

---

## 15. Next Steps for New Agent

### Immediate Priority (If Continuing Current Work)
1. Test artifact upload → review → approval flow end-to-end
2. Verify independent learners (null tenant) can upload
3. Check teacher review dashboard shows all submissions

### Potential Feature Extensions
1. **Notifications:** Email/SMS when artifact is approved/rejected
2. **Comments:** Allow teacher-student conversation on artifacts
3. **Analytics:** Dashboard for tracking class progress
4. **Mobile app:** React Native version
5. **Payment integration:** For course enrollments

### Code Quality Guidelines
- **DRY Principle:** Search for existing code before writing new
- **Separation of Concerns:** Business logic in services, not views/components
- **Type Safety:** Use TypeScript strictly, avoid `any`
- **Error Handling:** Always handle API errors with user-friendly messages
- **Performance:** Use `select_related`/`prefetch_related` in Django queries

---

## 16. Troubleshooting

### Common Issues

**Backend 500 on upload:**
- Check `media/` directory exists and is writable
- Verify serializer read-only fields don't conflict

**Frontend module not found:**
- Check `tsconfig.app.json` paths configuration
- Verify import uses `@/` alias correctly

**CORS errors:**
- Check `CORS_ALLOWED_ORIGINS` in backend settings
- Ensure frontend URL is included

**Teacher can't see submissions:**
- Verify teacher's school matches learner's `current_school`
- Check artifact has `uploaded_by_student=true`

---

## 17. Resources & Documentation

- `README.md` - General project info
- `ARCHITECTURE.md` - System design
- `DATA_MODEL.md` - Database schema
- `API_REFERENCE.md` - API documentation
- `SETUP_GUIDE.md` - Environment setup
- `DEPLOYMENT.md` - Deployment instructions

---

## Contact & Context

**Original Developer:** Human (Cedric Ahumuza)  
**Project Phase:** MVP Complete, Ready for Beta Testing  
**Critical Note:** The artifact review workflow is the core differentiator of this platform. Ensure any changes maintain the teacher approval flow.

**Last Session Summary:**
- Fixed dropdown clipping in upload modal using native HTML selects
- Changed approve button to Fundi orange brand color
- Resolved TypeScript build errors
- Verified multi-tenancy with null tenant support

---

**END OF HANDOFF DOCUMENT**

Good luck! The codebase is well-structured and ready for extension. Follow existing patterns and maintain the separation of concerns.
