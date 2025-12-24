# Generated migration for new fields

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_add_rejection_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='echantillon',
            name='numero_sondage',
            field=models.CharField(blank=True, help_text='Numéro de sondage (obligatoire si caroté)', max_length=50),
        ),
        migrations.AddField(
            model_name='essai',
            name='priorite',
            field=models.CharField(
                choices=[('normale', 'Normale'), ('urgente', 'Urgente')],
                default='normale',
                max_length=10
            ),
        ),
        migrations.AlterField(
            model_name='client',
            name='email',
            field=models.EmailField(help_text="Adresse e-mail de l'entreprise ou de la personne", max_length=254),
        ),
        migrations.AlterField(
            model_name='client',
            name='telephone',
            field=models.CharField(help_text='Téléphone', max_length=20),
        ),
        migrations.AlterField(
            model_name='client',
            name='nom',
            field=models.CharField(help_text="Nom de l'entreprise", max_length=200),
        ),
        migrations.AlterField(
            model_name='client',
            name='projet',
            field=models.CharField(help_text='Nom du projet', max_length=300),
        ),
        migrations.AlterField(
            model_name='client',
            name='contact',
            field=models.CharField(help_text='Personne ayant apporté les échantillons', max_length=200),
        ),
    ]