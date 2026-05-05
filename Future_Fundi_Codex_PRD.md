# Product Requirements Document: Future Fundi Credential Architecture Platform

Source document: `Future_Fundi_Credential_Architecture_Learning_Framework_v3.2.docx.pdf`  
Prepared for: Codex implementation planning  
Document date: 2026-05-05

## 1. Product Summary

Future Fundi is a learner progression, credentialing, evidence portfolio, and dashboard platform for Fundi Bots learning programs. The product must represent a seven-layer learning hierarchy, a five-layer learner-development model called the Growth Tree, and a stackable recognition ladder where badges, microcredentials, certifications, and track portfolios are always linked to verifiable evidence.

The platform must support schools, holiday camps, and community pods, including learners who complete only part of a program. The central promise is: every meaningful step is recognized, nothing earned is lost, and records can be captured offline first and synchronized later.

## 2. Goals

1. Model Future Fundi's learning architecture from Pathway down to Task.
2. Show learners a visible progression map with locked and unlocked content.
3. Award recognition only when required evidence exists.
4. Preserve partial progress across interrupted, camp-based, or drop-in learning.
5. Support distinct learner, parent, teacher, content manager, and program manager views from the same underlying data.
6. Allow curriculum teams to author and publish structured content using a consistent schema.
7. Support offline-first inputs such as stamps, cards, teacher signatures, and later digital reconciliation.
8. Provide dashboards for learner progress, parent visibility, teacher intervention, and program management reporting.

## 3. Non-Goals

1. Employer or external partner verification is not in MVP scope, though the data model should not block future partner portfolio access.
2. Automated AI assessment is not required for MVP.
3. Payments, billing, and enrollment commerce are out of scope unless requested separately.
4. Real-time classroom delivery tooling, live chat, and video lessons are out of scope for the first implementation.
5. A fully polished child-friendly Growth Tree illustration is not required for MVP; MVP can use a clear node-based visualization.
6. National accreditation workflows are out of scope until certification governance is defined.

## 4. Primary Actors

### Learner / Student

Uses the platform to see their full pathway map, access unlocked content, preview locked future content, complete tasks, submit evidence, view badges and credentials, and understand the next step.

### Parent / Guardian

Uses the platform to see a simplified child progress view down to Unit level only, including pathway direction, current program/module, recent recognition, latest artifact, cohort/group context, and next step.

### Teacher / Facilitator

Uses the platform to view learner-facing and teacher-only content side by side, manage unlock gates, verify artifacts, issue badges, capture offline progress, add comments, and monitor cohort progress.

### Curriculum Designer / Content Manager

Uses the platform to create, edit, peer review, and publish structured curriculum objects, recognition rules, unlock gates, badge criteria, and assessment rubrics.

### Program Manager

Uses the platform to view aggregate dashboards across cohorts, pathways, sites, age bands, badges, microcredentials, certifications, and progression pipelines.

### Employer / Partner

Not an MVP actor. Future scope may allow access to verified certifications, selected portfolio artifacts, and readiness narratives.

## 5. Core Concepts

## 5.1 Learning Hierarchy

The system must model seven instructional layers:

1. Pathway: broad future direction, such as Robotics or Web Development.
2. Track: specialization within a pathway.
3. Program: bundled sequence of modules leading to a meaningful outcome. The term "Program" is provisional and may be renamed.
4. Module: themed block of learning.
5. Unit: topic cluster inside a module.
6. Lesson: instructional session.
7. Task / Activity: specific learner action inside a lesson.

All seven layers are visible to learners. Locked content is previewable but not accessible for interaction or submission.

## 5.2 Growth Tree Development Model

The Growth Tree is the learner-development model:

1. Roots: readiness, wellbeing, confidence, motivation, self-management, collaboration, safety habits.
2. Trunk: core numeracy, reasoning, communication, digital fluency, data fluency, making, tool use, and safety.
3. Branches: specialization areas such as Robotics, Web Development, App Development, Data Science, AI, 3D Printing, IoT, and Electronics.
4. Leaves: artifacts, prototypes, reflections, build logs, code repos, design files, dashboards, photos, videos, and assessment evidence.
5. Fruit: badges, microcredentials, certifications, showcase selections, capstones, internships, shadow days, placements, advancement, and recommendations.

