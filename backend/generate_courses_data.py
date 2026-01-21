"""Generate sample courses and levels data.

Run with: py manage.py shell < generate_courses_data.py
"""
import django
django.setup()

from apps.core.models import Course, CourseLevel, Learner, LearnerCourseEnrollment, LearnerLevelProgress

print("🎓 Creating sample courses and levels...")

# Course 1: Robotics for Ages 6-8
robotics_6_8, created = Course.objects.get_or_create(
    name="Robotics Foundations",
    defaults={
        'description': "Introduction to robotics for young learners. Build and program simple robots while learning basic engineering concepts.",
        'domain': 'robotics',
        'min_age': 6,
        'max_age': 8,
        'is_active': True,
    }
)
if created:
    print(f"  ✓ Created {robotics_6_8}")
    # Create levels
    levels = [
        {"name": "Curiosity", "description": "Discovering robots and how they work", "learning_outcomes": ["Identify robot parts", "Understand basic sensors", "Follow simple instructions"]},
        {"name": "Explorer", "description": "Building your first robot", "learning_outcomes": ["Assemble basic robot", "Connect motors", "Use remote control"]},
        {"name": "Builder", "description": "Programming basic movements", "learning_outcomes": ["Write simple programs", "Make robot move forward/backward", "Use sensors"]},
        {"name": "Creator", "description": "Design your own robot project", "learning_outcomes": ["Design a robot solution", "Present your work", "Collaborate with peers"]},
    ]
    for i, level_data in enumerate(levels, start=1):
        CourseLevel.objects.create(
            course=robotics_6_8,
            level_number=i,
            name=level_data['name'],
            description=level_data['description'],
            learning_outcomes=level_data['learning_outcomes'],
            required_modules_count=3,
            required_artifacts_count=4,
            required_assessment_score=60,
        )
    print(f"    → Created {len(levels)} levels")

# Course 2: Robotics for Ages 9-12
robotics_9_12, created = Course.objects.get_or_create(
    name="Robotics Intermediate",
    defaults={
        'description': "Advanced robotics concepts including programming, sensors, and autonomous behavior.",
        'domain': 'robotics',
        'min_age': 9,
        'max_age': 12,
        'is_active': True,
    }
)
if created:
    print(f"  ✓ Created {robotics_9_12}")
    levels = [
        {"name": "Foundations", "description": "Review basics and introduce advanced concepts", "learning_outcomes": ["Program with loops", "Use multiple sensors", "Debug programs"]},
        {"name": "Mechanics", "description": "Understanding robot mechanics", "learning_outcomes": ["Build complex mechanisms", "Use gears and levers", "Create stable structures"]},
        {"name": "Automation", "description": "Creating autonomous robots", "learning_outcomes": ["Implement autonomous behavior", "Use feedback loops", "Navigate obstacles"]},
        {"name": "Innovation", "description": "Design and build original robots", "learning_outcomes": ["Design original solutions", "Document your process", "Present to judges"]},
    ]
    for i, level_data in enumerate(levels, start=1):
        CourseLevel.objects.create(
            course=robotics_9_12,
            level_number=i,
            name=level_data['name'],
            description=level_data['description'],
            learning_outcomes=level_data['learning_outcomes'],
            required_modules_count=4,
            required_artifacts_count=6,
            required_assessment_score=70,
        )
    print(f"    → Created {len(levels)} levels")

# Course 3: Coding Foundations for Ages 9-12
coding_9_12, created = Course.objects.get_or_create(
    name="Coding Foundations",
    defaults={
        'description': "Learn to code using block-based and text-based programming languages.",
        'domain': 'coding',
        'min_age': 9,
        'max_age': 12,
        'is_active': True,
    }
)
if created:
    print(f"  ✓ Created {coding_9_12}")
    levels = [
        {"name": "Block Basics", "description": "Introduction to block-based coding", "learning_outcomes": ["Use Scratch", "Create simple animations", "Understand sequences"]},
        {"name": "Logic & Loops", "description": "Programming logic fundamentals", "learning_outcomes": ["Use conditionals", "Implement loops", "Create interactive stories"]},
        {"name": "Text Code Intro", "description": "Transition to text-based coding", "learning_outcomes": ["Write Python basics", "Use variables", "Create simple programs"]},
        {"name": "Project Builder", "description": "Build a complete coding project", "learning_outcomes": ["Design a project", "Implement features", "Test and debug"]},
    ]
    for i, level_data in enumerate(levels, start=1):
        CourseLevel.objects.create(
            course=coding_9_12,
            level_number=i,
            name=level_data['name'],
            description=level_data['description'],
            learning_outcomes=level_data['learning_outcomes'],
            required_modules_count=4,
            required_artifacts_count=5,
            required_assessment_score=70,
        )
    print(f"    → Created {len(levels)} levels")

# Course 4: Coding for Ages 13-16
coding_13_16, created = Course.objects.get_or_create(
    name="Coding Advanced",
    defaults={
        'description': "Advanced programming concepts including web development and data structures.",
        'domain': 'coding',
        'min_age': 13,
        'max_age': 16,
        'is_active': True,
    }
)
if created:
    print(f"  ✓ Created {coding_13_16}")
    levels = [
        {"name": "Python Mastery", "description": "Advanced Python programming", "learning_outcomes": ["Use functions", "Work with files", "Handle exceptions"]},
        {"name": "Web Basics", "description": "Introduction to web development", "learning_outcomes": ["Write HTML/CSS", "Create web pages", "Understand the web"]},
        {"name": "Full Stack Intro", "description": "Frontend and backend basics", "learning_outcomes": ["Use JavaScript", "Build APIs", "Connect frontend to backend"]},
        {"name": "Capstone Project", "description": "Build a complete web application", "learning_outcomes": ["Design an app", "Implement full stack", "Deploy online"]},
    ]
    for i, level_data in enumerate(levels, start=1):
        CourseLevel.objects.create(
            course=coding_13_16,
            level_number=i,
            name=level_data['name'],
            description=level_data['description'],
            learning_outcomes=level_data['learning_outcomes'],
            required_modules_count=5,
            required_artifacts_count=6,
            required_assessment_score=75,
        )
    print(f"    → Created {len(levels)} levels")

# Enroll existing learners in age-appropriate courses
print("\n📚 Enrolling learners in age-appropriate courses...")
enrolled_count = 0

for learner in Learner.objects.all():
    age = learner.age
    if not age:
        continue
    
    # Find eligible courses
    eligible_courses = Course.objects.filter(
        is_active=True,
        min_age__lte=age,
        max_age__gte=age
    )
    
    for course in eligible_courses:
        enrollment, created = LearnerCourseEnrollment.objects.get_or_create(
            learner=learner,
            course=course,
            defaults={
                'current_level': course.levels.order_by('level_number').first()
            }
        )
        
        if created:
            enrolled_count += 1
            # Create progress for first level
            if enrollment.current_level:
                LearnerLevelProgress.objects.get_or_create(
                    enrollment=enrollment,
                    level=enrollment.current_level,
                    defaults={
                        'modules_completed': 2,  # Sample progress
                        'artifacts_submitted': 3,
                        'assessment_score': 65,
                    }
                )

print(f"  ✓ Created {enrolled_count} new enrollments")

# Summary
print("\n📊 Summary:")
print(f"  Courses: {Course.objects.count()}")
print(f"  Levels: {CourseLevel.objects.count()}")
print(f"  Enrollments: {LearnerCourseEnrollment.objects.count()}")
print(f"  Progress Records: {LearnerLevelProgress.objects.count()}")
print("\n✅ Course data generation complete!")
