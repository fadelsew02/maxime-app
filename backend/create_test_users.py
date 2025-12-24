import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Liste des utilisateurs à créer
users_data = [
    {
        'username': 'admin',
        'password': 'admin123',
        'role': 'directeur_general',
        'first_name': 'Admin',
        'last_name': 'SNERTP',
        'email': 'admin@snertp.com',
        'phone': '+225 01 02 03 04 05'
    },
    {
        'username': 'receptionniste',
        'password': 'demo123',
        'role': 'receptionniste',
        'first_name': 'Marie',
        'last_name': 'KOUASSI',
        'email': 'reception@snertp.com',
        'phone': '+225 01 02 03 04 10'
    },
    {
        'username': 'resp_materiaux',
        'password': 'demo123',
        'role': 'responsable_materiaux',
        'first_name': 'Jean',
        'last_name': 'KOFFI',
        'email': 'materiaux@snertp.com',
        'phone': '+225 01 02 03 04 11'
    },
    {
        'username': 'operateur_route',
        'password': 'demo123',
        'role': 'operateur_route',
        'first_name': 'Kouadio',
        'last_name': 'YAO',
        'email': 'route@snertp.com',
        'phone': '+225 01 02 03 04 12'
    },
    {
        'username': 'operateur_meca',
        'password': 'demo123',
        'role': 'operateur_mecanique',
        'first_name': 'Aya',
        'last_name': 'TRAORE',
        'email': 'mecanique@snertp.com',
        'phone': '+225 01 02 03 04 13'
    },
    {
        'username': 'resp_traitement',
        'password': 'demo123',
        'role': 'responsable_traitement',
        'first_name': 'Adjoua',
        'last_name': 'N\'GUESSAN',
        'email': 'traitement@snertp.com',
        'phone': '+225 01 02 03 04 14'
    },
    {
        'username': 'chef_projet',
        'password': 'demo123',
        'role': 'chef_projet',
        'first_name': 'Konan',
        'last_name': 'BROU',
        'email': 'projet@snertp.com',
        'phone': '+225 01 02 03 04 15'
    },
    {
        'username': 'chef_service',
        'password': 'demo123',
        'role': 'chef_service',
        'first_name': 'Amani',
        'last_name': 'KOUAME',
        'email': 'service@snertp.com',
        'phone': '+225 01 02 03 04 16'
    },
    {
        'username': 'dir_technique',
        'password': 'demo123',
        'role': 'directeur_technique',
        'first_name': 'Yves',
        'last_name': 'DIALLO',
        'email': 'technique@snertp.com',
        'phone': '+225 01 02 03 04 17'
    },
    {
        'username': 'directeur',
        'password': 'demo123',
        'role': 'directeur_general',
        'first_name': 'Fatou',
        'last_name': 'SANOGO',
        'email': 'direction@snertp.com',
        'phone': '+225 01 02 03 04 18'
    },
]

print("=" * 60)
print("CRÉATION DES UTILISATEURS DE TEST")
print("=" * 60)
print()

created_count = 0
updated_count = 0

for user_data in users_data:
    username = user_data['username']
    
    # Vérifier si l'utilisateur existe déjà
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': user_data['email'],
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'role': user_data['role'],
            'phone': user_data.get('phone', ''),
        }
    )
    
    if created:
        user.set_password(user_data['password'])
        user.save()
        created_count += 1
        print(f"✓ Créé: {username} ({user.get_role_display()})")
    else:
        # Mettre à jour l'utilisateur existant
        user.email = user_data['email']
        user.first_name = user_data['first_name']
        user.last_name = user_data['last_name']
        user.role = user_data['role']
        user.phone = user_data.get('phone', '')
        user.set_password(user_data['password'])
        user.save()
        updated_count += 1
        print(f"↻ Mis à jour: {username} ({user.get_role_display()})")

print()
print("=" * 60)
print(f"RÉSUMÉ: {created_count} créés, {updated_count} mis à jour")
print("=" * 60)
print()
print("Tous les utilisateurs ont le mot de passe: demo123")
print("(sauf 'admin' qui a le mot de passe: admin123)")
