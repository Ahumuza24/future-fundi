# Future Fundi Dashboard - Implementation Tasks

This file tracks all implementation tasks and their completion status. Update after each completed task.

## ✅ Phase 0: Foundation - COMPLETED

### Design & Planning
- [x] Design system documentation (colors, fonts, animations)
- [x] Design system implementation in frontend (CSS variables, Tailwind config)

### Infrastructure Setup
- [x] Django project structure with multi-tenant setup
- [x] PostgreSQL/SQLite database configuration
- [x] Redis cache configuration (with fallback to LocMem)
- [x] Django REST Framework setup
- [x] JWT authentication configuration
- [x] CORS configuration
- [x] Multi-tenant middleware
- [x] Database router for read/write splitting

## ✅ Phase 1: Backend Foundation - PARTIALLY COMPLETED

### Django Project Setup
- [x] Project structure (`backend/fundi/`)
- [x] Core app (`apps/core/`)
- [x] API app (`apps/api/`)
- [x] Multi-tenant middleware implementation
- [x] TenantManager for automatic filtering
- [x] Database models with UUID primary keys
- [x] Migrations created and applied
- [x] DRF serializers for core models
- [x] API ViewSets (Learner, Artifact)
- [x] Pathway score calculation service
- [x] API endpoints structure
- [x] Seed script for development data

### Database Models - COMPLETED
- [x] School (Tenant model)
- [x] User (Extended with RBAC)
- [x] Learner (with consent flags, equity flags)
- [x] ParentContact (WhatsApp, SMS, Email channels)
- [x] Module (Curriculum modules)
- [x] Artifact (Weekly learner artifacts)
- [x] Assessment (Mini-assessments)
- [x] PathwayInputs (Pathway score components)
- [x] GateSnapshot (Historical pathway data)
- [x] Credential (Micro-credentials)
- [x] Outcome (Shadow days, internships, etc.)
- [x] PodClass (Class scheduling)
- [x] Observation (Teacher observations)
- [x] WeeklyPulse (Student mood check-ins)
- [x] SafetyIncident (Incident tracking)

### API Endpoints - PARTIALLY COMPLETED
- [x] `/api/learners/` - List/Create learners (with role-based filtering)
- [x] `/api/learners/<uuid:pk>/` - Get/Update/Delete learner (role-based access)
- [x] `/api/learners/<uuid:pk>/tree/` - Growth tree (stub)
- [x] `/api/learners/<uuid:pk>/artifacts/` - Get learner artifacts
- [x] `/api/learners/<uuid:pk>/pathway/` - Get pathway score
- [x] `/api/learners/<uuid:pk>/portfolio-pdf/` - PDF generation (not implemented)
- [x] `/api/artifacts/` - List/Create artifacts (role-based access)
- [x] `/api/artifacts/<uuid:pk>/upload-media/` - Media upload (not implemented)
- [x] `/api/dashboard/kpis/` - Dashboard KPIs (teachers/leaders only)
- [x] `/api/user/profile/` - Get/Update current user profile
- [ ] `/api/dashboard/trends/` - Dashboard trends
- [ ] `/api/dashboard/impact-brief/` - Impact brief
- [x] `/auth/token/` - JWT token obtain (with user data in response)
- [x] `/auth/token/refresh/` - JWT token refresh
- [x] `/auth/logout/` - Logout endpoint (token blacklisting)
- [x] `/api/auth/register/` - User registration endpoint (auto-login with JWT)
- [ ] `/auth/google/` - Google OAuth

### Pathway Score Engine - COMPLETED & FIXED
- [x] `calculate_pathway_score()` function (fixed to match spec: 0.4*Interest + 0.3*Skill + 0.2*Enjoyment + 0.1*Demand)
- [x] `determine_gate()` function (fixed to match spec: GREEN/AMBER/RED based on score, skill, and mood)
- [x] `recommend_next_moves()` function (fixed to match spec: BRIDGE, SHOWCASE, EXPLORE, DEEPEN)
- [x] API endpoint integration (updated to pass correct parameters)
- [ ] Batch recalculation Celery task
- [ ] Unit tests for pathway logic

### Role-Based Access Control (RBAC) - ✅ COMPLETED
- [x] Permission classes (IsLearner, IsTeacher, IsParent, IsLeader, IsTeacherOrLeader, IsLearnerOrParent)
- [x] Role-based queryset filtering in views
- [x] Custom JWT serializer with user data and role claims
- [x] User profile endpoint with role and tenant info
- [x] Logout endpoint with token blacklisting
- [x] Rate limiting/throttling (BurstRateThrottle, SustainedRateThrottle)
- [x] Token blacklist app configured

