from django.db import migrations, models


def populate_teacher_schools(apps, schema_editor):
    User = apps.get_model("users", "User")
    through_model = User.teacher_schools.through

    rows = []
    for user in User.objects.filter(role="teacher", tenant_id__isnull=False).values("id", "tenant_id"):
        rows.append(through_model(user_id=user["id"], school_id=user["tenant_id"]))

    if rows:
        through_model.objects.bulk_create(rows, ignore_conflicts=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0022_add_badge_and_quiz_models"),
        ("users", "0004_alter_user_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="teacher_schools",
            field=models.ManyToManyField(
                blank=True,
                help_text="Schools this teacher can access.",
                related_name="teachers",
                to="core.school",
            ),
        ),
        migrations.RunPython(populate_teacher_schools, noop_reverse),
    ]
