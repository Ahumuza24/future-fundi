# Generated migration for parent-child model restructuring

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Remove the old user field
        migrations.RemoveField(
            model_name='learner',
            name='user',
        ),
        
        # Add the new parent field
        migrations.AddField(
            model_name='learner',
            name='parent',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='children',
                to=settings.AUTH_USER_MODEL,
                help_text='Parent/guardian who manages this learner',
                default=1  # Temporary default, will be removed
            ),
            preserve_default=False,
        ),
        
        # Add new date_of_birth field
        migrations.AddField(
            model_name='learner',
            name='date_of_birth',
            field=models.DateField(
                blank=True, 
                null=True, 
                help_text="Child's date of birth"
            ),
        ),
        
        # Update field help texts
        migrations.AlterField(
            model_name='learner',
            name='consent_media',
            field=models.BooleanField(
                default=False, 
                db_index=True, 
                help_text='Parent consent for media capture'
            ),
        ),
        
        migrations.AlterField(
            model_name='learner',
            name='equity_flag',
            field=models.BooleanField(
                default=False, 
                db_index=True, 
                help_text='Requires additional support'
            ),
        ),
        
        migrations.AlterField(
            model_name='learner',
            name='joined_at',
            field=models.DateField(
                blank=True, 
                null=True, 
                help_text='Date enrolled in program'
            ),
        ),
        
        # Update Meta options
        migrations.AlterModelOptions(
            name='learner',
            options={
                'ordering': ['first_name', 'last_name'],
                'verbose_name': 'Learner',
                'verbose_name_plural': 'Learners'
            },
        ),
        
        # Update table name
        migrations.AlterModelTable(
            name='learner',
            table='core_learner',
        ),
        
        # Add index for parent and tenant
        migrations.AddIndex(
            model_name='learner',
            index=models.Index(fields=['parent', 'tenant'], name='core_learne_parent__idx'),
        ),
    ]
