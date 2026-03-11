# Data Model Reference

This document describes every significant database table — what it stores, key fields, and how it relates to other tables.

---

## Users App (`apps/users`)

### `users.User`
Custom user model. Extends Django's `AbstractUser`.

| Field | Type | Notes |
|---|---|---|
| `email` | EmailField | Used for login (unique) |
| `role` | CharField | `learner \| teacher \| parent \| leader \| admin \| school \| data_entry` |
| `tenant_id` | FK → School | Which school this user belongs to (nullable for global admins) |
| `first_name` | CharField | |
| `last_name` | CharField | |
| `avatar_url` | URLField | Optional profile picture |

---

## Core App (`apps/core`)

### `core.School` (Tenant)
Represents a partner school. All tenant-scoped data links back here.

| Field | Type | Notes |
|---|---|---|
| `name` | CharField | School display name |
| `slug` | SlugField | URL-safe identifier |
| `is_active` | BooleanField | Soft delete / suspension flag |
| `created_at` | DateTimeField | |

---

### `core.Learner`
Student profile — always linked 1:1 with a `User` of `role=learner`.

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOneField → User | |
| `tenant` | FK → School | Learner's school |
| `date_of_birth` | DateField | Used for age-band enrollment eligibility |
| `current_school` | CharField | Display name (may differ from tenant) |
| `current_class` | CharField | e.g. "Grade 5B" |
| `gender` | CharField | |

**Relationships:**
- `course_enrollments` — LearnerCourseEnrollment (reverse FK)
- `sessions_attended` — Session (M2M through Attendance)
- `artifacts` — Artifact (reverse FK)
- `achievements` — Achievement (reverse FK)

---

### `core.Course` (Pathway)
A structured learning journey. The top-level curriculum unit.

| Field | Type | Notes |
|---|---|---|
| `name` | CharField | e.g. "Robotics for Ages 9-12" |
| `description` | TextField | |
| `is_active` | BooleanField | |
| `tenant` | FK → School (nullable) | Null = global course available to all schools |
| `teachers` | M2M → User | Teachers assigned to teach this course |

**Relationships:**
- `levels` — CourseLevel (reverse FK, ordered by `level_number`)
- `modules` — Module (reverse FK, the microcredentials)
- `enrollments` — LearnerCourseEnrollment (reverse FK)

---

### `core.CourseLevel` (Level)
A sequential stage within a Course. Learners progress through levels in order.

| Field | Type | Notes |
|---|---|---|
| `course` | FK → Course | |
| `level_number` | PositiveIntegerField | Ordering (1, 2, 3 …) |
| `name` | CharField | e.g. "Level 1: Foundations" |
| `required_modules_count` | PositiveIntegerField | Min modules to complete |
| `required_artifacts_count` | PositiveIntegerField | Min artifacts to submit |
| `required_assessment_score` | PositiveIntegerField | Min score (0-100) |
| `requires_teacher_confirmation` | BooleanField | Manual teacher sign-off required |
| `required_modules` | M2M → Module | Specific modules required for this level |

---

### `core.Module` (Microcredential)
An individual topic/unit taught in sessions. The atomic unit of curriculum.

| Field | Type | Notes |
|---|---|---|
| `name` | CharField | e.g. "Introduction to Sensors" |
| `description` | TextField | |
| `course` | FK → Course (nullable) | Primary pathway this module belongs to |
| `content` | TextField | Rich text / video / image content |
| `suggested_activities` | JSONField | List of activity descriptions |
| `materials` | JSONField | List of required materials |
| `competences` | JSONField | Learning competencies |
| `media_files` | JSONField | List of `{type, url, name}` |
| `badge_name` | CharField | Badge earned on completion |

---

### `core.LearnerCourseEnrollment`
Records which courses a learner is enrolled in and their current position.

| Field | Type | Notes |
|---|---|---|
| `learner` | FK → Learner | |
| `course` | FK → Course | |
| `current_level` | FK → CourseLevel (nullable) | Where the learner is now |
| `enrolled_at` | DateTimeField | |
| `completed_at` | DateTimeField (nullable) | Null until all levels done |
| `is_active` | BooleanField | |

