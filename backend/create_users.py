"""
Script pour créer tous les utilisateurs du laboratoire SNERTP
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

users_data = [
    {
        'username': 'admin',
        'password': 'admin123',
        'email': 'admin@snertp.com',
        'first_name': 'Admin',
        'last_name': 'SNERTP',
        'role': 'directeur_general',
        'is_superuser': True,
        'is_staff': True
    },
    {
        'username': 'directeur',
        'password': 'demo123',
        'email': 'direction@snertp.com',
        'first_name': 'Fatou',
        'last_name': 'SANOGO',
        'role': 'directeur_general'
    },
    {
        'username': 'dir_technique',
        'password': 'demo123',
        'email': 'technique@snertp.com',
        'first_name': 'Yves',
        'last_name': 'DIALLO',
        'role': 'directeur_technique'
    },
    {
        'username': 'chef_service',
        'password': 'demo123',
        'email': 'service@snertp.com',
        'first_name': 'Amani',
        'last_name': 'KOUAME',
        'role': 'chef_service'
    },
    {
        'username': 'chef_projet',
        'password': 'demo123',
        'email': 'projet@snertp.com',
        'first_name': 'Konan',
        'last_name': 'BROU',
        'role': 'chef_projet'
    },
    {
        'username': 'receptionniste',
        'password': 'demo123',
        'email': 'reception@snertp.com',
        'first_name': 'Marie',
        'last_name': 'KOUASSI',
        'role': 'receptionniste'
    },
    {
        'username': 'resp_materiaux',
        'password': 'demo123',
        'email': 'materiaux@snertp.com',
        'first_name': 'Jean',
        'last_name': 'KOFFI',
        'role': 'responsable_materiaux'
    },
    {
        'username': 'operateur_route',
        'password': 'demo123',
        'email': 'route@snertp.com',
        'first_name': 'Kouadio',
        'last_name': 'YAO',
        'role': 'operateur_route'
    },
    {
        'username': 'operateur_meca',
        'password': 'demo123',
        'email': 'mecanique@snertp.com',
        'first_name': 'Aya',
        'last_name': 'TRAORE',
        'role': 'operateur_mecanique'
    },
    {
        'username': 'resp_traitement',
        'password': 'demo123',
        'email': 'traitement@snertp.com',
        'first_name': 'Adjoua',
        'last_name': 'NGUESSAN',
        'role': 'responsable_traitement'
    }
]

def create_users():
    print("Creation des utilisateurs...")
    created = 0
    updated = 0
    
    for user_data in users_data:
        username = user_data['username']
        
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            user.email = user_data['email']
            user.first_name = user_data['first_name']
            user.last_name = user_data['last_name']
            user.role = user_data['role']
            user.set_password(user_data['password'])
            if user_data.get('is_superuser'):
                user.is_superuser = True
                user.is_staff = True
            user.save()
            print(f"  Mis a jour: {username}")
            updated += 1
        else:
            user = User.objects.create_user(
                username=username,
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role']
            )
            if user_data.get('is_superuser'):
                user.is_superuser = True
                user.is_staff = True
                user.save()
            print(f"  Cree: {username}")
            created += 1
    
    print(f"\nTermine: {created} crees, {updated} mis a jour")
    print(f"Total utilisateurs: {User.objects.count()}")

if __name__ == '__main__':
    create_users()