The platform must track and display learner growth across these layers, but MVP visualization may use a node-based tree rather than a highly illustrated final design.

## 5.3 Recognition Ladder

Recognition is separate from the learning hierarchy:

1. Badge: earned after a unit or skill cluster, typically 2-4 lessons, when a discrete observable skill is demonstrated.
2. Microcredential: earned after a full module plus required artifact evidence.
3. Certification: earned after 3-5 modules in a program plus capstone or final review.
4. Track Portfolio: earned after completing a full track, with a readiness narrative and selected verified evidence.

Recognition must never be awarded without at least one linked evidence object.

## 5.4 Proficiency Levels

Levels are competency-based, not age-based:

1. Level 1, Explorer: guided tasks, tool naming, concepts, structured exercises, strong scaffolding.
2. Level 2, Builder: small independent projects and combined skills in one artifact.
3. Level 3, Practitioner: real problem solving, troubleshooting, design explanation, stronger portfolio evidence.
4. Level 4, Pre-Professional: external standards or real briefs, advanced demonstrations, partner-ready or workforce-facing evidence.

Age bands are guidance only. A new 14-year-old beginner starts at Explorer.

## 6. MVP Scope

The MVP must include:

1. Content hierarchy management for Pathway, Track, Program, Module, Unit, Lesson, and Task.
2. Role-based visibility for learner, parent, teacher, content manager, and program manager.
3. Learner dashboard with progression map, current location, recognition, portfolio evidence, cohort/group, and next step.
4. Parent dashboard with simplified hierarchy and recent progress.
5. Teacher dashboard with cohort progress, badge readiness, artifact verification, intervention flags, and individual drill-down.
6. Program manager dashboard with aggregate reporting by pathway, module, site, cohort, age band, and recognition type.
7. Evidence object creation and linking to tasks, badges, microcredentials, and certifications.
8. Badge issuance based on unit or skill-cluster completion plus evidence or teacher sign-off.
9. Microcredential issuance based on full module completion plus artifact evidence.
10. Certification eligibility tracking based on required microcredentials plus capstone review.
11. Offline progress capture model for stamps, cards, teacher signatures, and retroactive synchronization.
12. Content entry workflow from draft to peer review to active publication.
13. Unlock gate rules with logged admin override.
14. Seed content for the eight example pathways.

## 7. Future Scope

1. Partner or employer-facing verified portfolio access.
2. Internship, shadow day, and placement workflows.
3. Rich child-friendly Growth Tree visualization.
4. AI-assisted recommendations and intervention insights.
5. External accreditation, partner validation, and credential export.
6. Advanced portfolio showcase builder.
7. SMS or WhatsApp notifications for parents and offline-first environments.
8. Mobile-first offline data capture app for facilitators.

## 8. Functional Requirements

### FR1: Learning Hierarchy

The system shall allow authorized content managers to create and manage:

1. 2-4 Tracks per Pathway.
2. 2-3 Programs per Track.
3. 3-5 Modules per Program.
4. 3-6 Units per Module.
5. 2-4 Lessons per Unit.
6. 2-5 Tasks per Lesson.

Acceptance criteria:

1. A content object cannot be published without its required parent link.
2. Sequence order must be unique within each parent object.
3. Draft, Active, and Archived states must be supported.
4. Archived content must not be assigned to new learners but must remain available for historical records.

### FR2: Role-Based Visibility

The system shall filter the same underlying data by user role.

Acceptance criteria:

1. Learners can see all seven hierarchy layers but cannot access locked content.
2. Parents can see Pathway, Track, Program, Module, Unit, latest recognition, latest artifact, cohort/group, and next step. Parents must not see lesson details, task details, rubrics, answer keys, or cohort comparisons.
3. Teachers can see all learner content and all teacher-only content.
4. Curriculum designers can author and configure all content objects and assessment rules.
5. Program managers see aggregate dashboards by default, with individual drill-down only where permitted.

