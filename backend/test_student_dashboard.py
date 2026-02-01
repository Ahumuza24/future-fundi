"""
Test script to verify student dashboard data.

Run this from the Django shell:
python manage.py shell < test_student_dashboard.py

Or:
python manage.py shell
>>> exec(open('test_student_dashboard.py').read())
"""

from datetime import datetime, timedelta

from apps.core.models import (
    Achievement,
    Activity,
    Course,
    Learner,
    LearnerCourseEnrollment,
    Session,
)
from apps.users.models import User

print("\n" + "="*60)
print("STUDENT DASHBOARD DATA VERIFICATION")
print("="*60 + "\n")

# Find a learner user
learner_users = User.objects.filter(role='learner')
print(f"Total learner users: {learner_users.count()}")

if learner_users.exists():
    user = learner_users.first()
    print(f"\nChecking data for: {user.username} ({user.first_name} {user.last_name})")
    
    try:
        learner = Learner.objects.get(user=user)
        print(f"✓ Learner profile found: {learner.full_name}")
        print(f"  - School: {learner.current_school or 'Not set'}")
        print(f"  - Class: {learner.current_class or 'Not set'}")
        print(f"  - Parent: {learner.parent.username if learner.parent else 'None'}")
        
        # Check enrollments
        print(f"\n--- PATHWAYS/ENROLLMENTS ---")
        enrollments = LearnerCourseEnrollment.objects.filter(
            learner=learner,
            is_active=True
        )
        print(f"Total enrollments: {enrollments.count()}")
        
        for enrollment in enrollments:
            print(f"  ✓ {enrollment.course.name}")
            print(f"    - Current Level: {enrollment.current_level.name if enrollment.current_level else 'Not started'}")
            print(f"    - Total Levels: {enrollment.course.levels.count()}")
            print(f"    - Total Modules: {enrollment.course.modules.count()}")
        
        if enrollments.count() == 0:
            print("  ⚠ No enrollments found!")
            print("\n  Available courses:")
            courses = Course.objects.all()[:5]
            for course in courses:
                print(f"    - {course.name} (ID: {course.id})")
        
        # Check sessions
        print(f"\n--- UPCOMING SESSIONS ---")
        today = datetime.now().date()
        sessions = Session.objects.filter(
            learners=learner,
            date__gte=today
        ).order_by('date')
        print(f"Total upcoming sessions: {sessions.count()}")
        
        for session in sessions[:5]:
            print(f"  ✓ {session.date} - {session.module.name if session.module else 'No module'}")
            print(f"    Status: {session.status}")
        
        if sessions.count() == 0:
            print("  ⚠ No upcoming sessions found!")
        
        # Check activities
        print(f"\n--- UPCOMING ACTIVITIES ---")
        activities = Activity.objects.filter(
            date__gte=today
        ).order_by('date')
        print(f"Total upcoming activities: {activities.count()}")
        
        for activity in activities[:5]:
            print(f"  ✓ {activity.date} - {activity.name}")
            print(f"    Status: {activity.status}")
        
        if activities.count() == 0:
            print("  ⚠ No upcoming activities found!")
        
        # Check achievements
        print(f"\n--- ACHIEVEMENTS/BADGES ---")
        achievements = Achievement.objects.filter(learner=learner)
        print(f"Total achievements: {achievements.count()}")
        
        for achievement in achievements[:5]:
            print(f"  ✓ {achievement.name}")
            print(f"    Earned: {achievement.earned_at or 'Not earned'}")
        
        if achievements.count() == 0:
            print("  ⚠ No achievements found!")
            
    except Learner.DoesNotExist:
        print(f"✗ No learner profile found for user {user.username}")
        print("  This user has a 'learner' role but no Learner model instance.")
else:
    print("✗ No learner users found in the database!")
    print("\nTo create test data:")
    print("1. Register a parent user")
    print("2. Create a child through the parent interface")
    print("3. Select pathways during child creation")

print("\n" + "="*60)
print("END OF VERIFICATION")
print("="*60 + "\n")
