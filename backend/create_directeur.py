import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Créer l'utilisateur Django avec le rôle
user, created = User.objects.get_or_create(
    username='directeur',
    defaults={
        'email': 'directeur@snertp.com',
        'first_name': 'Directeur',
        'last_name': 'SNERTP',
        'role': 'directeur_snertp'
    }
)

if created:
    user.set_password('directeur123')
    user.save()
    print("Utilisateur cree avec le role directeur_snertp")
else:
    user.role = 'directeur_snertp'
    user.save()
    print("Utilisateur mis a jour avec le role directeur_snertp")

print(f"Username: directeur")
print(f"Email: directeur@snertp.com") 
print(f"Password: directeur123")
print(f"Role: directeur_snertp")