### FR3: Unlock Logic

The system shall support progressive unlocking and preview states.

Default unlock rules:

1. Pathway: always visible.
2. Track: accessible when learner is enrolled in parent Pathway.
3. Program: accessible when learner is enrolled in parent Track or admin-assigned.
4. Module: accessible when previous module is completed or admin override is applied.
5. Unit: accessible when parent module is unlocked.
6. Lesson: accessible when previous lesson is completed in the unit, or when it is the first lesson of an unlocked unit.
7. Task: accessible when parent lesson is open.

Acceptance criteria:

1. Locked nodes display title and preview metadata but hide restricted content and submissions.
2. Unlock override can be performed by teacher or program manager roles.
3. Every override records actor, timestamp, target object, learner, and reason.
4. Overrides must not delete or rewrite existing progress history.

### FR4: Evidence and Artifact Records

The system shall store artifacts as first-class evidence objects.

Supported evidence types:

1. Photo.
2. File.
3. Text.
4. Video.
5. Code.
6. Link.
7. Teacher observation.
8. Offline card/stamp/signature reference.

Acceptance criteria:

1. Every formal recognition record links to at least one evidence object.
2. Evidence can link to task, unit, module, badge, microcredential, and certification records.
3. Evidence has verification status: Submitted, Pending Verification, Verified, Rejected, Needs Revision.
4. Teacher verification records actor, timestamp, rubric reference, optional quality flag, and comments.

### FR5: Badge Issuance

The system shall award badges when learners complete badge criteria for a unit or skill cluster.

Acceptance criteria:

1. A badge requires one unit or 2-4 lessons plus one observable skill.
2. A badge cannot be issued without evidence or teacher sign-off.
3. Badge records include badge ID, learner ID, date awarded, issuer, linked tasks/artifacts, and verification reference.
4. Badges are permanent learner records and count toward later microcredentials even if the learner drops out and returns.

### FR6: Microcredential Issuance

The system shall issue a microcredential after full module completion plus artifact evidence.

Acceptance criteria:

1. Module completion checks attendance threshold, required unit completion, assessment results, artifact completion, reflection submission where configured, and teacher verification.
2. A microcredential links to module, learner, required badges, artifact evidence, issuer, and date issued.
3. Microcredential eligibility can be viewed by teachers before issuance.

### FR7: Certification Eligibility

The system shall track program-level certification readiness.

Acceptance criteria:

1. Certification requires 3-5 microcredentials in a Program plus capstone or final review.
2. Certification record links to learner, program, microcredentials, capstone reference, reviewer, and issue date.
3. Teachers and program managers can see certification pipeline status.
4. Certification is not auto-issued until review requirements are satisfied.

### FR8: Partial Completion

The system shall preserve partial progress and make it meaningful.

Recognition mapping:

1. 1-2 lessons: task achievement sticker, no formal digital record required.
2. 1 full unit: unit stamp.
3. 1-2 units plus observed skill: badge.
4. 3-4 units in a module: partial completion stamp plus earned badges kept.
5. Full module plus artifact: microcredential.
6. 3-5 modules in a program: certification.
7. Full track: track completion certificate plus portfolio.

Acceptance criteria:

1. Partial records must not be erased when a learner leaves a cohort or changes delivery format.
2. Learners returning later keep earned badges and can continue toward microcredentials.
3. Offline partial completion can be reconciled into the digital record later.

### FR9: Offline-First Capture

The system shall support offline capture and retroactive record updates.

Acceptance criteria:

1. Teachers can create an offline evidence/progress entry referencing a card, stamp, signature, or attendance sheet.
2. Offline entries include source type, date observed, facilitator, learner, linked learning object, and notes.
3. Reconciliation converts offline entries into digital completion, evidence, or recognition records after verification.
4. The system maintains an audit trail from physical source to digital update.

