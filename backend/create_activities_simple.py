"""
Quick script to create test activities and sessions.
Run in Django shell: python manage.py shell
Then paste this code.
"""

from datetime import datetime, timedelta

from apps.core.models import Activity, Attendance, Course, Learner, Module, Session
from apps.users.models import User

# Get today's date
today = datetime.now().date()

print("Creating test activities...")

# Create 3 upcoming activities
activities = [
    {
        'name': 'Career Fair 2026',
        'description': 'Meet industry professionals and explore career opportunities',
        'days_ahead': 3,
        'location': 'Main Hall',
    },
    {
        'name': 'Tech Workshop',
        'description': 'Hands-on coding workshop',
        'days_ahead': 5,
        'location': 'Computer Lab',
    },
    {
        'name': 'Guest Speaker: AI in Education',
        'description': 'Learn about the future of AI from industry experts',
        'days_ahead': 7,
        'location': 'Auditorium',
    },
]

created_count = 0
for activity_data in activities:
    activity_date = today + timedelta(days=activity_data['days_ahead'])
    
    activity = Activity.objects.create(
        name=activity_data['name'],
        description=activity_data['description'],
        date=activity_date,
        start_time=datetime.strptime('14:00', '%H:%M').time(),
        end_time=datetime.strptime('16:00', '%H:%M').time(),
        location=activity_data['location'],
        status='upcoming',
    )
    created_count += 1
    print(f"✓ Created: {activity.name} on {activity_date}")

print(f"\nCreated {created_count} activities!")

# Try to create sessions if we have the data
learners = Learner.objects.all()
teachers = User.objects.filter(role='teacher')
modules = Module.objects.all()

if learners.exists() and teachers.exists() and modules.exists():
    print("\nCreating test sessions...")
    teacher = teachers.first()
    learner = learners.first()
    module = modules.first()
    
    # Create 2 upcoming sessions
    for i in range(2):
        session_date = today + timedelta(days=2 + i*3)
        
        session = Session.objects.create(
            tenant=teacher.tenant,
            teacher=teacher,
            module=module,
            date=session_date,
            start_time=datetime.strptime('10:00', '%H:%M').time(),
            end_time=datetime.strptime('11:30', '%H:%M').time(),
            status='scheduled',
            location=f'Room {101 + i}'
        )
        
        # Add learner to session
        Attendance.objects.create(
            session=session,
            learner=learner,
            status='scheduled'
        )
        
        print(f"✓ Created session: {module.name} on {session_date}")
    
    print("\nDone! Now refresh the student dashboard.")
else:
    print("\nSkipping sessions (missing learners, teachers, or modules)")

print("\nTo verify, run:")
print("Activity.objects.filter(date__gte=datetime.now().date()).count()")
