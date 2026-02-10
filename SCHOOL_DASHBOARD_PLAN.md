# School Dashboard Implementation Plan

## Overview

Create a comprehensive School Dashboard that allows schools to manage their students, teachers, view pathways/microcredentials, monitor progress, and access analytics.

## Features Required

### 1. School Dashboard Pages

- **Dashboard Home** - Overview with key metrics
- **Students Management** - Add, edit, view students
- **Teachers Management** - Add, edit, view teachers
- **Pathways & Microcredentials** - View all available courses/modules
- **Student Progress** - Monitor student progress across courses
- **Badges & Artifacts** - View student achievements
- **Analytics** - School-wide analytics and reports

### 2. Admin Integration

- Add school credentials generation when creating a school
- Provide login credentials (username/password) for school admin

## Implementation Steps

### Phase 1: Backend API Endpoints (if needed)

- [ ] School dashboard API endpoints
- [ ] School-scoped student management
- [ ] School-scoped teacher management
- [ ] School analytics endpoints

### Phase 2: Frontend - School Dashboard Structure

- [ ] Create SchoolDashboard main page
- [ ] Create SchoolStudents page (add, edit, list)
- [ ] Create SchoolTeachers page (add, edit, list)
- [ ] Create SchoolPathways page (view only)
- [ ] Create SchoolProgress page (student progress tracking)
- [ ] Create SchoolBadges page (student badges & artifacts)
- [ ] Create SchoolAnalytics page (charts and metrics)

### Phase 3: Sidebar & Navigation

- [ ] Add school role to sidebar
- [ ] Create school navigation menu
- [ ] Update routing in App.tsx

### Phase 4: Admin School Creation

- [ ] Update admin school creation form
- [ ] Add credential generation
- [ ] Display/copy credentials after creation

### Phase 5: Authentication

- [ ] Ensure school role is supported in auth
- [ ] Add school-specific permissions

## File Structure

```
frontend/src/pages/
├── SchoolDashboard.tsx          # Main dashboard with metrics
├── SchoolStudents.tsx           # Student management
├── SchoolTeachers.tsx           # Teacher management
├── SchoolPathways.tsx           # View pathways/microcredentials
├── SchoolProgress.tsx           # Student progress tracking
├── SchoolBadges.tsx             # Badges & artifacts
├── SchoolAnalytics.tsx          # Analytics & reports
└── admin/
    └── SchoolCreation.tsx       # Enhanced with credentials
```

## API Endpoints Needed

### School Dashboard

- `GET /api/school/dashboard/` - Overview metrics
- `GET /api/school/analytics/` - Analytics data

### Students

- `GET /api/school/students/` - List all students
- `POST /api/school/students/` - Add student
- `PUT /api/school/students/:id/` - Edit student
- `DELETE /api/school/students/:id/` - Remove student
- `GET /api/school/students/:id/progress/` - Student progress

### Teachers

- `GET /api/school/teachers/` - List all teachers
- `POST /api/school/teachers/` - Add teacher
- `PUT /api/school/teachers/:id/` - Edit teacher
- `DELETE /api/school/teachers/:id/` - Remove teacher

### Pathways

- `GET /api/school/pathways/` - Available pathways
- `GET /api/school/microcredentials/` - Available microcredentials

### Badges & Artifacts

- `GET /api/school/badges/` - All student badges
- `GET /api/school/artifacts/` - All student artifacts

### Admin

- `POST /api/admin/schools/` - Create school with credentials
- `GET /api/admin/schools/:id/credentials/` - Get school credentials

## UI Components Needed

1. **Student Management Table** - Sortable, filterable table
2. **Teacher Management Table** - Sortable, filterable table
3. **Add/Edit Student Dialog** - Form for student details
4. **Add/Edit Teacher Dialog** - Form for teacher details
5. **Progress Cards** - Visual progress indicators
6. **Analytics Charts** - Bar, line, pie charts
7. **Badge Display** - Grid of badges with details
8. **Artifact Gallery** - Grid of artifacts with previews

## Design Considerations

### Color Scheme (using existing Fundi colors)

- Primary: `var(--fundi-purple)` - Main actions
- Success: `var(--fundi-lime)` - Positive metrics
- Warning: `var(--fundi-orange)` - Alerts
- Info: `var(--fundi-cyan)` - Information
- Accent: `var(--fundi-pink)` - Highlights

### Permissions

- School admin can:
  - ✅ Add/edit/delete students in their school
  - ✅ Add/edit/delete teachers in their school
  - ✅ View all pathways/microcredentials
  - ✅ View student progress
  - ✅ View badges and artifacts
  - ✅ View school analytics
  - ❌ Cannot access other schools' data
  - ❌ Cannot modify pathways/microcredentials

## Next Steps

1. Start with SchoolDashboard main page
2. Add sidebar navigation for school role
3. Create student management page
4. Create teacher management page
5. Add remaining pages
6. Update admin school creation

Let's begin implementation!