### Missing Backend Features
- [ ] Google OAuth integration (django-allauth)
- [ ] Media upload handling (S3 integration)
- [ ] PDF generation (WeasyPrint)
- [ ] WhatsApp Business API integration
- [ ] Celery task setup
- [ ] API documentation (drf-spectacular)
- [ ] Comprehensive unit tests
- [ ] Integration tests

## ✅ Phase 2: Frontend Foundation - PARTIALLY COMPLETED

### Vite + React Setup
- [x] Vite project with React + TypeScript
- [x] Path aliases configured (`@/components`, `@/lib`)
- [x] shadcn/ui components installed
- [x] React Router setup
- [x] React Query setup
- [x] Axios API client with interceptors
- [x] Zustand store setup

### Design System Implementation
- [x] Fundi brand colors in CSS variables
- [x] Custom fonts (Bricolage Grotesque, Atkinson Hyperlegible, JetBrains Mono)
- [x] Animation utilities (stagger delays)
- [x] Tailwind CSS configuration
- [x] shadcn/ui components (Button, Card)
- [x] Design system TypeScript module

### State Management & API Integration
- [x] Axios instance with auth interceptors
- [x] Token refresh logic
- [x] API wrapper functions (learnerApi, artifactApi, dashboardApi)
- [x] React Query provider setup
- [ ] Zustand stores implementation (auth, learner, artifacts)
- [ ] Custom hooks for API calls

### Core Views - PARTIALLY COMPLETED
- [x] Student Dashboard (enhanced UI with modern design, static data)
- [x] Parent Portal (page exists)
- [x] Teacher Capture (page exists)
- [x] Leader Dashboard (enhanced UI with modern design, static data)
- [x] Home Page (page exists)
- [x] Growth Tree visualization component (SVG with real tree anatomy: roots, trunk, rings, branches, leaves, fruit)
- [x] Sidebar navigation (responsive, with logout)
- [x] Login page (with FundiBots branding)
- [x] Sign up page (with form validation, auto-login after registration)
- [x] Protected routes (authentication guard)
- [ ] Portfolio grid (artifacts with photos) - needs dynamic data
- [ ] Pathway Score card (dynamic data) - needs API integration
- [ ] "Your Next Two Moves" cards (dynamic) - needs API integration
- [ ] Weekly pulse (mood emoji + win/worry) - dynamic - needs API integration
- [ ] Class roster with attendance - needs API integration
- [ ] Artifact submission form - needs API integration
- [ ] Mini-assessment quick entry - needs API integration
- [ ] KPI tiles (dynamic data) - needs API integration
- [ ] Trend charts (Recharts) - needs API integration
- [ ] School Impact Brief generator - needs API integration

### Missing Frontend Features
- [x] Authentication flow (login, signup, logout with role-based redirect)
- [x] Protected routes
- [x] User profile integration (uses user data from token response)
- [x] Sign up page with form validation
- [ ] Google OAuth integration
- [ ] Error boundaries
- [ ] Loading states and skeletons
- [ ] Form validation
- [ ] Image upload components
- [ ] PDF download functionality
- [ ] Responsive design improvements (mostly done)
- [ ] Accessibility improvements

## ❌ Phase 3: Messaging & PDF - NOT STARTED

### WhatsApp Business API Integration
- [ ] WhatsApp Business API account setup
- [ ] Message templates creation
- [ ] Celery task for batch sending
- [ ] SMS fallback (Twilio)
- [ ] Delivery and open rate tracking

### PDF Generation
- [ ] PDF templates (portfolio, impact brief, certificates)
- [ ] Print CSS for A4 layout
- [ ] Server-side PDF generation (WeasyPrint)
- [ ] PDF download endpoints
- [ ] Image optimization for PDFs

## ❌ Phase 4: Security & Scale - NOT STARTED

### Security Audit
- [ ] Rate limiting on all endpoints
- [ ] CAPTCHA on registration/login
- [ ] CSP headers
- [ ] Media access pattern audit
- [ ] Request/response logging
- [ ] Automated vulnerability scanning

### Performance Optimization
- [ ] Database query monitoring (django-silk)
- [ ] Caching strategy implementation
- [ ] CDN for media files
- [ ] Image upload optimization (compression, thumbnails)
- [ ] Connection pooling (pgBouncer)
- [ ] Background task queue (Celery)

### Monitoring & Observability
- [ ] Sentry integration
- [ ] Prometheus + Grafana dashboards
- [ ] Custom business metrics
- [ ] Uptime monitoring
- [ ] Alerts for critical failures
- [ ] Structured logging

## 🔄 Current Status Summary

### Completed
- ✅ Backend foundation (models, migrations, basic API)
- ✅ Frontend foundation (setup, design system, basic pages)
- ✅ Pathway score calculation engine
- ✅ Multi-tenant architecture
- ✅ JWT authentication setup

### In Progress / Needs Testing
- 🔄 API endpoints (some stubs need implementation)
- 🔄 Frontend pages (need dynamic data integration)
- 🔄 Authentication flow (needs Google OAuth)

