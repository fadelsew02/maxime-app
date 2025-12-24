#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Changer tous les mots de passe à demo123
users = User.objects.all()
for user in users:
    user.set_password('demo123')
    user.save()
    print(f"Mot de passe changé pour: {user.username}")

print("\nTous les comptes utilisent maintenant le mot de passe: demo123")