**Unique together:** `(learner, course)`

---

### `core.LevelProgress`
Tracks completion metrics per learner per level.

| Field | Type | Notes |
|---|---|---|
| `enrollment` | FK → LearnerCourseEnrollment | |
| `level` | FK → CourseLevel | |
| `modules_completed` | PositiveIntegerField | |
| `artifacts_submitted` | PositiveIntegerField | |
| `assessment_score` | IntegerField | 0-100 |
| `completion_percentage` | FloatField | Calculated |
| `completed` | BooleanField | True when all requirements met |

---

### `core.Session`
A single teaching session delivered by a teacher.

| Field | Type | Notes |
|---|---|---|
| `teacher` | FK → User (role=teacher) | |
| `module` | FK → Module | What was taught |
| `tenant` | FK → School | |
| `learners` | M2M → Learner (through Attendance) | Who attended |
| `date` | DateField | |
| `start_time` | TimeField | |
| `end_time` | TimeField | |
| `status` | CharField | `scheduled \| in_progress \| completed \| cancelled` |
| `attendance_marked` | BooleanField | |
| `notes` | TextField | Teacher observations |

---

### `core.Attendance`
Join table between Session and Learner with attendance status.

| Field | Type | Notes |
|---|---|---|
| `session` | FK → Session | |
| `learner` | FK → Learner | |
| `status` | CharField | `present \| absent \| late \| excused` |
| `notes` | TextField | |

**Unique together:** `(session, learner)`

---

### `core.Artifact`
A piece of student work captured by a teacher.

| Field | Type | Notes |
|---|---|---|
| `learner` | FK → Learner | |
| `tenant` | FK → School | |
| `title` | CharField | |
| `reflection` | TextField | Student/teacher reflection notes |
| `submitted_at` | DateTimeField | |
| `session` | FK → Session (nullable) | Session during which it was captured |
| `media_refs` | JSONField | List of `{type, url, name}` media references |

---

### `core.Achievement` (Badge)
A badge earned by a learner on completing a milestone.

| Field | Type | Notes |
|---|---|---|
| `learner` | FK → Learner | |
| `course` | FK → Course (nullable) | Which pathway |
| `level` | FK → CourseLevel (nullable) | Which level |
| `name` | CharField | Badge name |
| `description` | TextField | |
| `icon` | CharField | Emoji or icon name |
| `achievement_type` | CharField | `level \| course \| module \| special` |
| `earned_at` | DateTimeField | |

---

### `core.Activity`
School-wide events/activities (not tied to a specific session).

| Field | Type | Notes |
|---|---|---|
| `name` | CharField | |
| `course` | FK → Course (nullable) | |
| `date` | DateField | |
| `start_time` | TimeField | |
| `end_time` | TimeField | |
| `status` | CharField | `upcoming \| ongoing \| past` |

---

### `core.ParentContact`
Links a parent user to a learner.

| Field | Type | Notes |
|---|---|---|
| `learner` | FK → Learner | |
| `email` | EmailField | Must match a User with role=parent |
| `relationship` | CharField | e.g. "Mother", "Guardian" |
| `phone` | CharField | |

---

### `core.TeacherTask`
Personal to-do tasks for teachers.

| Field | Type | Notes |
|---|---|---|
| `teacher` | FK → User | |
| `title` | CharField | |
| `description` | TextField | |
| `due_date` | DateField | |
| `priority` | CharField | `low \| medium \| high \| urgent` |
| `status` | CharField | `todo \| in_progress \| done` |

---

## Key Relationships Diagram

```
User (role=learner)
  └── Learner
        ├── LearnerCourseEnrollment ──→ Course (Pathway)
        │     ├── current_level ──→ CourseLevel
        │     └── level_progress[] → LevelProgress
        ├── Attendance ──→ Session ──→ Module ──→ Course
        ├── Artifact
        └── Achievement ──→ Course / CourseLevel

User (role=teacher)
  └── Session ──→ Module ──→ Course
        └── Attendance ──→ Learner
```
