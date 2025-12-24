"""
Script pour créer/mettre à jour le compte réceptionniste
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_receptionniste():
    """Créer ou mettre à jour le compte réceptionniste"""
    
    # Supprimer l'ancien compte s'il existe
    User.objects.filter(username='receptionniste').delete()
    
    # Créer le nouveau compte
    user = User.objects.create_user(
        username='receptionniste',
        email='receptionniste@snertp.ci',
        password='password123',
        first_name='Marie',
        last_name='Kouassi',
        role='receptionniste'
    )
    
    print(f"+ Compte réceptionniste créé:")
    print(f"  Username: {user.username}")
    print(f"  Password: password123")
    print(f"  Email: {user.email}")
    print(f"  Rôle: {user.get_role_display()}")
    
    # Créer aussi un admin si nécessaire
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@snertp.ci',
            password='admin123',
            role='chef_service'
        )
        print(f"\n+ Compte admin créé:")
        print(f"  Username: {admin.username}")
        print(f"  Password: admin123")

if __name__ == '__main__':
    create_receptionniste()