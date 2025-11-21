"""
Script pour créer des données d'exemple
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Client, Echantillon, Essai
from scheduler.models import Ressource, ContrainteTemporelle
from datetime import date, timedelta

User = get_user_model()


def create_users():
    """Créer des utilisateurs de test pour chaque rôle"""
    
    users_data = [
        {'username': 'receptionniste', 'role': 'receptionniste', 'first_name': 'Marie', 'last_name': 'Kouassi'},
        {'username': 'responsable_mat', 'role': 'responsable_materiaux', 'first_name': 'Jean', 'last_name': 'Kone'},
        {'username': 'operateur_route', 'role': 'operateur_route', 'first_name': 'Amadou', 'last_name': 'Diallo'},
        {'username': 'operateur_meca', 'role': 'operateur_mecanique', 'first_name': 'Sophie', 'last_name': 'Traore'},
        {'username': 'resp_traitement', 'role': 'responsable_traitement', 'first_name': 'Paul', 'last_name': 'Yao'},
        {'username': 'chef_projet', 'role': 'chef_projet', 'first_name': 'Kouadio', 'last_name': 'Ing'},
        {'username': 'chef_service', 'role': 'chef_service', 'first_name': 'Diarra', 'last_name': 'Ing'},
        {'username': 'dir_technique', 'role': 'directeur_technique', 'first_name': 'Toure', 'last_name': 'Dr'},
        {'username': 'dir_general', 'role': 'directeur_general', 'first_name': 'Bamba', 'last_name': 'Dr'},
    ]
    
    print("Création des utilisateurs...")
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': f"{user_data['username']}@snertp.ci",
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'role': user_data['role']
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✓ {user.username} ({user.get_role_display()})")
    
    # Créer le superuser
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@snertp.ci',
            password='admin123',
            role='chef_service'
        )
        print("✓ admin (Superuser)")


def create_clients():
    """Créer des clients de test"""
    
    clients_data = [
        {
            'nom': 'SOGEA-SATOM',
            'contact': 'M. Koné',
            'projet': 'Autoroute Abidjan-Grand Bassam',
            'email': 'kone@sogea-satom.com',
            'telephone': '+225 07 00 00 01'
        },
        {
            'nom': 'Bouygues TP',
            'contact': 'Mme Traoré',
            'projet': 'Pont 3ème Pont',
            'email': 'traore@bouygues.com',
            'telephone': '+225 07 00 00 02'
        },
        {
            'nom': 'COLAS CI',
            'contact': 'M. Diallo',
            'projet': 'Route Yamoussoukro-Bouaké',
            'email': 'diallo@colas.ci',
            'telephone': '+225 07 00 00 03'
        },
    ]
    
    print("\nCréation des clients...")
    receptionniste = User.objects.get(username='receptionniste')
    
    for client_data in clients_data:
        client, created = Client.objects.get_or_create(
            nom=client_data['nom'],
            defaults={**client_data, 'created_by': receptionniste}
        )
        if created:
            print(f"✓ {client.code} - {client.nom}")


def create_echantillons():
    """Créer des échantillons de test"""
    
    print("\nCréation des échantillons...")
    receptionniste = User.objects.get(username='receptionniste')
    clients = list(Client.objects.all())
    
    echantillons_data = [
        {
            'client': clients[0],
            'nature': 'Sol argileux',
            'profondeur_debut': 0,
            'profondeur_fin': 2,
            'sondage': 'carotte',
            'nappe': 'Non rencontrée',
            'priorite': 'urgente',
            'chef_projet': 'Ing. Kouadio',
            'essais_types': ['AG', 'Proctor', 'CBR']
        },
        {
            'client': clients[1],
            'nature': 'Sol sableux',
            'profondeur_debut': 2,
            'profondeur_fin': 4,
            'sondage': 'vrac',
            'nappe': '3.5m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Diallo',
            'essais_types': ['Oedometre', 'Cisaillement']
        },
        {
            'client': clients[0],
            'nature': 'Sol limoneux',
            'profondeur_debut': 0,
            'profondeur_fin': 3,
            'sondage': 'carotte',
            'nappe': '2.5m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Kouadio',
            'essais_types': ['AG', 'Proctor']
        },
    ]
    
    durees = {
        'AG': 5,
        'Proctor': 4,
        'CBR': 5,
        'Oedometre': 18,
        'Cisaillement': 8,
    }
    
    for ech_data in echantillons_data:
        essais_types = ech_data.pop('essais_types')
        
        echantillon, created = Echantillon.objects.get_or_create(
            client=ech_data['client'],
            nature=ech_data['nature'],
            profondeur_debut=ech_data['profondeur_debut'],
            defaults={**ech_data, 'created_by': receptionniste}
        )
        
        if created:
            print(f"✓ {echantillon.code} - {echantillon.nature}")
            
            # Créer les essais
            for essai_type in essais_types:
                section = 'route' if essai_type in ['AG', 'Proctor', 'CBR'] else 'mecanique'
                Essai.objects.create(
                    echantillon=echantillon,
                    type=essai_type,
                    section=section,
                    duree_estimee=durees[essai_type]
                )
                print(f"  → Essai {essai_type} créé")


def create_ressources():
    """Créer des ressources de test"""
    
    ressources_data = [
        {'nom': 'Tamis vibrant 1', 'type': 'equipement', 'section': 'route', 'capacite': 2},
        {'nom': 'Tamis vibrant 2', 'type': 'equipement', 'section': 'route', 'capacite': 2},
        {'nom': 'Moule Proctor', 'type': 'equipement', 'section': 'route', 'capacite': 3},
        {'nom': 'Presse CBR', 'type': 'equipement', 'section': 'route', 'capacite': 1},
        {'nom': 'Oedomètre 1', 'type': 'equipement', 'section': 'mecanique', 'capacite': 1},
        {'nom': 'Appareil cisaillement', 'type': 'equipement', 'section': 'mecanique', 'capacite': 1},
        {'nom': 'Salle Route', 'type': 'salle', 'section': 'route', 'capacite': 5},
        {'nom': 'Salle Mécanique', 'type': 'salle', 'section': 'mecanique', 'capacite': 3},
    ]
    
    print("\nCréation des ressources...")
    for res_data in ressources_data:
        ressource, created = Ressource.objects.get_or_create(
            nom=res_data['nom'],
            defaults=res_data
        )
        if created:
            print(f"✓ {ressource.nom} ({ressource.get_section_display()})")


def create_contraintes():
    """Créer des contraintes temporelles de test"""
    
    print("\nCréation des contraintes...")
    
    # Jours fériés (exemple)
    today = date.today()
    
    contraintes_data = [
        {
            'type': 'jour_ferme',
            'date_debut': today + timedelta(days=7),
            'date_fin': today + timedelta(days=7),
            'description': 'Jour férié - Fête nationale'
        },
        {
            'type': 'plage_indisponible',
            'date_debut': today + timedelta(days=14),
            'date_fin': today + timedelta(days=16),
            'section': 'route',
            'description': 'Maintenance équipements section route'
        },
    ]
    
    for ctr_data in contraintes_data:
        contrainte, created = ContrainteTemporelle.objects.get_or_create(
            type=ctr_data['type'],
            date_debut=ctr_data['date_debut'],
            defaults=ctr_data
        )
        if created:
            print(f"✓ {contrainte.get_type_display()} - {contrainte.date_debut}")


def main():
    """Fonction principale"""
    
    print("="*60)
    print("CRÉATION DES DONNÉES D'EXEMPLE - SNERTP LAB")
    print("="*60)
    
    create_users()
    create_clients()
    create_echantillons()
    create_ressources()
    create_contraintes()
    
    print("\n" + "="*60)
    print("DONNÉES CRÉÉES AVEC SUCCÈS!")
    print("="*60)
    print("\nComptes utilisateurs:")
    print("-" * 40)
    for role in ['receptionniste', 'responsable_mat', 'operateur_route', 
                 'operateur_meca', 'resp_traitement', 'chef_projet',
                 'chef_service', 'dir_technique', 'dir_general']:
        print(f"  {role:20s} / password123")
    print(f"  {'admin':20s} / admin123 (superuser)")
    print("="*60)


if __name__ == '__main__':
    main()
