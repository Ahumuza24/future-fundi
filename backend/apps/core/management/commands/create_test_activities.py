"""
Management command to create test activities and sessions.
Usage: python manage.py create_test_activities
"""

from datetime import datetime, timedelta

from apps.core.models import Activity, Attendance, Course, Learner, Module, Session
from apps.users.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Creates test activities and sessions for the student dashboard'

    def handle(self, *args, **options):
        today = datetime.now().date()
        
        self.stdout.write(self.style.SUCCESS('\n=== Creating Test Activities ===\n'))
        
        # Create activities
        activities_data = [
            {
                'name': 'Career Fair 2026',
                'description': 'Meet industry professionals and explore career opportunities',
                'days_ahead': 3,
                'location': 'Main Hall',
            },
            {
                'name': 'Tech Workshop',
                'description': 'Hands-on coding workshop with industry experts',
                'days_ahead': 5,
                'location': 'Computer Lab',
            },
            {
                'name': 'Guest Speaker: AI in Education',
                'description': 'Learn about the future of AI from industry leaders',
                'days_ahead': 7,
                'location': 'Auditorium',
            },
            {
                'name': 'Hackathon 2026',
                'description': '24-hour coding challenge',
                'days_ahead': 10,
                'location': 'Innovation Hub',
            },
        ]
        
        activities_created = 0
        for activity_data in activities_data:
            activity_date = today + timedelta(days=activity_data['days_ahead'])
            
            # Check if activity already exists
            if Activity.objects.filter(
                name=activity_data['name'],
                date=activity_date
            ).exists():
                self.stdout.write(f"  ⚠ Skipping {activity_data['name']} (already exists)")
                continue
            
            activity = Activity.objects.create(
                name=activity_data['name'],
                description=activity_data['description'],
                date=activity_date,
                start_time=datetime.strptime('14:00', '%H:%M').time(),
                end_time=datetime.strptime('16:00', '%H:%M').time(),
                location=activity_data['location'],
                status='upcoming',
            )
            activities_created += 1
            self.stdout.write(self.style.SUCCESS(
                f'  ✓ Created: {activity.name} on {activity_date}'
            ))
        
        self.stdout.write(self.style.SUCCESS(
            f'\nCreated {activities_created} new activities!'
        ))
        
        # Create sessions if possible
        learners = Learner.objects.all()
        teachers = User.objects.filter(role='teacher')
        modules = Module.objects.all()
        
        if not learners.exists():
            self.stdout.write(self.style.WARNING(
                '\n⚠ No learners found. Skipping session creation.'
            ))
            return
        
        if not teachers.exists():
            self.stdout.write(self.style.WARNING(
                '\n⚠ No teachers found. Skipping session creation.'
            ))
            return
        
        if not modules.exists():
            self.stdout.write(self.style.WARNING(
                '\n⚠ No modules found. Skipping session creation.'
            ))
            return
        
        self.stdout.write(self.style.SUCCESS('\n=== Creating Test Sessions ===\n'))
        
        teacher = teachers.first()
        sessions_created = 0
        
        # Create sessions for each learner
        for learner in learners[:3]:  # Limit to first 3 learners
            # Get modules from learner's enrolled courses
            enrollments = learner.course_enrollments.filter(is_active=True)
            
            if not enrollments.exists():
                self.stdout.write(self.style.WARNING(
                    f'  ⚠ {learner.full_name} has no enrollments. Skipping.'
                ))
                continue
            
            for enrollment in enrollments:
                course_modules = enrollment.course.modules.all()
                
                if not course_modules.exists():
                    continue
                
                # Create 2 sessions for this course
                for i in range(2):
                    session_date = today + timedelta(days=2 + i*3)
                    module = course_modules[i % course_modules.count()]
                    
                    # Check if session already exists
                    if Session.objects.filter(
                        teacher=teacher,
                        module=module,
                        date=session_date
                    ).exists():
                        continue
                    
                    session = Session.objects.create(
                        tenant=teacher.tenant,
                        teacher=teacher,
                        module=module,
                        date=session_date,
                        start_time=datetime.strptime('10:00', '%H:%M').time(),
                        end_time=datetime.strptime('11:30', '%H:%M').time(),
                        status='scheduled',
                        location=f'Room {101 + (sessions_created % 5)}'
                    )
                    
                    # Add learner to session
                    Attendance.objects.create(
                        session=session,
                        learner=learner,
                        status='scheduled'
                    )
                    
                    sessions_created += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'  ✓ Created session for {learner.full_name}: {module.name} on {session_date}'
                    ))
        
        self.stdout.write(self.style.SUCCESS(
            f'\nCreated {sessions_created} new sessions!'
        ))
        
        # Summary
        total_activities = Activity.objects.filter(date__gte=today).count()
        total_sessions = Session.objects.filter(date__gte=today).count()
        
        self.stdout.write(self.style.SUCCESS(
            f'\n=== Summary ==='
        ))
        self.stdout.write(f'Total upcoming activities: {total_activities}')
        self.stdout.write(f'Total upcoming sessions: {total_sessions}')
        self.stdout.write(self.style.SUCCESS(
            '\n✓ Done! Refresh the student dashboard to see the changes.\n'
        ))