### FR10: Content Entry Workflow

The system shall support an authoring workflow for curriculum designers.

Workflow:

1. Select parent Program.
2. Create Module with title, outcome, duration, sequence order, unlock gate, and Draft status.
3. Add 3-6 Units with title, objectives, sequence order, badge criteria, and badge link.
4. Add 2-4 Lessons per Unit with learner content, teacher content, resources, completion trigger, and unlock gate.
5. Add 2-5 Tasks per Lesson with type, learner instructions, teacher rubric, answer key, evidence flag, and artifact type.
6. Link recognition at Unit, Module, and Program levels.
7. Send for peer review.
8. Publish as Active.

Acceptance criteria:

1. Published modules require peer review approval.
2. Reviewer feedback is logged.
3. Active modules activate unlock gates and become visible in preview mode to enrolled learners.
4. Teacher-only fields remain hidden from learners and parents.

### FR11: Dashboards

The system shall provide role-specific dashboards.

Learner dashboard must include:

1. Growth Tree visualization.
2. Learning progress from Pathway to current Lesson.
3. Recognition earned and in progress.
4. Cohort/group/class memberships.
5. Evidence portfolio.
6. Recommended next step.

Parent dashboard must include:

1. Growth Tree overview.
2. Pathway, Track, Program, and Current Module.
3. Latest Badge.
4. Latest Microcredential.
5. Latest Artifact.
6. Child cohort/group/class.
7. Next step.
8. Optional teacher notifications.

Teacher dashboard must include:

1. Cohort progress.
2. Badge completion gaps.
3. Microcredential readiness.
4. Artifact quality and verification queue.
5. Intervention flags for missed sessions, stalled progress, or non-completion risk.
6. Certification pipeline.
7. Individual learner drill-down.

Program manager dashboard must include:

1. Pathway demand.
2. Module completion rates.
3. Badge distribution.
4. Microcredential issuance volume and velocity.
5. Certification completion rates.
6. Pathway transitions.
7. Regional/site differences.
8. Age-band progression.

### FR12: Recommendations and Intervention Flags

The system shall create basic next-step suggestions and intervention prompts.

Acceptance criteria:

1. Learner next step can be generated from current unlocked object, completion status, proficiency level, and pathway record.
2. Teachers can see intervention flags for missed sessions, incomplete artifacts, missing badge criteria, or stalled module progress.
3. Program managers can see aggregate trends without exposing unnecessary individual task-level data by default.

## 9. Data Model Requirements

The implementation should include these core entities. Exact table or collection names may vary by stack.

### User and Role

Fields:

1. id.
2. name.
3. email or phone.
4. role.
5. site IDs.
6. cohort IDs.
7. auth provider ID.
8. status.

Roles:

1. learner.
2. parent.
3. teacher.
4. curriculum_designer.
5. program_manager.
6. admin.
7. partner, future only.

### Learner

Fields:

1. learner_id.
2. user_id.
3. name.
4. age_band.
5. proficiency_level.
6. cohort_ids.
7. site_id.
8. current_pathway_id.
9. current_track_id.
10. current_program_id.
11. current_module_id.
12. consent_flags.
13. status.

### Content Objects

Shared fields:

1. id.
2. title.
3. description.
4. parent_id.
5. sequence_order.
6. status: Draft, Active, Archived.
7. created_by.
8. updated_by.
9. created_at.
10. updated_at.

Object-specific fields:

1. Pathway: icon, color, minimum age band, target age band.
2. Track: parent pathway ID.
3. Program: parent track ID, proficiency level, certification awarded.
4. Module: parent program ID, outcome statement, duration sessions, microcredential awarded, unlock gate, teacher notes.
5. Unit: parent module ID, learning objectives, badge criteria, badge awarded, unlock gate.
6. Lesson: parent unit ID, duration minutes, learner objectives, learner content, teacher content, resource links, unlock gate, completion trigger.
7. Task: parent lesson ID, type, learner instructions, teacher rubric, answer key, evidence required, artifact type, completion trigger.

