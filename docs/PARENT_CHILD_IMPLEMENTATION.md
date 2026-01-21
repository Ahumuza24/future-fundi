# Parent-Child Model Implementation Summary

## Changes Made

### Backend Changes

#### 1. Database Models (`apps/core/models.py`)
**Changed:**
- `Learner` model now has a `parent` ForeignKey instead of `user` OneToOneField
- Added `date_of_birth` field to Learner
- Added `full_name` and `age` properties to Learner model
- Learners are now owned by parents (one parent can have multiple children)

**Impact:**
- Learners no longer have individual user accounts
- Parents manage all their children through their own account

#### 2. User Registration (`apps/users/serializers.py`)
**Changed:**
- `RegisterSerializer` now defaults all registrations to 'parent' role
- Removed automatic learner profile creation
- Removed 'role' field from registration (always creates parents)

**Impact:**
- All new registrations create parent accounts
- Children are added separately through child management endpoints

#### 3. API Serializers (`apps/api/serializers.py`)
**Added:**
- `ChildCreateSerializer` - For parents to add children
- `ChildDetailSerializer` - Detailed child view with all dashboard data
- `WeeklyPulseSerializer` - For mood check-ins
- `AssessmentSerializer` - For learner assessments

**Updated:**
- `LearnerSerializer` - Now includes parent relationship and age calculation
- `ArtifactSerializer` - Added learner_name field

#### 4. New API Endpoints (`apps/api/child_views.py`)
**Created `ChildViewSet` with endpoints:**
- `GET /api/children/` - List all parent's children
- `POST /api/children/` - Add a new child
- `GET /api/children/{id}/` - Get child details
- `PATCH /api/children/{id}/` - Update child info
- `DELETE /api/children/{id}/` - Remove child
- `GET /api/children/{id}/dashboard/` - Get complete dashboard data for a child
- `GET /api/children/{id}/artifacts/` - Get all artifacts for a child
- `GET /api/children/{id}/pathway/` - Get pathway score and recommendations
- `GET /api/children/summary/` - Get summary of all children

#### 5. Database Migration (`apps/core/migrations/0003_...py`)
**Created migration that:**
- Adds new `parent` field to Learner
- Removes old `user` field from Learner
- Adds `date_of_birth` field
- Updates model metadata and indexes

**⚠️ IMPORTANT:** The migration includes a placeholder data migration function. You need to decide how to handle existing learners before running this migration.

### Frontend Changes Needed

#### 1. Registration Flow (`src/pages/SignUpPage.tsx`)
**TODO:**
- Remove role selection (defaults to parent)
- Simplify registration form
- Add post-registration flow to add first child

#### 2. Parent Dashboard (`src/pages/ParentPortal.tsx`)
**TODO:**
- Merge all StudentDashboard components
- Add child selector/switcher UI
- Show pathway scores for each child
- Display growth trees for each child
- Show artifacts for each child
- Include weekly pulse for each child
- Add aggregated family view

#### 3. Child Management UI
**TODO:**
- Create child management interface
- Add "Add Child" form (name, date of birth, consent, etc.)
- Edit child information
- Delete children (with confirmation)

#### 4. API Integration (`src/lib/api.ts`)
**TODO:**
- Add child management API calls:
  - `getChildren()` - List all children
  - `addChild(data)` - Add a new child
  - `getChildDashboard(childId)` - Get child's dashboard
  - `updateChild(childId, data)` - Update child info
  - `deleteChild(childId)` - Remove child

#### 5. Remove Student Login
**TODO:**
- Remove direct student login option
- Update login flow to only support parent/teacher/leader/admin roles

## Migration Steps

### Before Running Migration

1. **Backup your database:**
   ```bash
   # For SQLite
   cp db.sqlite3 db.sqlite3.backup
   
   # For PostgreSQL
   pg_dump your_database > backup.sql
   ```

2. **Decide on data migration strategy:**
   
   **Option A: Fresh Install (No existing data)**
   - Simply run the migration as-is
   
   **Option B: Existing Data**
   - Create parent accounts for existing learners
   - Update the data migration function in `0003_change_learner_to_parent_child_model.py`
   - Example:
     ```python
     def create_default_parent_for_existing_learners(apps, schema_editor):
         User = apps.get_model('users', 'User')
         Learner = apps.get_model('core', 'Learner')
         
         for learner in Learner.objects.all():
             # Create a parent account for each learner's user
             if learner.user:
                 # Option 1: Convert user to parent
                 learner.user.role = 'parent'
                 learner.user.save()
                 learner.parent_temp = learner.user
                 learner.save()
     ```

### Running the Migration

```bash
cd backend
python manage.py migrate core
```

### After Migration

1. **Verify data integrity:**
   ```bash
   python manage.py shell
   ```
   ```python
   from apps.core.models import Learner
   from apps.users.models import User
   
   # Check all learners have parents
   print(f"Learners without parents: {Learner.objects.filter(parent__isnull=True).count()}")
   
   # Check parent accounts
   print(f"Total parents: {User.objects.filter(role='parent').count()}")
   ```

2. **Update URL routing:**
   - Add child management endpoints to your URL configuration
   - Example in `apps/api/urls.py`:
     ```python
     from .child_views import ChildViewSet
     
     router.register(r'children', ChildViewSet, basename='child')
     ```

## Testing Checklist

### Backend
- [ ] Parent can register successfully
- [ ] Parent can add a child
- [ ] Parent can view all their children
- [ ] Parent can update child information
- [ ] Parent can delete a child
- [ ] Child dashboard endpoint returns correct data
- [ ] Pathway calculation works for children
- [ ] Artifacts are properly associated with children

### Frontend (After implementing changes)
- [ ] Parent registration works
- [ ] Parent can add multiple children
- [ ] Child selector shows all children
- [ ] Switching between children updates dashboard
- [ ] All student dashboard features work in parent view
- [ ] Parent can edit child information
- [ ] Parent can delete children (with confirmation)

## Rollback Plan

If you need to rollback:

1. **Restore database backup:**
   ```bash
   # For SQLite
   cp db.sqlite3.backup db.sqlite3
   
   # For PostgreSQL
   psql your_database < backup.sql
   ```

2. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

3. **Run migrations backward:**
   ```bash
   python manage.py migrate core 0002_initial
   ```

## Next Steps

1. **Review the migration file** and customize the data migration function based on your needs
2. **Test in development** environment first
3. **Implement frontend changes** (see Frontend Changes Needed section)
4. **Update API documentation** to reflect new endpoints
5. **Train users** on the new parent-child workflow

## Support

If you encounter issues:
1. Check the migration file for data migration logic
2. Verify all learners have parent assignments
3. Check API endpoint permissions
4. Review frontend API integration

---

**Status:** Backend implementation complete. Frontend changes pending.
**Next:** Implement frontend child management UI and update parent dashboard.
