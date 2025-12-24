# Generated migration for final fields

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_add_new_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='echantillon',
            name='date_envoi_chef_service',
            field=models.DateField(blank=True, null=True, help_text="Date d'envoi au chef de service"),
        ),
        migrations.AddField(
            model_name='echantillon',
            name='date_envoi_directeur_technique',
            field=models.DateField(blank=True, null=True, help_text="Date d'envoi au directeur technique"),
        ),
    ]