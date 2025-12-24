import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Créer le compte marketing
username = 'marketing'
email = 'marketing@snertp.com'
password = 'marketing123'
first_name = 'Service'
last_name = 'Marketing'
role = 'service_marketing'

if User.objects.filter(username=username).exists():
    print(f"[X] Le compte '{username}' existe deja")
else:
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role
    )
    print(f"[OK] Compte marketing cree avec succes!")
    print(f"   Username: {user.username}")
    print(f"   Email: {user.email}")
    print(f"   Nom: {user.get_full_name()}")
    print(f"   Role: {user.role}")
