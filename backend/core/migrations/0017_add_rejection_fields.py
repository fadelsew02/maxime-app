# Generated migration for essais rejetes support

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_workflowvalidation_observations_traitement'),
    ]

    operations = [
        migrations.AddField(
            model_name='workflowvalidation',
            name='date_rejet_chef_projet',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='date_rejet_chef_service',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='workflowvalidation',
            name='commentaires_rejet',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='workflowvalidation',
            name='statut',
            field=models.CharField(
                choices=[
                    ('en_attente', 'En attente'),
                    ('accepte', 'Accepté'),
                    ('rejete', 'Rejeté'),
                    ('validated', 'Validé'),
                    ('rejected', 'Rejeté'),
                ],
                default='en_attente',
                max_length=20
            ),
        ),
    ]