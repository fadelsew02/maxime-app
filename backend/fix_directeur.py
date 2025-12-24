import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Corriger l'utilisateur directeur
try:
    user = User.objects.get(username='directeur')
    user.email = 'directeur@snertp.com'
    user.is_active = True
    user.is_staff = False
    user.set_password('directeur123')
    user.save()
    
    print("Utilisateur directeur corrige:")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Role: {user.role}")
    print(f"Active: {user.is_active}")
    print("Password: directeur123")
    
except User.DoesNotExist:
    print("Utilisateur directeur non trouve")