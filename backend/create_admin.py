#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Créer un admin si il n'existe pas
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@test.com',
        password='admin123',
        role='directeur_technique'
    )
    print("Utilisateur admin créé avec succès!")
    print("Username: admin")
    print("Password: admin123")
else:
    print("L'utilisateur admin existe déjà")

# Créer un réceptionniste
if not User.objects.filter(username='receptionniste').exists():
    User.objects.create_user(
        username='receptionniste',
        email='reception@test.com',
        password='reception123',
        role='receptionniste'
    )
    print("Utilisateur réceptionniste créé!")
    print("Username: receptionniste")
    print("Password: reception123")