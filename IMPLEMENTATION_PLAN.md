# Parent-Child Relationship Implementation Plan

## Overview
Transform the platform so that:
1. Parents register and manage their children's accounts
2. Students (learners) belong to parents (one parent can have multiple children)
3. Parent dashboard includes all student dashboard features

## Backend Changes

### 1. Database Models (`apps/core/models.py`)

#### Learner Model Changes:
- **REMOVE**: `user` OneToOneField (learners won't have user accounts)
- **ADD**: `parent` ForeignKey to User (with role='parent')
- **KEEP**: All other fields (first_name, last_name, consent_media, equity_flag, etc.)

#### ParentContact Model:
- **CONSIDER**: Remove or repurpose (parents now have User accounts with email/contact info)

### 2. User Registration (`apps/users/`)

#### Registration Flow:
- Default registration creates parent accounts
- Parents can add children through a separate endpoint
- Remove automatic learner profile creation

#### New Endpoints Needed:
- `POST /api/children/` - Add a child (parent only)
- `GET /api/children/` - List parent's children
- `PATCH /api/children/{id}/` - Update child info
- `DELETE /api/children/{id}/` - Remove child

### 3. Serializers (`apps/api/serializers.py`)

#### New Serializers:
- `ChildSerializer` - For creating/updating children
- `ParentDashboardSerializer` - Includes children and their data

#### Updated Serializers:
- `LearnerSerializer` - Remove user field, add parent field
- `RegisterSerializer` - Default to parent role

## Frontend Changes

### 1. Registration (`src/pages/SignUpPage.tsx`)
- Remove role selection (default to parent)
- Simplify form (parent registration only)
- Add post-registration flow to add children

### 2. Parent Dashboard (`src/pages/ParentPortal.tsx`)
- **MERGE**: All StudentDashboard components
- **ADD**: Child selector/switcher
- **SHOW**: 
  - Pathway scores for each child
  - Growth trees for each child
  - Artifacts for each child
  - Weekly pulse for each child
  - Aggregated family view

### 3. Child Management
- Create child management interface
- Add child form (name, age, consent, etc.)
- Edit/delete children

### 4. Remove Student Registration
- Remove direct student login
- Students access through parent account

## Migration Strategy

### Phase 1: Backend (Database)
1. Create migration to add `parent` field to Learner
2. Data migration: Link existing learners to a default parent or mark for manual assignment
3. Remove `user` field from Learner (after data migration)

### Phase 2: Backend (API)
1. Update serializers
2. Create child management endpoints
3. Update authentication/permissions

### Phase 3: Frontend
1. Update registration flow
2. Redesign parent dashboard
3. Add child management UI
4. Remove student login option

## Testing Checklist
- [ ] Parent can register
- [ ] Parent can add multiple children
- [ ] Parent can view each child's dashboard
- [ ] Parent can edit child information
- [ ] Parent can delete children
- [ ] All student dashboard features work in parent view
- [ ] Data is properly scoped to parent's children

## Rollback Plan
- Keep database backups before migration
- Feature flag for new parent-child model
- Gradual rollout to test schools first