### Not Started
- ❌ Messaging (WhatsApp, SMS)
- ❌ PDF generation
- ❌ Security hardening
- ❌ Performance optimization
- ❌ Monitoring setup
- ❌ Comprehensive testing

## 🎯 Next Steps (Priority Order)

1. **Test current implementation** - IN PROGRESS
   - [x] Test backend health endpoint (working)
   - [x] Fix pathway score calculation to match spec
   - [x] Fix gate determination logic
   - [x] Fix recommendation logic
   - [ ] Test backend API endpoints with authentication
   - [ ] Test frontend pages
   - [ ] Verify database queries
   - [ ] Check authentication flow

2. **Complete missing API endpoints**
   - [ ] Implement dashboard trends endpoint
   - [ ] Implement impact brief endpoint
   - [ ] Implement media upload
   - [ ] Add Google OAuth

3. **Connect frontend to backend**
   - [ ] Integrate React Query hooks
   - [ ] Connect Student Dashboard to real data
   - [ ] Connect Leader Dashboard to real data
   - [ ] Add error handling

4. **Implement Growth Tree visualization** - ✅ COMPLETED
   - [x] Create SVG component with real tree anatomy (roots, trunk, rings, branches, leaves, fruit)
   - [x] Roots: Wellbeing & Values / SEL (motivation, SEL, safety, ethics, regulation, collaboration, purpose)
   - [x] Trunk: Durable Skills (literacy, numeracy/logic, communication, digital/data, making/safety)
   - [x] Rings: Time-based growth rings showing term-by-term progress with micro-rubrics (Initiate • Practice • Transfer)
   - [x] Branches: Domain branches (Energy, Mechatronics, Software/AI, Water/WASH, etc.)
   - [x] Leaves: Artifacts (weekly 1-1-1: concept → skill → artifact + reflection)
   - [x] Fruit: Outcomes (micro-credentials, showcases, shadow days, internships, contracts, competitions)
   - [x] Interactive elements (click to view details)
   - [x] Color-coded levels (Initiate=Red, Practice=Yellow, Transfer=Lime, Master=Cyan)
   - [x] Add animations (Framer Motion)
   - [x] Integrated into Student Dashboard
   - [ ] Connect to backend data (API integration pending)

5. **Add authentication UI** - ✅ COMPLETED
   - [x] Login page with FundiBots branding
   - [x] Protected routes component
   - [x] Logout functionality in sidebar
   - [ ] Google OAuth button (pending backend OAuth setup)

6. **Testing**
   - [ ] Unit tests for backend
   - [ ] Integration tests for API
   - [ ] Frontend component tests

---

**Last Updated:** 2025-01-18
**Next Review:** After testing current implementation

## 📝 User Registration & Sign Up Page (2025-01-18)

**Completed:** User registration functionality
- Registration endpoint (`/api/auth/register/`) with validation
- RegisterSerializer with password confirmation, school code support
- Auto-creates Learner profile if tenant provided
- Auto-login after registration (returns JWT tokens)
- SignUpPage component with form validation
- Links between login and sign up pages
- Role-based redirect after registration

## 🔐 Role-Based Authentication & Backend Setup (2025-01-18)

**Completed:** Full RBAC implementation
- Permission classes for all roles (learner, teacher, parent, leader/admin)
- Role-based queryset filtering in LearnerViewSet
- Custom JWT serializer that includes user data in token response
- User profile endpoint (`/api/user/profile/`)
- Logout endpoint with token blacklisting (`/auth/logout/`)
- Rate limiting/throttling configured (60/min burst, 1000/hour sustained)
- Token blacklist app installed and migrated
- Frontend updated to use user data from token response
- Role-based redirect after login (learner→/student, teacher→/teacher, etc.)

## 🌳 Growth Tree Visualization (2025-01-18)

**Completed:** Real tree anatomy implementation
- Roots (bottom): Wellbeing & Values / SEL with level indicators
- Trunk (center): Durable Skills with growth rings showing term-by-term progress
- Branches (extending from trunk): Domain branches with icons
- Leaves (on branches): Artifacts with week indicators and level colors
- Fruit (on branches): Outcomes (credentials, showcases, internships, etc.)
- Interactive: Click any element to view details
- Color coding: Red (Initiate), Yellow (Practice), Lime (Transfer), Cyan (Master)
- Responsive SVG with proper scaling and animations

## 🔧 Recent Fixes (2025-01-18)

1. **Fixed Pathway Score Calculation**
   - Updated formula to match spec: 0.4*Interest + 0.3*Skill + 0.2*Enjoyment + 0.1*Demand
   - Removed incorrect breadth weight

2. **Fixed Gate Determination**
   - Updated to match spec: GREEN if score>=70 and skill>=60 and positive mood, AMBER if score>=50, RED else
   - Added mood check from WeeklyPulse model

