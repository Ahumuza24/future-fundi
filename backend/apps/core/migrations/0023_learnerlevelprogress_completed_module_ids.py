from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0022_add_badge_and_quiz_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="learnerlevelprogress",
            name="completed_module_ids",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="List of completed module IDs for this learner at this level.",
            ),
        ),
    ]

