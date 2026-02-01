"""
Create sample sessions and activities for testing the student dashboard.

Run this from the Django shell:
python manage.py shell < create_test_activities.py
"""

import random
from datetime import datetime, timedelta

from apps.core.models import (
    Activity,
    Attendance,
    Course,
    Learner,
    LearnerCourseEnrollment,
    Module,
    Session,
)
from apps.users.models import User

print("\n" + "="*60)
print("CREATING TEST SESSIONS AND ACTIVITIES")
print("="*60 + "\n")

# Get or create a teacher
teachers = User.objects.filter(role='teacher')
if not teachers.exists():
    print("⚠ No teachers found. Creating a test teacher...")
    teacher = User.objects.create_user(
        username='teacher_test',
        password='password123',
        first_name='Test',
        last_name='Teacher',
        role='teacher',
        email='teacher@test.com'
    )
    print(f"✓ Created teacher: {teacher.username}")
else:
    teacher = teachers.first()
    print(f"✓ Using existing teacher: {teacher.username}")

# Get learners
learners = Learner.objects.all()
if not learners.exists():
    print("✗ No learners found! Please create a child first.")
    exit()

print(f"✓ Found {learners.count()} learner(s)")

# Get courses and modules
courses = Course.objects.all()
if not courses.exists():
    print("✗ No courses found! Please create courses first.")
    exit()

print(f"✓ Found {courses.count()} course(s)")

# Create sessions for the next 7 days
today = datetime.now().date()
sessions_created = 0

for learner in learners:
    # Get learner's enrollments
    enrollments = LearnerCourseEnrollment.objects.filter(
        learner=learner,
        is_active=True
    )
    
    if not enrollments.exists():
        print(f"  ⚠ {learner.full_name} has no enrollments, skipping...")
        continue
    
    print(f"\n  Creating sessions for {learner.full_name}...")
    
    for enrollment in enrollments:
        course = enrollment.course
        modules = course.modules.all()
        
        if not modules.exists():
            print(f"    ⚠ No modules found for {course.name}, skipping...")
            continue
        
        # Create 3 sessions over the next week
        for i in range(3):
            session_date = today + timedelta(days=i*2 + 1)
            module = random.choice(modules)
            
            # Create session
            session = Session.objects.create(
                tenant=teacher.tenant,
                teacher=teacher,
                module=module,
                date=session_date,
                start_time=datetime.strptime('14:00', '%H:%M').time(),
                end_time=datetime.strptime('15:30', '%H:%M').time(),
                status='scheduled',
                location=f'Room {random.randint(101, 110)}'
            )
            
            # Add learner to session via Attendance
            Attendance.objects.create(
                session=session,
                learner=learner,
                status='scheduled'
            )
            
            sessions_created += 1
            print(f"    ✓ {session_date} - {module.name}")

print(f"\n✓ Created {sessions_created} session(s)")

# Create general activities
print(f"\nCreating general activities...")
activities_created = 0

activity_types = [
    ('Career Fair', 'Meet industry professionals'),
    ('Hackathon', 'Build something amazing in 24 hours'),
    ('Guest Speaker', 'Learn from experts'),
    ('Field Trip', 'Visit a tech company'),
    ('Workshop', 'Hands-on learning session'),
]

for i, (name, description) in enumerate(activity_types[:3]):
    activity_date = today + timedelta(days=i*3 + 2)
    
    activity = Activity.objects.create(
        tenant=teacher.tenant,
        name=name,
        description=description,
        date=activity_date,
        start_time=datetime.strptime('10:00', '%H:%M').time(),
        end_time=datetime.strptime('12:00', '%H:%M').time(),
        location='Main Hall',
        status='upcoming',
        course=random.choice(courses) if random.random() > 0.5 else None
    )
    
    activities_created += 1
    print(f"  ✓ {activity_date} - {name}")

print(f"\n✓ Created {activities_created} activit(ies)")

print("\n" + "="*60)
print("TEST DATA CREATION COMPLETE")
print("="*60 + "\n")
print("You can now:")
print("1. Log in as a student")
print("2. View the Student Dashboard")
print("3. See upcoming sessions and activities")
print("\n")