### Growth Profile

Fields:

1. learner_id.
2. roots indicators.
3. trunk indicators.
4. branch strengths.
5. leaf/artifact counts and quality markers.
6. fruit/recognition summary.
7. updated_at.

### Enrollment and Progress

Fields:

1. learner_id.
2. content_object_id.
3. content_object_type.
4. status: Not Started, Preview, Unlocked, In Progress, Completed, Verified, Blocked.
5. completion_percentage.
6. unlocked_at.
7. completed_at.
8. verified_at.
9. verified_by.
10. source: digital, offline_reconciled, admin_override.

### Artifact / Evidence

Fields:

1. artifact_id.
2. learner_id.
3. title.
4. type.
5. file_or_link_reference.
6. text_response.
7. linked_task_ids.
8. linked_unit_id.
9. linked_module_id.
10. linked_badge_ids.
11. linked_microcredential_id.
12. reflection.
13. verification_status.
14. quality_rubric.
15. verified_by.
16. verified_at.
17. teacher_comments.

### Recognition Records

Badge fields:

1. badge_id.
2. learner_id.
3. badge_definition_id.
4. date_awarded.
5. issuer_id.
6. linked_task_ids.
7. linked_artifact_ids.
8. verification_reference.

Microcredential fields:

1. microcredential_id.
2. learner_id.
3. module_id.
4. linked_badge_ids.
5. artifact_evidence_ids.
6. date_issued.
7. issuer_id.

Certification fields:

1. certification_id.
2. learner_id.
3. program_id.
4. linked_microcredential_ids.
5. capstone_artifact_id.
6. reviewer_id.
7. date_issued.
8. status.

Track portfolio fields:

1. portfolio_id.
2. learner_id.
3. track_id.
4. selected_artifact_ids.
5. certification_ids.
6. readiness_narrative.
7. published_status.

### Offline Capture

Fields:

1. offline_entry_id.
2. learner_id.
3. source_type: card, stamp, sticker, teacher_signature, attendance_sheet, other.
4. observed_date.
5. captured_by.
6. site_id.
7. cohort_id.
8. linked_content_object_id.
9. linked_content_object_type.
10. notes.
11. reconciliation_status: Pending, Accepted, Rejected, Needs Review.
12. reconciled_by.
13. reconciled_at.
14. generated_record_ids.

### Audit Log

Fields:

1. audit_id.
2. actor_id.
3. action_type.
4. target_type.
5. target_id.
6. learner_id, when applicable.
7. before_snapshot.
8. after_snapshot.
9. reason.
10. timestamp.

## 10. Key System Invariants

1. Recognition without linked evidence is invalid.
2. Badges, microcredentials, and certifications are append-only learner achievements; corrections must use reversal or supersession records rather than destructive deletion.
3. Learners can preview locked future content, but restricted content remains inaccessible until unlock.
4. Parents must never see teacher-only notes, rubrics, answer keys, or operational cohort comparisons.
5. Teacher overrides must be audited with a reason.
6. Age band must not be used as a hard gate for proficiency placement.
7. Offline records are valid inputs but require reconciliation before they generate formal digital recognition.
8. Archived content remains queryable for historical learner records.
9. Sequence order is stable within a parent content object.
10. Teacher-only and learner-facing content must be stored or tagged so role filtering cannot leak hidden fields.

## 11. Seed Pathways

MVP should seed the following pathways with sample tracks, programs, modules, badges, microcredentials, certifications, and locally grounded artifacts:

1. Robotics.
2. Web Development.
3. Application Development.
4. Data Science.
5. Artificial Intelligence.
6. 3D Printing.
7. Internet of Things.
8. Electronics.

Seed content can be treated as editable draft data owned by the curriculum team. It must not require schema changes when revised.

## 12. Security, Privacy, and Permissions

