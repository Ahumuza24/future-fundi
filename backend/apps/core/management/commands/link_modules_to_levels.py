"""
Management command to link modules to course levels.
Usage: python manage.py link_modules_to_levels
"""

from apps.core.models import Course, Module
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Links modules to course levels based on the course relationship"

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS("\n=== Linking Modules to Course Levels ===\n")
        )

        # Get all courses
        courses = Course.objects.all()

        if not courses.exists():
            self.stdout.write(self.style.WARNING("No courses found!"))
            return

        total_links = 0

        for course in courses:
            self.stdout.write(f"\n📚 Course: {course.name}")

            # Get levels for this course
            levels = course.levels.all().order_by("level_number")

            if not levels.exists():
                self.stdout.write(
                    self.style.WARNING(f"  ⚠ No levels found for {course.name}")
                )
                continue

            # Get modules for this course
            modules = Module.objects.filter(course=course)

            if not modules.exists():
                self.stdout.write(
                    self.style.WARNING(f"  ⚠ No modules found for {course.name}")
                )
                continue

            self.stdout.write(
                f"  Found {levels.count()} levels and {modules.count()} modules"
            )

            # Distribute modules across levels
            modules_list = list(modules)
            modules_per_level = max(1, len(modules_list) // levels.count())

            for idx, level in enumerate(levels):
                # Get existing modules
                existing_count = level.required_modules.count()

                if existing_count > 0:
                    self.stdout.write(
                        f"  ✓ Level {level.level_number}: Already has {existing_count} modules"
                    )
                    continue

                # Calculate which modules to assign to this level
                start_idx = idx * modules_per_level
                end_idx = (
                    start_idx + modules_per_level
                    if idx < levels.count() - 1
                    else len(modules_list)
                )
                level_modules = modules_list[start_idx:end_idx]

                # Link modules to this level
                for module in level_modules:
                    level.required_modules.add(module)
                    total_links += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ Level {level.level_number} ({level.name}): Linked {len(level_modules)} modules"
                    )
                )

                for module in level_modules:
                    self.stdout.write(f"    - {module.name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Done! Created {total_links} module-level links.\n"
            )
        )

        # Show summary
        self.stdout.write(self.style.SUCCESS("=== Summary ==="))
        for course in courses:
            levels = course.levels.all()
            total_modules = sum(level.required_modules.count() for level in levels)
            self.stdout.write(
                f"{course.name}: {total_modules} modules across {levels.count()} levels"
            )
