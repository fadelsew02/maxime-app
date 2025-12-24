import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

user = User.objects.get(username='admin')
user.set_password('admin123')
user.role = 'directeur_general'  # Rôle avec tous les droits
user.first_name = 'Admin'
user.last_name = 'SNERTP'
user.email = 'admin@snertp.com'
user.save()

print("✓ Utilisateur admin configuré avec succès!")
print("Username: admin")
print("Password: admin123")
print(f"Role: {user.get_role_display()}")
