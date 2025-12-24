import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate

username = 'marketing'
password = 'marketing123'

user = authenticate(username=username, password=password)

if user:
    print(f"[OK] Connexion reussie!")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Nom: {user.get_full_name()}")
    print(f"  Role: {user.role}")
else:
    print(f"[X] Echec de connexion")
    print(f"Tentative de reinitialisation du mot de passe...")
    from core.models import User
    try:
        user = User.objects.get(username=username)
        user.set_password(password)
        user.save()
        print(f"[OK] Mot de passe reinitialise a: {password}")
    except User.DoesNotExist:
        print(f"[X] Utilisateur non trouve")
