# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_workflowvalidation'),
    ]

    operations = [
        migrations.AddField(
            model_name='workflowvalidation',
            name='validation_chef_projet',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='rejet_chef_projet',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='raison_rejet_chef_projet',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='commentaire_chef_projet',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='rejet_chef_service',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='raison_rejet_chef_service',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='rejet_directeur_technique',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='raison_rejet_directeur_technique',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='rejet_directeur_snertp',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='raison_rejet_directeur_snertp',
            field=models.TextField(blank=True),
        ),
    ]
