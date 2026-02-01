"""
Check and create sample course structure with levels and modules.
Usage: python manage.py create_sample_course
"""

from apps.core.models import Course, CourseLevel, Module
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Creates a sample course with levels and modules for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Creating Sample Course Structure ===\n'))
        
        # Check existing courses
        courses = Course.objects.all()
        self.stdout.write(f'Found {courses.count()} existing courses:')
        for course in courses:
            levels_count = course.levels.count()
            modules_count = Module.objects.filter(course=course).count()
            self.stdout.write(f'  - {course.name}: {levels_count} levels, {modules_count} modules')
        
        # Ask if we should create sample data
        if courses.exists():
            course = courses.first()
            self.stdout.write(f'\n📚 Using existing course: {course.name}')
        else:
            self.stdout.write('\n📚 Creating new sample course...')
            course = Course.objects.create(
                name='Introduction to Robotics',
                description='Learn the fundamentals of robotics and automation',
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created course: {course.name}'))
        
        # Check/create levels
        levels = course.levels.all().order_by('level_number')
        
        if not levels.exists():
            self.stdout.write('\n📊 Creating course levels...')
            
            level1 = CourseLevel.objects.create(
                course=course,
                level_number=1,
                name='Level 1: Foundations',
                description='Learn the basics of robotics',
                learning_outcomes=['Understand basic robotics concepts', 'Build simple circuits'],
                required_modules_count=3,
                required_artifacts_count=4,
                required_assessment_score=70
            )
            
            level2 = CourseLevel.objects.create(
                course=course,
                level_number=2,
                name='Level 2: Intermediate',
                description='Build more complex robots',
                learning_outcomes=['Program robot movements', 'Use sensors effectively'],
                required_modules_count=3,
                required_artifacts_count=5,
                required_assessment_score=75
            )
            
            level3 = CourseLevel.objects.create(
                course=course,
                level_number=3,
                name='Level 3: Advanced',
                description='Master advanced robotics concepts',
                learning_outcomes=['Design autonomous robots', 'Implement AI algorithms'],
                required_modules_count=3,
                required_artifacts_count=6,
                required_assessment_score=80
            )
            
            levels = [level1, level2, level3]
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(levels)} levels'))
        else:
            self.stdout.write(f'\n📊 Using {levels.count()} existing levels')
            levels = list(levels)
        
        # Check/create modules
        modules = Module.objects.filter(course=course)
        
        if not modules.exists():
            self.stdout.write('\n📖 Creating sample modules...')
            
            modules_data = [
                # Level 1 modules
                {
                    'name': 'Introduction to Robotics',
                    'description': 'What is robotics and why is it important?',
                    'content': '<h2>Welcome to Robotics!</h2><p>Robotics is the branch of technology that deals with the design, construction, operation, and application of robots.</p><h3>Key Concepts:</h3><ul><li>What is a robot?</li><li>Types of robots</li><li>Applications in daily life</li></ul>',
                    'competences': ['Understanding robot basics', 'Identifying robot types'],
                    'materials': ['Notebook', 'Pen'],
                    'suggested_activities': ['Watch robot videos', 'Draw your dream robot'],
                    'badge_name': 'Robotics Beginner'
                },
                {
                    'name': 'Basic Electronics',
                    'description': 'Understanding circuits and components',
                    'content': '<h2>Electronics Fundamentals</h2><p>Learn about basic electronic components and how they work together.</p><h3>Components:</h3><ul><li>Resistors</li><li>LEDs</li><li>Batteries</li><li>Switches</li></ul>',
                    'competences': ['Identifying components', 'Building simple circuits'],
                    'materials': ['LED', 'Battery', 'Resistor', 'Wires'],
                    'suggested_activities': ['Build an LED circuit', 'Test different resistor values'],
                    'badge_name': 'Electronics Explorer'
                },
                {
                    'name': 'Your First Robot',
                    'description': 'Build a simple robot',
                    'content': '<h2>Building Your First Robot</h2><p>Let\'s put everything together and build a simple robot!</p><h3>Steps:</h3><ol><li>Gather materials</li><li>Connect the circuit</li><li>Test the robot</li><li>Troubleshoot</li></ol>',
                    'competences': ['Assembly skills', 'Problem solving', 'Testing'],
                    'materials': ['Arduino', 'Motors', 'Wheels', 'Battery pack'],
                    'suggested_activities': ['Build the robot', 'Make it move forward', 'Add decorations'],
                    'badge_name': 'Robot Builder'
                },
                # Level 2 modules
                {
                    'name': 'Programming Basics',
                    'description': 'Introduction to coding for robots',
                    'content': '<h2>Coding Your Robot</h2><p>Learn how to program your robot to perform tasks.</p><h3>Topics:</h3><ul><li>What is programming?</li><li>Block-based coding</li><li>Sequences and loops</li></ul>',
                    'competences': ['Basic programming', 'Logical thinking'],
                    'materials': ['Computer', 'Arduino IDE'],
                    'suggested_activities': ['Write your first program', 'Make LED blink'],
                    'badge_name': 'Code Starter'
                },
                {
                    'name': 'Sensors and Input',
                    'description': 'Making robots sense their environment',
                    'content': '<h2>Robot Sensors</h2><p>Robots use sensors to understand their surroundings.</p><h3>Sensor Types:</h3><ul><li>Distance sensors</li><li>Light sensors</li><li>Touch sensors</li></ul>',
                    'competences': ['Using sensors', 'Reading sensor data'],
                    'materials': ['Ultrasonic sensor', 'Light sensor', 'Touch sensor'],
                    'suggested_activities': ['Test each sensor', 'Create obstacle detection'],
                    'badge_name': 'Sensor Master'
                },
                {
                    'name': 'Robot Movement',
                    'description': 'Programming robot motion',
                    'content': '<h2>Making Robots Move</h2><p>Learn to control motors and create movement patterns.</p><h3>Movement Types:</h3><ul><li>Forward/Backward</li><li>Turning</li><li>Speed control</li></ul>',
                    'competences': ['Motor control', 'Movement programming'],
                    'materials': ['Motors', 'Motor driver', 'Power supply'],
                    'suggested_activities': ['Program a dance routine', 'Create a maze navigator'],
                    'badge_name': 'Motion Expert'
                },
                # Level 3 modules
                {
                    'name': 'Autonomous Navigation',
                    'description': 'Self-driving robots',
                    'content': '<h2>Autonomous Robots</h2><p>Create robots that can navigate on their own.</p><h3>Concepts:</h3><ul><li>Path planning</li><li>Obstacle avoidance</li><li>Decision making</li></ul>',
                    'competences': ['Autonomous systems', 'Algorithm design'],
                    'materials': ['Multiple sensors', 'Advanced controller'],
                    'suggested_activities': ['Build a line follower', 'Create maze solver'],
                    'badge_name': 'Autonomy Pro'
                },
                {
                    'name': 'AI and Machine Learning',
                    'description': 'Teaching robots to learn',
                    'content': '<h2>AI in Robotics</h2><p>Introduction to artificial intelligence and machine learning.</p><h3>Topics:</h3><ul><li>What is AI?</li><li>Pattern recognition</li><li>Training robots</li></ul>',
                    'competences': ['AI concepts', 'Machine learning basics'],
                    'materials': ['Computer', 'Camera module'],
                    'suggested_activities': ['Train a simple classifier', 'Object recognition'],
                    'badge_name': 'AI Pioneer'
                },
                {
                    'name': 'Final Project',
                    'description': 'Design and build your own robot',
                    'content': '<h2>Your Masterpiece</h2><p>Apply everything you\'ve learned to create an original robot.</p><h3>Project Steps:</h3><ol><li>Design your robot</li><li>Plan the features</li><li>Build and program</li><li>Test and improve</li><li>Present your work</li></ol>',
                    'competences': ['Project management', 'Creative design', 'Presentation skills'],
                    'materials': ['All previous materials', 'Additional components as needed'],
                    'suggested_activities': ['Create project proposal', 'Build prototype', 'Final presentation'],
                    'badge_name': 'Robotics Master'
                },
            ]
            
            created_modules = []
            for module_data in modules_data:
                module = Module.objects.create(
                    course=course,
                    **module_data
                )
                created_modules.append(module)
                self.stdout.write(f'  ✓ Created module: {module.name}')
            
            self.stdout.write(self.style.SUCCESS(f'\n  Created {len(created_modules)} modules'))
            
            # Link modules to levels
            self.stdout.write('\n🔗 Linking modules to levels...')
            
            # Level 1: First 3 modules
            for module in created_modules[0:3]:
                levels[0].required_modules.add(module)
            self.stdout.write(f'  ✓ Level 1: {levels[0].required_modules.count()} modules')
            
            # Level 2: Next 3 modules
            if len(levels) > 1:
                for module in created_modules[3:6]:
                    levels[1].required_modules.add(module)
                self.stdout.write(f'  ✓ Level 2: {levels[1].required_modules.count()} modules')
            
            # Level 3: Last 3 modules
            if len(levels) > 2:
                for module in created_modules[6:9]:
                    levels[2].required_modules.add(module)
                self.stdout.write(f'  ✓ Level 3: {levels[2].required_modules.count()} modules')
        else:
            self.stdout.write(f'\n📖 Using {modules.count()} existing modules')
            
            # Check if modules are linked to levels
            total_linked = sum(level.required_modules.count() for level in levels)
            if total_linked == 0:
                self.stdout.write('\n🔗 Linking existing modules to levels...')
                modules_list = list(modules)
                modules_per_level = max(1, len(modules_list) // len(levels))
                
                for idx, level in enumerate(levels):
                    start_idx = idx * modules_per_level
                    end_idx = start_idx + modules_per_level if idx < len(levels) - 1 else len(modules_list)
                    level_modules = modules_list[start_idx:end_idx]
                    
                    for module in level_modules:
                        level.required_modules.add(module)
                    
                    self.stdout.write(f'  ✓ Level {level.level_number}: {len(level_modules)} modules')
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n=== Summary ==='))
        self.stdout.write(f'Course: {course.name}')
        self.stdout.write(f'Levels: {course.levels.count()}')
        self.stdout.write(f'Total Modules: {Module.objects.filter(course=course).count()}')
        
        for level in course.levels.all().order_by('level_number'):
            module_count = level.required_modules.count()
            self.stdout.write(f'  Level {level.level_number}: {module_count} modules')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Done! Your course structure is ready.\n'))
        self.stdout.write('Now students can navigate through levels and modules in the learning interface!')