1. Enforce role-based access control on every API route and data query.
2. Protect minors' data with explicit consent flags and least-privilege access.
3. Store evidence files in private storage with signed or permission-checked access.
4. Prevent parents from viewing unrelated learners or cohort comparisons.
5. Prevent learners from seeing teacher-only content through direct API access.
6. Log credential issuance, overrides, verification, reconciliation, and publication actions.
7. Validate all content entry fields at the system boundary.
8. Treat uploaded files as untrusted; validate file type, size, and storage policy.
9. Do not expose sensitive implementation details in user-facing errors.
10. Require admin-level controls for destructive archival, role changes, and credential correction workflows.

## 13. Analytics and Reporting

The system should support these queries:

1. Learner progress by Pathway, Track, Program, Module, Unit, Lesson, and Task.
2. Badge distribution by cohort, site, program, pathway, and age band.
3. Microcredential issuance volume and velocity.
4. Certification completion pipeline.
5. Module completion rate by pathway and site.
6. Pathway demand and transitions.
7. Artifact verification queue and quality flags.
8. Learners at risk of non-completion.
9. Offline entries awaiting reconciliation.
10. Parent-facing latest recognition and latest artifact.

## 14. User Stories

### Learner

1. As a learner, I want to see the full pathway map so I know what is coming next.
2. As a learner, I want locked content to show a preview so my progress feels visible.
3. As a learner, I want to upload artifacts so my work can count toward recognition.
4. As a learner, I want to keep earned badges even if I pause and return later.
5. As a learner, I want to know my next recommended module or unit.

### Parent

1. As a parent, I want a simple view of my child's current pathway, program, module, badges, latest artifact, and next step.
2. As a parent, I do not want operational classroom detail, but I do want confidence that progress is real and evidence-backed.

### Teacher

1. As a teacher, I want learner and teacher content side by side so I can facilitate sessions efficiently.
2. As a teacher, I want to verify artifacts and issue badges when criteria are met.
3. As a teacher, I want to manually unlock content with a logged reason when a learner rejoins or completes work offline.
4. As a teacher, I want to see which learners are close to badges, microcredentials, or certifications.
5. As a teacher, I want to capture offline stamps or signatures and reconcile them later.

### Curriculum Designer

1. As a curriculum designer, I want to create structured modules using a consistent schema.
2. As a curriculum designer, I want peer review before publication so content quality is controlled.
3. As a curriculum designer, I want to link badge, microcredential, and certification rules to the learning hierarchy.

### Program Manager

1. As a program manager, I want aggregate dashboards so I can understand performance across sites and pathways.
2. As a program manager, I want to see recognition pipeline health so I can plan delivery and partnerships.
3. As a program manager, I want to know where learners are dropping off or stalling.

## 15. Suggested Implementation Phases

### Phase 1: Foundation Data Model and RBAC

Build:

1. User, role, learner, site, cohort, and enrollment models.
2. Content hierarchy models.
3. Status lifecycle for Draft, Active, Archived.
4. Role-based permissions.
5. Seed pathway data.

Exit criteria:

1. Content hierarchy can be created and queried.
2. Role filters protect teacher-only fields.
3. Seed pathways render through API or admin interface.

### Phase 2: Learner Progress and Unlocking

Build:

1. Progress records.
2. Unlock gate engine.
3. Learner dashboard.
4. Parent dashboard.
5. Admin override with audit logging.

Exit criteria:

1. Learners can preview locked nodes and access unlocked content.
2. Parent view hides lesson/task/rubric details.
3. Overrides are logged and visible to authorized staff.

### Phase 3: Evidence and Recognition

Build:

1. Artifact/evidence records and upload/link workflow.
2. Teacher verification queue.
3. Badge issuance.
4. Microcredential eligibility and issuance.
5. Certification eligibility tracking.

Exit criteria:

1. Recognition cannot be issued without evidence.
2. Badges remain available after learner pause/return.
3. Teacher can verify artifacts and issue recognition.

### Phase 4: Content Authoring Workflow

Build:

1. Structured module authoring.
2. Unit, lesson, task editors.
3. Teacher-only and learner-facing content separation.
4. Peer review workflow.
5. Publication workflow.

