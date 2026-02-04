import os
import random
from datetime import date, timedelta

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fundi.settings")
django.setup()

from apps.core.models import (
    Artifact,
    Assessment,
    Credential,
    GateSnapshot,
    Learner,
    Module,
    PathwayInputs,
    School,
    WeeklyPulse,
)
from django.contrib.auth import get_user_model

User = get_user_model()


def run():
    print("Seeding data...")

    # Check if data exists
    if User.objects.filter(username="admin").exists():
        print("Admin exists, skipping creation.")
        admin_user = User.objects.get(username="admin")
    else:
        # Create Superuser
        admin_user = User.objects.create_superuser(
            "admin", "admin@futurefundi.com", "password"
        )
        print("Created superuser: admin/password")

    # Create School (Tenant)
    school, _ = School.objects.get_or_create(
        name="Fundi Bots Academy", defaults={"code": "FBA-001"}
    )
    print(f"Created/Found School: {school.name}")

    # Assign admin to tenant (optional? User model has tenant field)
    # Use using='default' to bypass router restrictions
    admin_user.tenant_id = school.id
    admin_user.save(using="default")

    # Create Modules
    modules = ["Robotics", "Renewable Energy", "Environmental Science", "Coding"]
    module_objs = []
    for m in modules:
        mod, _ = Module.objects.get_or_create(tenant=school, name=m)
        module_objs.append(mod)

    # Create Learners
    learners_data = [
        ("Amina", "Nakato", "Thrive"),
        ("David", "Okello", "Thrive"),
        ("Sarah", "Achieng", "Grow"),
        ("John", "Mugisha", "Grow"),
        ("Grace", "Nambi", "Begin"),
    ]

    for first, last, gate in learners_data:
        # Create User for learner?
        # Learner model has OneToOne with User.
        username = f"{first.lower()}.{last.lower()}"
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username, password="password", tenant=school, role="learner"
            )
            learner = Learner.objects.create(
                tenant=school,
                user=user,
                first_name=first,
                last_name=last,
                joined_at=date(2025, 1, 15),
            )

            # Create Pathway Data
            score = 85 if gate == "Thrive" else 65 if gate == "Grow" else 40
            GateSnapshot.objects.create(
                tenant=school, learner=learner, score=score, gate=gate
            )
            PathwayInputs.objects.create(
                tenant=school,
                learner=learner,
                interest_persistence=80,
                skill_readiness=80,
                enjoyment=90,
                local_demand=70,
                breadth=3,
            )

            # Create Artifacts
            for i in range(random.randint(2, 5)):
                mod = random.choice(module_objs)
                Artifact.objects.create(
                    tenant=school,
                    learner=learner,
                    title=f"{mod.name} Project {i+1}",
                    reflection="I learned a lot about circuits.",
                    media_refs=[
                        {"type": "image", "url": "https://placehold.co/600x400"}
                    ],
                )

            # Weekly Pulse
            WeeklyPulse.objects.create(
                tenant=school,
                learner=learner,
                mood=random.choice([80, 90, 100]),
                win="Completed my project",
                worry="None",
            )

    print("Seeding complete.")


if __name__ == "__main__":
    run()