3. **Fixed Recommendation Logic**
   - Updated to match spec priority order: BRIDGE, SHOWCASE, EXPLORE, DEEPEN
   - Added proper artifact count check
   - Returns top 2 recommendations

4. **Updated API View**
   - Fixed pathway endpoint to pass correct parameters to service functions
   - Added WeeklyPulse mood check for gate determination

## ✅ Backend Restructuring & Users App (2025-01-18)

**COMPLETED:** Full backend reorganization with dedicated users app

### Users App Created
- [x] Created `apps/users/` Django app for user management
- [x] Moved User model from core to users app
- [x] Updated AUTH_USER_MODEL to `users.User`
- [x] User model with enhanced RBAC (learner, teacher, parent, leader, admin)
- [x] User model includes `get_dashboard_url()` method for role-based routing
- [x] Custom UserAdmin with role and tenant fields

### Authentication & Serializers
- [x] CustomTokenObtainPairSerializer with user data in response
- [x] RegisterSerializer with school_code support and auto-login
- [x] UserSerializer with tenant info and dashboard_url
- [x] JWT tokens include custom claims (role, tenant_id, username, email)

### Authentication Views & URLs
- [x] CustomTokenObtainPairView for login with user data
- [x] UserProfileView for GET/PATCH user profile
- [x] register_view for user registration with auto-login
- [x] logout_view with token blacklisting
- [x] dashboard_redirect_view for role-based dashboard routing
- [x] All auth endpoints moved to `/auth/*` and `/user/*`

### URL Configuration
- [x] Updated main urls.py to include users app
- [x] Removed duplicate auth endpoints from api app
- [x] Clean separation: users app handles auth, api app handles business logic
- [x] Auth endpoints: `/auth/token/`, `/auth/register/`, `/auth/logout/`, `/user/profile/`
- [x] API endpoints: `/api/learners/`, `/api/artifacts/`, `/api/dashboard/kpis/`

### Core Models Updated
- [x] Removed User model from core.models
- [x] Updated Learner to use settings.AUTH_USER_MODEL
- [x] Maintained all other models (School, Artifact, PathwayInputs, etc.)
- [x] TenantModel and TenantManager remain in core

### API Cleanup
- [x] Removed UserSerializer, RegisterSerializer from api/serializers.py
- [x] Removed CustomTokenObtainPairSerializer from api/serializers.py
- [x] Removed register_view, logout_view, UserProfileView from api/views.py
- [x] Updated api/urls.py to remove duplicate auth routes
- [x] API now focuses on business logic only

### Documentation
- [x] Created comprehensive backend/README.md
- [x] Documented all authentication flows
- [x] Documented role-based access control
- [x] Documented API endpoints
- [x] Documented multi-tenancy architecture
- [x] Documented pathway score engine
- [x] Added setup instructions and troubleshooting

## ✅ Frontend Authentication Updates (2025-01-18)

**COMPLETED:** Role-based authentication and routing

### Authentication Utilities
- [x] Created `lib/auth.ts` with authentication helpers
- [x] UserRole type definition (learner, teacher, parent, leader, admin)
- [x] getDashboardRoute() function for role-based routing
- [x] canAccessRoute() for permission checking
- [x] getRoleDisplayName() for UI display
- [x] getCurrentUser() to get user from localStorage
- [x] clearAuth() to clear authentication data

### Store Updates
- [x] Updated useAuthStore with full User interface
- [x] User interface includes all fields (role, tenant, dashboard_url, etc.)
- [x] Store persists user data to localStorage
- [x] login() saves user data to localStorage
- [x] logout() clears user data from localStorage
- [x] setUser() updates user data in localStorage

### Protected Routes
- [x] Updated ProtectedRoute component with role-based access
- [x] Added allowedRoles prop for route protection
- [x] Automatic redirect to appropriate dashboard if role mismatch
- [x] Uses getCurrentUser() and getDashboardRoute() helpers

### App Routing
- [x] Updated App.tsx with role-based route protection
- [x] Student route: learner, admin only
- [x] Parent route: parent, admin only
- [x] Teacher route: teacher, admin only
- [x] Leader route: leader, admin only

### API Configuration
- [x] Updated authApi endpoints to match new backend structure
- [x] Login: `/auth/token/`
- [x] Register: `/auth/register/`
- [x] Logout: `/auth/logout/`
- [x] Profile: `/user/profile/`
- [x] Dashboard redirect: `/user/dashboard/`
- [x] Updated all API endpoints to use `/api/` prefix

### Login & Signup Pages
- [x] LoginPage uses role-based redirect after login
- [x] SignUpPage uses role-based redirect after registration
- [x] Both pages handle user data from token response
- [x] Auto-login after registration with JWT tokens

