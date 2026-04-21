# Future Fundi — Product Requirements Document
**Version:** 1.0 (derived from Credential Architecture & Learning Framework v3.2)  
**Organization:** Fundi Bots  
**Last Updated:** April 2026  
**Status:** Active — For use with Claude Code

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Architecture](#2-core-architecture)
3. [Data Models](#3-data-models)
4. [Feature Requirements](#4-feature-requirements)
5. [Role-Based Access & Visibility](#5-role-based-access--visibility)
6. [Assessment & Recognition Logic](#6-assessment--recognition-logic)
7. [Dashboard Specifications](#7-dashboard-specifications)
8. [Content Management System](#8-content-management-system)
9. [Unlock & Progression Logic](#9-unlock--progression-logic)
10. [Offline-First Requirements](#10-offline-first-requirements)
11. [Technical Design Principles](#11-technical-design-principles)
12. [Structural Constraints](#12-structural-constraints)
13. [Pathway Catalogue](#13-pathway-catalogue)
14. [Open Questions & Deferred Decisions](#14-open-questions--deferred-decisions)

---

## 1. Project Overview

Future Fundi is a learner progression and credentialing platform for youth STEM education across Africa, delivered across school programs, holiday camps, and community pods. It must work for learners aged 6–18, across mixed-ability cohorts, with or without internet access.

### Core Goals

- Track learner growth from foundational readiness to workforce-facing competence
- Issue stackable, evidence-linked recognition (badges → microcredentials → certifications)
- Surface the right information to each user role (learner, parent, teacher, program manager)
- Work offline-first with retroactive digital sync
- Never lose partial progress — every completed step counts toward future recognition

### The Three Parallel Frameworks

Every learner simultaneously operates across three frameworks that answer five questions at any point in time:

| Framework | Structure |
|-----------|-----------|
| **Learning Framework** | Pathway → Track → Program → Module → Unit → Lesson → Task |
| **Recognition Framework** | Badge → Microcredential → Certification → Track Portfolio |
| **Development Framework (Growth Tree)** | Roots → Trunk → Branches → Leaves → Fruit |

**The five questions the system must always be able to answer for any learner:**
1. What are they studying?
2. What can they do?
3. What have they built?
4. What have they earned?
5. Where are they going next?

---

## 2. Core Architecture

### 2.1 Learning Hierarchy (7 Layers)

```
Pathway
  └── Track
        └── Program
              └── Module
                    └── Unit
                          └── Lesson
                                └── Task / Activity
```

**Layer definitions:**

| Layer | Description | Notes |
|-------|-------------|-------|
| **Pathway** | Broad future direction (e.g., Robotics, AI) | 8 pathways defined (see §13) |
| **Track** | Specialisation within a pathway | 2–4 per Pathway |
| **Program** | Bundled module sequence leading to a certification | 2–3 per Track. Name "Program" is a placeholder — to be reviewed. Equivalent to Syllabus/Curriculum or Coursera Specialization |
| **Module** | Themed instructional block | 3–5 per Program |
| **Unit** | Topic cluster inside a module | 3–6 per Module |
| **Lesson** | Single instructional session | 2–4 per Unit |
| **Task / Activity** | Discrete learner action | 2–5 per Lesson |

### 2.2 Growth Tree (5 Development Layers)

The Growth Tree is the core progression model. It simultaneously tracks growth, connects activity to evidence, organizes progression, generates recognition, and supports guidance decisions.

| Layer | Name | Contents |
|-------|------|----------|
| 🌱 **Roots** | Learner Readiness | Wellbeing, confidence, motivation, self-management, collaboration, safe tool behaviour |
| 🪵 **Trunk** | Core Skills | Numeracy, communication (written/verbal/visual), digital/data fluency, making and tool use |
| 🌿 **Branches** | Specialisation | Pathway-specific skills (Robotics, Web Dev, AI, etc.). Learners can develop multiple primary and secondary branches |
| 🍃 **Leaves** | Evidence | Artifacts, build logs, code repos, design files, dashboards, photos, videos, assessment evidence |
| 🍊 **Fruit** | Recognition & Transition | Badges, microcredentials, certifications, showcases, internships, pathway advancement |

### 2.3 Proficiency Levels

Levels are **competency-based, not age-based**. A 14-year-old joining for the first time begins at Level 1.

| Level | Name | Typical Age Band | What the Learner Can Do |
|-------|------|-----------------|------------------------|
| 1 | **Explorer** | 8–12 (or any beginner) | Follow guided tasks, name tools and concepts, complete structured exercises with strong scaffolding |
| 2 | **Builder** | 10–15 (or independent beginner) | Complete small projects independently, combine multiple skills into one artifact |
| 3 | **Practitioner** | 13–18 | Solve real problems, troubleshoot, explain design decisions, produce stronger portfolio evidence |
| 4 | **Pre-Professional** | 16–18 / workforce-facing | Work with external standards or real briefs, produce advanced demonstrations |

> **Implementation note:** Age bands are guidelines only. Levels attach to programs, modules, and individual learner status. The system must enforce level-based placement, not age-based access gating.

---

## 3. Data Models

All objects link to one another via evidence and recognition chains. No recognition object may exist without at least one linked evidence object.

### 3.1 Learner

```
Learner {
  learner_id         UUID (PK)
  name               string
  age                integer
  age_band           enum: "6-8" | "9-12" | "13-15" | "16-18"
  level              enum: Explorer | Builder | Practitioner | Pre-Professional
  cohort_ids         UUID[] (FK → Cohort)
  site_id            UUID (FK → Site)
  current_pathway_id UUID (FK → Pathway)
  current_track_id   UUID (FK → Track)
  current_program_id UUID (FK → Program)
  current_module_id  UUID (FK → Module)
  consent_flags      JSON
  created_at         timestamp
}
```

### 3.2 Growth Profile

```
GrowthProfile {
  profile_id    UUID (PK)
  learner_id    UUID (FK → Learner)
  roots_score   JSON  // sub-scores for each Roots dimension
  trunk_score   JSON  // sub-scores for each Trunk dimension
  branches      JSON  // { branch_name: score, primary: bool }[]
  leaves_count  integer
  fruit_count   integer
  updated_at    timestamp
}
```

### 3.3 Content Objects

#### Pathway
```
Pathway {
  pathway_id   UUID (PK)
  title        string
  description  string (2–3 sentences, learner-facing)
  icon         string
  color        string (hex)
  age_band_min integer
  age_band_target integer
  status       enum: Draft | Active | Archived
}
```

#### Track
```
Track {
  track_id      UUID (PK)
  pathway_id    UUID (FK → Pathway)
  title         string
  description   string (learner-facing)
  sequence_order integer
  status        enum: Draft | Active | Archived
}
```

#### Program
```
Program {
  program_id          UUID (PK)
  track_id            UUID (FK → Track)
  title               string
  level               enum: Explorer | Builder | Practitioner | Pre-Professional
  description         string (learner-facing outcome statement)
  sequence_order      integer
  certification_id    UUID (FK → CertificationTemplate)
  status              enum: Draft | Active | Archived
}
```

#### Module
```
Module {
  module_id              UUID (PK)
  program_id             UUID (FK → Program)
  title                  string
  outcome_statement      string (one sentence: "Learner can...")
  sequence_order         integer
  duration_sessions      integer
  microcredential_id     UUID (FK → MicrocredentialTemplate)
  unlock_gate            JSON  // { type: "previous_module" | "badge_set" | "none", ref_id: UUID | null }
  teacher_notes          text  // teacher-only
  status                 enum: Draft | Active | Archived
}
```

#### Unit
```
Unit {
  unit_id            UUID (PK)
  module_id          UUID (FK → Module)
  title              string
  learning_objectives string[]  // 2–4 items
  sequence_order     integer
  badge_criteria     string  // observable skill description
  badge_id           UUID (FK → BadgeTemplate)
  unlock_gate        JSON  // { type: "previous_unit" | "open", ref_id: UUID | null }
  status             enum: Draft | Active | Archived
}
```

#### Lesson
```
Lesson {
  lesson_id           UUID (PK)
  unit_id             UUID (FK → Unit)
  title               string
  duration_minutes    integer
  learner_objectives  string[]
  learner_content     text  // visible once unlocked
  teacher_content     text  // teacher-only: guide, timing, common mistakes, differentiation
  resource_links      JSON  // { url, title, type: "learner" | "teacher" }[]
  unlock_gate         JSON  // { type: "previous_lesson" | "unit_open" }
  completion_trigger  enum: task_submission | teacher_sign_off | auto_on_time
  status              enum: Draft | Active | Archived
}
```

#### Task / Activity
```
Task {
  task_id             UUID (PK)
  lesson_id           UUID (FK → Lesson)
  title               string
  type                enum: Observation | Submission | Quiz | Reflection | Practical | Peer_Review
  learner_instructions text  // visible once lesson unlocked
  teacher_rubric      text  // teacher-only
  answer_key          text  // teacher-only
  evidence_required   boolean
  artifact_type       enum: Photo | File | Text | Video | Code | Link | null
  completion_trigger  enum: submission | teacher_verification | auto
  sequence_order      integer
}
```

### 3.4 Recognition Objects

#### BadgeTemplate
```
BadgeTemplate {
  badge_template_id  UUID (PK)
  title              string
  unit_id            UUID (FK → Unit)  // which unit triggers this
  criteria           string
  icon_url           string
}
```

#### BadgeRecord (issued instance)
```
BadgeRecord {
  badge_record_id    UUID (PK)
  badge_template_id  UUID (FK → BadgeTemplate)
  learner_id         UUID (FK → Learner)
  date_awarded       timestamp
  issuer_id          UUID (FK → User)
  linked_artifact_ids UUID[]  // at least one required
  verification_ref   string
  source             enum: digital | offline_card_sync
}
```

#### MicrocredentialTemplate
```
MicrocredentialTemplate {
  microcredential_template_id UUID (PK)
  title                       string
  module_id                   UUID (FK → Module)
}
```

#### MicrocredentialRecord (issued instance)
```
MicrocredentialRecord {
  microcredential_record_id   UUID (PK)
  microcredential_template_id UUID (FK → MicrocredentialTemplate)
  learner_id                  UUID (FK → Learner)
  module_id                   UUID (FK → Module)
  badge_record_ids            UUID[]  // all contributing badges
  artifact_record_ids         UUID[]  // at least one required
  date_issued                 timestamp
  issuer_id                   UUID (FK → User)
}
```

#### CertificationRecord (issued instance)
```
CertificationRecord {
  certification_record_id     UUID (PK)
  certification_template_id   UUID (FK → CertificationTemplate)
  learner_id                  UUID (FK → Learner)
  program_id                  UUID (FK → Program)
  microcredential_record_ids  UUID[]  // 3–5 required
  capstone_artifact_id        UUID (FK → ArtifactRecord)
  reviewer_id                 UUID (FK → User)
  date_issued                 timestamp
}
```

### 3.5 Evidence Object

```
ArtifactRecord {
  artifact_id          UUID (PK)
  learner_id           UUID (FK → Learner)
  title                string
  type                 enum: Photo | File | Text | Video | Code | Link
  date_submitted       timestamp
  linked_module_id     UUID (FK → Module)
  linked_task_id       UUID (FK → Task)
  linked_badge_ids     UUID[]
  linked_microcredential_id UUID | null
  evidence_files       JSON  // { url, type }[]
  reflection           text
  verification_status  enum: Pending | Verified | Rejected
  quality_flag         enum: null | NeedsReview | Approved
  verified_by          UUID (FK → User) | null
  verified_at          timestamp | null
}
```

### 3.6 Module Progress Record

```
ModuleProgress {
  progress_id              UUID (PK)
  learner_id               UUID (FK → Learner)
  module_id                UUID (FK → Module)
  units_completed          integer
  units_total              integer
  attendance_count         integer
  artifact_submitted       boolean
  reflection_submitted     boolean
  teacher_verified         boolean
  quiz_passed              boolean
  microcredential_eligible boolean  // computed: all units done + artifact + reflection + verification
  completion_status        enum: NotStarted | InProgress | PartialComplete | Complete
}
```

### 3.7 Admin Override Log

```
AdminOverride {
  override_id     UUID (PK)
  actor_id        UUID (FK → User)
  learner_id      UUID (FK → Learner)
  layer           enum: Pathway | Track | Program | Module | Unit | Lesson
  layer_ref_id    UUID
  reason          text
  timestamp       timestamp
}
```

---

## 4. Feature Requirements

### 4.1 Learner Progression Engine

- **F-01:** Enforce unlock gates at every layer per §9
- **F-02:** Allow admin override of any gate; log all overrides with actor, reason, and timestamp
- **F-03:** Show all layers in preview mode to learners before they are unlocked (never hide, only lock)
- **F-04:** Compute and surface the next recommended step for every learner
- **F-05:** Carry all earned badges forward regardless of program dropout; badges never expire or reset

### 4.2 Recognition Engine

- **F-06:** Auto-trigger badge issuance when unit criteria are met and teacher verifies
- **F-07:** Auto-trigger microcredential eligibility when: all units in module complete + artifact submitted + reflection submitted + teacher verification recorded
- **F-08:** Auto-trigger certification eligibility when: 3–5 microcredentials earned in program + capstone reviewed
- **F-09:** Block any recognition from being issued without at least one linked evidence object (hard constraint)
- **F-10:** Badges earned during partial completion are retained and count toward future microcredentials if the learner returns

### 4.3 Offline Support

- **F-11:** Physical learner card system: badge stamps, unit stamps, and teacher signatures are valid completion inputs
- **F-12:** Support retroactive sync — when a device/platform is available, records are updated from the physical card
- **F-13:** Offline completion records must include: learner ID, unit/badge reference, teacher initials, and date
- **F-14:** Sync must be idempotent — re-importing the same physical card data does not duplicate records

### 4.4 Evidence Portfolio

- **F-15:** Every learner has an evidence portfolio containing all submitted artifacts with verification status
- **F-16:** Artifacts link to: the task that generated them, the module they belong to, any badges or microcredentials they support
- **F-17:** Portfolio is visible to learner, parent (summarized), teacher (with quality flags), and curriculum designer

### 4.5 Content Authoring

- **F-18:** Curriculum designers can create and edit all content object types (see §8)
- **F-19:** All modules must pass peer review before status can change from Draft to Active
- **F-20:** Teacher-only content (rubrics, answer keys, facilitator guides) is never exposed to learners or parents
- **F-21:** Content entry follows the 8-step workflow in §8.4

---

## 5. Role-Based Access & Visibility

### 5.1 Role Definitions

| Role | Hierarchy Visible | Key Permissions |
|------|-------------------|-----------------|
| **Learner / Student** | All 7 layers (locked layers in preview mode) | View pathway map; access unlocked content; track badges; submit artifacts |
| **Parent / Guardian** | Pathway → Program → Module → Unit only | View direction, current module, recent badges/microcredentials, latest artifact, next step |
| **Teacher / Facilitator** | All 7 layers (learner view + teacher view simultaneously) | Deliver sessions; verify artifacts; issue badges; manage unlock gates; view rubrics and answer keys |
| **Curriculum Designer** | All layers + content schema + assessment rules | Create/edit all content objects; set badge criteria; configure unlock gates |
| **Program Manager** | Aggregate dashboards (cohort and pathway level) | View completion rates, badge distribution, certification pipeline; drill down to individual on request |
| **Employer / Partner** | Certifications and Portfolio only | *(Deferred — ignore for now)* |

### 5.2 What Is Hidden Per Role

| Role | Hidden From |
|------|------------|
| Learner | Teacher notes, rubrics, answer keys, facilitator guides |
| Parent | Lesson/Task detail; assessment rubrics; cohort comparisons |
| Teacher | Nothing — full access |
| Program Manager | Individual task/lesson-level data by default (available on drill-down) |

### 5.3 Teacher Dual View Requirement

Teachers must see learner-facing content and teacher-only content **simultaneously** on the same screen. Implementation suggestion: learner content card on the left, teacher content card on the right. Do not require view-switching during a session.

---

## 6. Assessment & Recognition Logic

### 6.1 Assessment Levels

| Level | Trigger | What It Checks |
|-------|---------|----------------|
| **Task-Level** | Single lesson activity complete | Completed / Attempted / Demonstrated with support / Demonstrated independently |
| **Badge-Level** | Unit or skill cluster complete | Learner has shown a specific, observable skill to a defined standard |
| **Module-Level (Microcredential)** | All units in module complete | Attendance threshold + Artifact + Reflection + Teacher verification + Quiz/practical |
| **Program-Level (Certification)** | All modules in program complete | All modules done + required microcredentials + capstone reviewed + instructor validation |

### 6.2 Partial Completion Recognition

The system must reward genuine partial progress at every step.

| What the Learner Completed | Recognition Issued | Offline Mechanism |
|---------------------------|-------------------|-------------------|
| 1–2 lessons | Task Achievement (no formal record) | Teacher marks attendance card |
| 1 full unit | Unit Stamp | Stamp on physical card |
| 1–2 units + 1 observed skill | Badge (smallest formal recognition) | Digital badge issued on platform |
| 3–4 units in a module | Partial Completion Stamp + badges kept | Stamp + badge card |
| Full module + artifact | Microcredential | Digital + printed certificate |
| 3–5 modules in a Program | Certification at current level | Digital + printed cert + portfolio |
| All Programs in a Track | Track Completion Certificate + Portfolio | Full record on learner dashboard |

### 6.3 Key Recognition Rules

1. **Badges are always kept.** A learner who drops out keeps all earned badges. Returning learners' badges count toward future microcredentials — nothing is reset.
2. **Evidence is mandatory.** No badge, microcredential, or certification may be issued without at least one linked evidence object.
3. **Recognition is auditable.** Every issuance must record: who issued it, what evidence it links to, and when.

---

## 7. Dashboard Specifications

### 7.1 Learner Dashboard

| Section | Content |
|---------|---------|
| Growth Tree Visualization | Visual overview of learner's growth across all 5 layers |
| Learning Progress | Pathway → Track → Program → Current Module → Current Unit → Current Lesson |
| Recognition Earned | Badges earned; microcredentials earned; certifications in progress and completed |
| Cohort / Group | All groups the learner belongs to (school, pod, camp — may be multiple) |
| Evidence Portfolio | Artifacts created; verification status; reflections submitted |
| Next Step | Recommended next module or unit based on current progress and level |

### 7.2 Parent Dashboard

No layers below Module are exposed. Parents see:

| Field | Example |
|-------|---------|
| Growth Tree Visualization | Visual overview |
| Pathway | Robotics |
| Track | Robot Programming |
| Program | Robotics Foundations Program (Level 1) |
| Current Module | Motion & Mechanics |
| Latest Badge | Motor Wiring Badge |
| Latest Microcredential | Basic Circuits Microcredential |
| Artifact Completed | Line-following robot — tested on school corridor |
| Child's Cohort/Group | All groups the child is in |
| Next Step | Sensor-Controlled Robotics (Module 3) |
| Notifications | Messages or alerts from teachers |

### 7.3 Teacher Dashboard

| View | Content |
|------|---------|
| Cohort Progress | Progress by pathway and module across all learners |
| Badge Completion | Which badges learners are close to or missing |
| Microcredential Readiness | Which learners are eligible or not yet eligible |
| Artifact Quality | Completion status and quality flags for pending verification |
| Intervention Flags | Learners who are behind, missed sessions, or at risk |
| Certification Pipeline | Who is tracking toward certification and what remains |

> Clicking a learner's name switches from cohort-level to individual learner view.

### 7.4 Program Manager Dashboard

| View | Content |
|------|---------|
| Pathway Demand | Most-enrolled pathways and how demand is shifting |
| Module Completion Rates | By module, pathway, and site |
| Badge Distribution | Across cohorts, programs, and age bands |
| Microcredential Issuance | Volume and velocity across the system |
| Certification Completion | Pipeline and completion rates by program and level |
| Pathway Transitions | How learners move between tracks and programs |
| Regional Differences | Completion and recognition across delivery sites |
| Age-Band Progression | How progression patterns differ by age band |

---

## 8. Content Management System

### 8.1 Content Object Schema

See §3.3 for full field definitions per content type. Every content object is a typed object with a defined field set.

**Required fields summary per type:**

| Type | Minimum Required Fields |
|------|------------------------|
| Pathway | title, description, icon, color, age band, status |
| Track | parent pathway, title, description, sequence order, status |
| Program | parent track, title, level, description, sequence order, certification link, status |
| Module | parent program, title, outcome statement, sequence order, duration, microcredential link, unlock gate, status |
| Unit | parent module, title, learning objectives (2–4), sequence order, badge criteria, badge link, unlock gate, status |
| Lesson | parent unit, title, duration, learner content, teacher content, resource links, completion trigger, unlock gate, status |
| Task | parent lesson, title, type, learner instructions, teacher rubric, answer key, evidence required flag, completion trigger, sequence order |

### 8.2 Content Visibility Rules

| Layer | Learner Preview (Locked) | Access Gate |
|-------|--------------------------|-------------|
| Pathway | Always fully visible and explorable | None |
| Track | Visible with description | Enrolled in parent Pathway |
| Program | Visible with module map | Enrolled in parent Track OR admin-assigned |
| Module | Title + outcome + badge list visible; lessons locked | Previous module completed OR admin override |
| Unit | Title + objectives visible; lessons locked | Parent module unlocked |
| Lesson | Title + duration visible; content locked | Previous lesson complete OR first lesson of unlocked unit |
| Task | Fully visible | Parent lesson open |

### 8.3 Teacher vs Learner Content (Side by Side)

| Layer | Learner Sees | Teacher Sees (Additional) |
|-------|-------------|--------------------------|
| Pathway | Overview, pathway map | Enrollment stats, completion rates |
| Program | Module map with lock states, certification target | Full cohort progress, badge gaps, microcredential pipeline |
| Module | Outcome, unit list, badge targets | Facilitator notes, misconceptions, assessment rubric |
| Unit | Objectives, badge criteria, lesson list | Scaffolding notes, differentiation, badge sign-off checklist |
| Lesson | Instructions, task list, resource links | Facilitator guide, timing plan, answer key, extension prompts |
| Task | Step-by-step instructions, submission interface | Rubric, expected output, verification checklist, notes field |

### 8.4 Content Entry Workflow (8 Steps)

```
1. Select parent Program
   Navigate: Pathway → Track → Program

2. Create Module
   Enter: title, outcome statement, duration, sequence order, unlock gate
   Set status: Draft

3. Add Units (3–6)
   For each: title, learning objectives, sequence order, badge criteria, badge link

4. Add Lessons (2–4 per unit)
   For each: title, duration, learner content, teacher content, resource links,
   completion trigger, unlock gate

5. Add Tasks (2–5 per lesson)
   For each: title, type, learner instructions, teacher rubric, answer key,
   evidence flag, artifact type

6. Link Recognition
   Confirm badge links at Unit level
   Confirm microcredential link at Module level
   Confirm certification link at Program level

7. Peer Review
   Second curriculum designer or department lead reviews all content
   Feedback logged in platform

8. Publish
   Change Module status: Draft → Active
   Unlock gates activate
   Enrolled learners can now see module in preview mode
```

---

## 9. Unlock & Progression Logic

### 9.1 Gate Rules

```
Pathway  → No gate (always visible and accessible)
Track    → Enrolled in parent Pathway
Program  → Enrolled in parent Track OR admin override
Module   → Previous module complete OR admin override
Unit     → Parent module unlocked
Lesson   → Previous lesson in unit complete OR first lesson of unlocked unit
Task     → Parent lesson open (no additional gate)
```

### 9.2 Preview vs Access

- **Preview:** Learner can always see what is ahead — title, description, badge targets, lock icon
- **Access:** Learner can open, interact with, and submit content only when gate is cleared
- Content is never hidden entirely from learners — only locked

### 9.3 Admin Override

- Any role with admin rights can manually unlock any layer for any learner
- Use cases: learner re-joining mid-program; offline completion being synced; exceptional circumstance
- All overrides logged: actor, learner, layer, layer reference, reason, timestamp

---

## 10. Offline-First Requirements

### 10.1 Physical Learner Card System

The platform must support a physical learner card as a valid input mechanism. Digital records may not exist until a device is available.

**Physical card must support:**
- Task achievement marks (teacher signature or sticker)
- Unit stamps (rubber stamp)
- Badge records (sticker or stamp)
- Partial completion stamps
- Teacher sign-off fields

### 10.2 Sync Requirements

- Physical card data must be importable into the platform retroactively
- Sync is idempotent — importing the same card twice does not create duplicate records
- Synced records are marked with `source: offline_card_sync`
- Retroactive sync must update: badge records, unit completion, module progress, artifact links

### 10.3 Offline Delivery Constraints

- Badge and stamp logic must be executable without internet or device
- Teacher must be able to run a full session using only the physical card
- All recognition earned offline is valid and carries forward

---

## 11. Technical Design Principles

| Principle | What It Means in Practice |
|-----------|--------------------------|
| **Modular** | New pathways, tracks, and modules can be added without structural changes. Schema is extensible. |
| **Hierarchical but queryable** | Queries must work at any layer — by pathway, program, module, badge, or individual learner. Not just top-down reports. |
| **Evidence-linked** | Recognition is evidence-based and auditable. No badge, microcredential, or certification without a linked evidence object. Hard constraint. |
| **Role-sensitive** | Same underlying data; interface filtered by role. Do not create separate data pipelines per role. |
| **Age-flexible** | Younger learners stop at badges and microcredentials. Older learners reach certifications. System handles both without structural changes. |
| **Pathway-aware** | Support specialisation (depth in one pathway) and exploration (sampling across branches). |
| **Offline-first compatible** | Physical learner cards, stamps, and teacher sign-offs are valid inputs. Digital records updated retroactively. |

---

## 12. Structural Constraints

These are hard limits the curriculum content must stay within. Enforced in the content authoring UI.

| Layer | Rule |
|-------|------|
| 1 Pathway | Contains 2–4 Tracks |
| 1 Track | Contains 2–3 Programs |
| 1 Program | Contains 3–5 Modules |
| 1 Module | Contains 3–6 Units |
| 1 Unit | Contains 2–4 Lessons |
| 1 Lesson | Contains 2–5 Tasks |
| 1 Badge | Requires 1 unit OR 2–4 lessons + one observable skill |
| 1 Microcredential | Requires full module completion + 1 artifact |
| 1 Certification | Requires 3–5 microcredentials + capstone |

> The Future Fundi curriculum team has final say on these figures. The system should surface warnings (not hard blocks) when structural limits are approached, and hard blocks when they are exceeded.

---

## 13. Pathway Catalogue

Eight pathways are defined. Each follows the same structural template. Content details are examples — curriculum team may adjust.

### 13.1 Robotics
- **Tracks:** Robot Building | Robot Programming | Autonomous Systems
- **Programs:** Robotics Foundations (L1) | Mobile Robotics (L2) | Autonomous Robotics (L3)
- **Sample Modules (L1):** Robot Parts & Safety | Basic Circuits for Robotics | Motion & Mechanics | Intro to Robot Logic
- **Certifications:** Robotics Explorer | Robotics Builder | Robotics Practitioner
- **Africa-grounded artifacts:** Obstacle-avoiding robot for a school corridor; boda boda traffic counter; automated market stall security alert robot

### 13.2 Web Development
- **Tracks:** Front-End Design | Interactive Web Development | Web Experience Design
- **Programs:** Web Foundations (L1) | Front-End Builder (L2) | Interactive Web Projects (L3)
- **Sample Modules (L1):** Web Basics | HTML Page Building | Styling with CSS | Publishing a Web Page
- **Certifications:** Web Development Explorer | Front-End Builder | Website Practitioner
- **Africa-grounded artifacts:** School club website with Luganda/English toggle; community market vendor directory; WASH awareness campaign landing page

### 13.3 Application Development
- **Tracks:** Mobile Applications | Desktop Applications | Problem-Solving Applications
- **Programs:** App Design Foundations (L1) | App Builder (L2) | Applied App Solutions (L3)
- **Sample Modules (L1):** Understanding Users & Problems | App Screen Design | Basic App Logic | Testing an App Prototype
- **Certifications:** App Development Explorer | App Builder | Application Practitioner
- **Africa-grounded artifacts:** School fees SMS reminder app prototype; boda boda route fare calculator; village water point outage reporting tool

### 13.4 Data Science
- **Tracks:** Data Analysis | Data Visualization | Community Data & Decision-Making
- **Programs:** Data Foundations (L1) | Data Analysis (L2) | Applied Data Decisions (L3)
- **Sample Modules (L1):** What Data Is | Collecting Clean Data | Spreadsheet Analysis | Visualising Data
- **Certifications:** Data Science Explorer | Data Analyst | Data Practitioner
- **Africa-grounded artifacts:** Regional rainfall vs crop yield comparison chart; school meal program attendance dashboard; borehole water quality audit spreadsheet

### 13.5 Artificial Intelligence
- **Tracks:** AI Foundations | Computer Vision | Language Systems
- **Programs:** AI Foundations (L1) | AI for Images (L2) | Applied AI Systems (L3)
- **Sample Modules (L1):** What AI Is | Data for AI | Training Simple Models | Responsible AI
- **Certifications:** AI Explorer | AI Builder | Applied AI Practitioner
- **Africa-grounded artifacts:** Maize disease leaf classifier (local crop data); urban road defect image detection; simple chatbot for school fee queries; AI ethics poster in local language and English

### 13.6 3D Printing
- **Tracks:** 3D Design | Printing Operations | Product Prototyping
- **Programs:** 3D Design Foundations (L1) | 3D Printing Operations (L2) | Prototype Development (L3)
- **Sample Modules (L1):** Introduction to 3D Design | Designing for Print | Printer Setup & Safety | Print Improvement
- **Certifications:** 3D Printing Explorer | 3D Prototype Builder | 3D Product Developer
- **Africa-grounded artifacts:** Replacement bracket for a broken school desk; water filter housing prototype; low-cost prosthetic hand prototype for community use

### 13.7 Internet of Things
- **Tracks:** Sensor Systems | Smart Devices | Monitoring & Alert Systems
- **Programs:** Connected Devices Foundations (L1) | Smart Sensor Systems (L2) | Monitoring & Alerts (L3)
- **Sample Modules (L1):** Intro to Connected Devices | Sensors & Inputs | Data Logging | Alerts & Automation
- **Certifications:** IoT Explorer | Smart Devices Builder | IoT Practitioner
- **Africa-grounded artifacts:** School borehole water level monitor; solar battery charge tracker with SMS alert; classroom air quality and temperature logger; smart handwashing station

### 13.8 Electronics
- **Tracks:** Circuit Foundations | Embedded Electronics | Repair & Troubleshooting
- **Programs:** Electronics Foundations (L1) | Circuit Builder (L2) | Repair Skills (L3)
- **Sample Modules (L1):** Electrical Safety | Basic Circuits | Components & Functions | Measuring & Testing
- **Certifications:** Electronics Explorer | Circuit Builder | Electronics Technician Foundations
- **Africa-grounded artifacts:** Solar lantern repair log; LED circuit board for school hallway lighting; phone charger fault diagnosis sheet; simple alarm circuit for a livestock enclosure

---

## 14. Open Questions & Deferred Decisions

| # | Question | Status |
|---|----------|--------|
| 1 | **"Program" naming** — The word "Program" is a placeholder. Alternatives: Syllabus, Curriculum, Specialization. Needs review by curriculum team before launch. | 🟡 Open |
| 2 | **Employer / Partner portal** — Described in audience layers but explicitly deferred. No implementation required for MVP. | 🔴 Deferred |
| 3 | **Growth Tree visualization** — MVP uses a node-based graph. Final version is intended to be child-friendly and illustrated (see original doc figures). Design not finalized. | 🟡 Open |
| 4 | **Attendance threshold for microcredential** — Referenced in assessment logic but specific percentage not defined. Curriculum team to specify. | 🟡 Open |
| 5 | **Physical card import UX** — How teachers enter offline card data into the platform is not specified. Needs workflow design. | 🟡 Open |
| 6 | **Notification system** — Parent dashboard references "notifications or messages from teachers." Notification delivery mechanism not specified. | 🟡 Open |
| 7 | **Structural limit enforcement** — Whether layer limits (e.g., 3–6 units per module) are hard blocks or warnings in the authoring UI is not specified. Recommendation: warnings at threshold, hard blocks at ceiling. | 🟡 Open |

---

*Future Fundi | Fundi Bots | Derived from Credential Architecture & Learning Framework v3.2 | March 2026*  
*This PRD is CONFIDENTIAL — Internal Working Document*