Exit criteria:

1. A curriculum designer can create a module from draft through active publication.
2. Reviewer feedback is recorded.
3. Published modules activate preview and unlock behavior.

### Phase 5: Dashboards and Offline Reconciliation

Build:

1. Teacher cohort dashboard.
2. Program manager analytics dashboard.
3. Offline capture and reconciliation workflow.
4. Intervention flags and basic next-step recommendations.

Exit criteria:

1. Teachers can see cohort progress and verification queues.
2. Program managers can view aggregate pathway and recognition metrics.
3. Offline entries can generate verified digital progress after reconciliation.

## 16. Testing Requirements

Minimum expected coverage: 80% for core business logic.

Unit tests:

1. Unlock gate evaluation.
2. Role-based visibility filters.
3. Recognition eligibility rules.
4. Partial completion mapping.
5. Offline reconciliation state transitions.
6. Sequence order validation.

Integration tests:

1. Create and publish content hierarchy.
2. Learner completes tasks and earns badge.
3. Module completion triggers microcredential eligibility.
4. Certification readiness from microcredentials plus capstone.
5. Parent API cannot access teacher-only content.
6. Teacher override creates audit log.
7. Offline entry reconciliation creates progress or evidence record.

E2E tests:

1. Learner views pathway map, opens unlocked lesson, submits evidence.
2. Teacher verifies artifact and issues badge.
3. Parent views simplified progress.
4. Curriculum designer creates module, submits for peer review, and publishes.
5. Program manager views aggregate dashboard.

Security tests:

1. Direct API access cannot leak teacher notes to learner or parent.
2. Direct API access cannot issue recognition without evidence.
3. Parent cannot access another learner's record.
4. Uploaded file validation rejects unsupported types and oversized files.

## 17. Open Questions

1. Should "Program" remain the final label, or should it be renamed to Curriculum, Syllabus, Specialization, or another term?
2. What exact attendance threshold is required for module-level microcredentials?
3. Which fields are legally required for minor consent and parent/guardian access?
4. What authentication model should be used for learners without email addresses?
5. Should offline records require photo proof of physical cards/stamps, or is teacher attestation enough?
6. Who can reverse or correct an incorrectly issued badge or credential?
7. What quality rubric scale should artifacts use in MVP?
8. Are all eight pathways required in MVP, or should implementation start with one pilot pathway such as Electronics or Robotics?
9. Should learner recommendations be rule-based only in MVP?
10. Which deployment format matters first: school program, camp, or community pod?
11. What stack should Codex use if no existing repository exists?
12. Are printed certificates generated by the platform in MVP, or recorded only as issued status?

## 18. Codex Implementation Prompt

Use this prompt when handing the PRD to Codex:

```text
Build the Future Fundi Credential Architecture Platform described in Future_Fundi_Codex_PRD.md.

Start with Phase 1 unless an existing repository already has foundations in place. Preserve the core invariants:

1. Recognition must never exist without linked evidence.
2. Learners can preview locked content but cannot access or submit against it.
3. Parents must not see lesson/task detail, rubrics, answer keys, teacher notes, or cohort comparisons.
4. Badges are permanent learner achievements and count toward later microcredentials even after learner interruption.
5. Offline entries are valid inputs but require reconciliation before formal digital recognition.
6. Teacher/program manager overrides must be audited with actor, timestamp, target, learner, and reason.

Follow TDD. First implement tests for data model constraints, unlock logic, role visibility, and recognition eligibility. Then implement the minimal feature set to pass those tests. Keep the code modular and make the schema extensible for new pathways without structural changes.

When product facts are unclear, do not invent them. Mark them as open questions and implement configurable defaults.
```

## 19. Handoff Recommendation

This PRD is ready for Codex implementation planning, with one caveat: before building production workflows, the team should answer the open questions around authentication for minors, consent flags, credential correction, attendance threshold, and whether the first MVP should seed all eight pathways or focus on a pilot pathway.

