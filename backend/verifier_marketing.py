import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Verifier si un compte marketing existe
marketing_users = User.objects.filter(role='service_marketing')

if marketing_users.exists():
    print(f"[OK] {marketing_users.count()} compte(s) marketing trouve(s):")
    for user in marketing_users:
        print(f"  - Username: {user.username}")
        print(f"    Email: {user.email}")
        print(f"    Nom: {user.get_full_name()}")
        print(f"    Actif: {user.is_active}")
        print()
else:
    print("[ERREUR] Aucun compte marketing trouve")
    print("\n[INFO] Creation du compte marketing...")
    
    # Creer le compte marketing
    marketing_user = User.objects.create_user(
        username='marketing',
        password='demo123',
        email='marketing@snertp.com',
        first_name='Service',
        last_name='Marketing',
        role='service_marketing',
        is_active=True
    )
    
    print("[OK] Compte marketing cree avec succes!")
    print(f"  - Username: {marketing_user.username}")
    print(f"  - Password: demo123")
    print(f"  - Email: {marketing_user.email}")
    print(f"  - Nom: {marketing_user.get_full_name()}")
