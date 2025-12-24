import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

try:
    user = User.objects.get(username='marketing')
    print(f"Compte trouve:")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Nom: {user.get_full_name()}")
    print(f"  Role: {user.role}")
    
    if user.role != 'service_marketing':
        print(f"\n[!] Le role actuel est '{user.role}', mise a jour vers 'service_marketing'...")
        user.role = 'service_marketing'
        user.save()
        print("[OK] Role mis a jour!")
    else:
        print("\n[OK] Le role est deja 'service_marketing'")
        
except User.DoesNotExist:
    print("[X] Le compte 'marketing' n'existe pas")
