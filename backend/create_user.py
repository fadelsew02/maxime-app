import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Créer l'utilisateur operateur_meca
if not User.objects.filter(username='operateur_meca').exists():
    user = User.objects.create_user(
        username='operateur_meca',
        password='password123',
        email='operateur_meca@snertp.com',
        role='operateur_mecanique',
        first_name='Opérateur',
        last_name='Mécanique'
    )
    print(f"Utilisateur créé: {user.username} - Role: {user.role}")
else:
    print("L'utilisateur operateur_meca existe déjà")
