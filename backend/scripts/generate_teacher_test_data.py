"""
Generate test data for Teacher Dashboard testing.

This script creates:
- A test school
- A test teacher user
- Test modules
- Test learners
- Test sessions for today and upcoming days
- Sample attendance records
- Sample artifacts

Run with: python manage.py shell < generate_teacher_test_data.py
Or: python manage.py runscript generate_teacher_test_data (if django-extensions installed)
"""

from datetime import date, time, timedelta

from apps.core.models import Artifact, Attendance, Learner, Module, School, Session
from django.contrib.auth import get_user_model

User = get_user_model()


def create_test_data():
    print("🚀 Starting test data generation...")

    # 1. Create or get test school
    school, created = School.objects.get_or_create(
        code="TEST001", defaults={"name": "Test Future Fundi School"}
    )
    if created:
        print(f"✅ Created school: {school.name}")
    else:
        print(f"📌 Using existing school: {school.name}")

    # 2. Create or get test teacher
    teacher, created = User.objects.get_or_create(
        username="teacher_test",
        defaults={
            "email": "teacher@test.com",
            "first_name": "John",
            "last_name": "Teacher",
            "role": "teacher",
            "tenant": school,
        },
    )
    if created:
        teacher.set_password("teacher123")
        teacher.save()
        print(
            f"✅ Created teacher: {teacher.get_full_name()} (username: teacher_test, password: teacher123)"
        )
    else:
        print(f"📌 Using existing teacher: {teacher.get_full_name()}")

    # 3. Create test modules
    modules_data = [
        {"name": "Robotics Basics", "description": "Introduction to robotics"},
        {"name": "3D Printing", "description": "Learn 3D design and printing"},
        {"name": "Coding Fundamentals", "description": "Basic programming concepts"},
        {
            "name": "Electronics Workshop",
            "description": "Circuit building and electronics",
        },
    ]

    modules = []
    for mod_data in modules_data:
        module, created = Module.objects.get_or_create(
            name=mod_data["name"],
            tenant=school,
            defaults={"description": mod_data.get("description", "")},
        )
        modules.append(module)
        if created:
            print(f"✅ Created module: {module.name}")

    # 4. Create test parent and learners
    parent, created = User.objects.get_or_create(
        username="parent_test",
        defaults={
            "email": "parent@test.com",
            "first_name": "Jane",
            "last_name": "Parent",
            "role": "parent",
            "tenant": school,
        },
    )
    if created:
        parent.set_password("parent123")
        parent.save()
        print(f"✅ Created parent: {parent.get_full_name()}")

    learners_data = [
        {"first_name": "Alice", "last_name": "Student", "age_offset": 10},
        {"first_name": "Bob", "last_name": "Learner", "age_offset": 11},
        {"first_name": "Charlie", "last_name": "Kid", "age_offset": 9},
        {"first_name": "Diana", "last_name": "Child", "age_offset": 10},
        {"first_name": "Ethan", "last_name": "Pupil", "age_offset": 12},
    ]

    learners = []
    for learner_data in learners_data:
        # Create user account for learner
        learner_user, user_created = User.objects.get_or_create(
            username=f"{learner_data['first_name'].lower()}_test",
            defaults={
                "email": f"{learner_data['first_name'].lower()}@test.com",
                "first_name": learner_data["first_name"],
                "last_name": learner_data["last_name"],
                "role": "learner",
                "tenant": school,
            },
        )
        if user_created:
            learner_user.set_password("learner123")
            learner_user.save()

        # Create learner profile
        dob = date.today() - timedelta(days=365 * learner_data["age_offset"])
        learner, created = Learner.objects.get_or_create(
            first_name=learner_data["first_name"],
            last_name=learner_data["last_name"],
            parent=parent,
            defaults={
                "tenant": school,
                "user": learner_user,
                "date_of_birth": dob,
                "current_school": "Test Primary School",
                "current_class": f"Primary {learner_data['age_offset'] - 6}",
                "consent_media": True,
            },
        )
        learners.append(learner)
        if created:
            print(f"✅ Created learner: {learner.full_name}")

    # 5. Create sessions for today and upcoming days
    today = date.today()
    sessions_data = [
        # Today's sessions
        {
            "module": modules[0],
            "date": today,
            "start": time(9, 0),
            "status": "scheduled",
        },
        {
            "module": modules[1],
            "date": today,
            "start": time(11, 0),
            "status": "scheduled",
        },
        {
            "module": modules[2],
            "date": today,
            "start": time(14, 0),
            "status": "completed",
        },
        # Tomorrow's sessions
        {
            "module": modules[0],
            "date": today + timedelta(days=1),
            "start": time(9, 0),
            "status": "scheduled",
        },
        {
            "module": modules[3],
            "date": today + timedelta(days=1),
            "start": time(13, 0),
            "status": "scheduled",
        },
        # Next week
        {
            "module": modules[1],
            "date": today + timedelta(days=7),
            "start": time(10, 0),
            "status": "scheduled",
        },
    ]

    sessions = []
    for sess_data in sessions_data:
        session, created = Session.objects.get_or_create(
            teacher=teacher,
            module=sess_data["module"],
            date=sess_data["date"],
            start_time=sess_data["start"],
            defaults={
                "tenant": school,
                "status": sess_data["status"],
                "end_time": (
                    time(sess_data["start"].hour + 2, 0) if sess_data["start"] else None
                ),
            },
        )

        # Add learners to session
        if created:
            session.learners.add(*learners[:3])  # Add first 3 learners
            print(f"✅ Created session: {session.module.name} on {session.date}")

        sessions.append(session)

    # 6. Create attendance for completed session
    completed_session = [s for s in sessions if s.status == "completed"][0]
    attendance_statuses = ["present", "present", "absent"]

    for i, learner in enumerate(learners[:3]):
        attendance, created = Attendance.objects.get_or_create(
            session=completed_session,
            learner=learner,
            defaults={"status": attendance_statuses[i]},
        )
        if created:
            print(f"✅ Created attendance: {learner.full_name} - {attendance.status}")

    completed_session.attendance_marked = True
    completed_session.save()

    # 7. Create sample artifacts
    for i, learner in enumerate(learners[:3]):
        artifact, created = Artifact.objects.get_or_create(
            learner=learner,
            title=f"Robotics Project - {learner.first_name}",
            defaults={
                "tenant": school,
                "created_by": teacher,
                "reflection": f"Great work on the robot! {learner.first_name} showed excellent problem-solving skills.",
                "media_refs": [
                    {"type": "photo", "url": f"https://example.com/photo{i}.jpg"}
                ],
            },
        )
        if created:
            print(f"✅ Created artifact: {artifact.title}")

    print("\n" + "=" * 60)
    print("🎉 Test data generation complete!")
    print("=" * 60)
    print("\n📋 Summary:")
    print(f"   School: {school.name} (code: {school.code})")
    print(f"   Teacher: {teacher.get_full_name()}")
    print("   - Username: teacher_test")
    print("   - Password: teacher123")
    print(f"\n   Parent: {parent.get_full_name()}")
    print("   - Username: parent_test")
    print("   - Password: parent123")
    print(f"\n   Learners: {len(learners)}")
    for learner in learners:
        print(
            f"   - {learner.full_name} (username: {learner.first_name.lower()}_test, password: learner123)"
        )
    print(f"\n   Modules: {len(modules)}")
    print(f"   Sessions: {len(sessions)}")
    print(f"   - Today: {len([s for s in sessions if s.date == today])}")
    print(f"   - Completed: {len([s for s in sessions if s.status == 'completed'])}")
    print(f"\n   Artifacts: {Artifact.objects.filter(created_by=teacher).count()}")
    print("\n🚀 You can now:")
    print("   1. Login as teacher (teacher_test / teacher123)")
    print("   2. Navigate to /teacher to see the dashboard")
    print("   3. Test session start/complete workflow")
    print("   4. Login as parent (parent_test / parent123) to test parent portal")
    print("   5. Login as learner (alice_test / learner123) to test student dashboard")
    print("=" * 60)


if __name__ == "__main__":
    create_test_data()
else:
    # When imported or piped to shell, ensure we run it
    create_test_data()
