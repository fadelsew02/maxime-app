"""
Script pour créer des données d'exemple avec dates et statuts
"""

import os
import django
from datetime import date, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Client, Echantillon, Essai

User = get_user_model()

def create_sample_data():
    """Créer des données d'exemple avec dates et statuts"""
    
    print("Création des données d'exemple...")
    
    # Créer un utilisateur réceptionniste si nécessaire
    receptionniste, created = User.objects.get_or_create(
        username='receptionniste',
        defaults={
            'email': 'receptionniste@snertp.ci',
            'first_name': 'Marie',
            'last_name': 'Kouassi',
            'role': 'receptionniste'
        }
    )
    if created:
        receptionniste.set_password('password123')
        receptionniste.save()
        print("+ Utilisateur réceptionniste créé")
    
    # Créer des clients
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
        {
            'nom': 'EIFFAGE CI',
            'contact': 'Mme Bamba',
            'projet': 'Échangeur Riviera',
            'email': 'bamba@eiffage.ci',
            'telephone': '+225 07 00 00 04'
        }
    ]
    
    clients = []
    for client_data in clients_data:
        client, created = Client.objects.get_or_create(
            nom=client_data['nom'],
            defaults={**client_data, 'created_by': receptionniste}
        )
        clients.append(client)
        if created:
            print(f"+ Client {client.code} - {client.nom}")
    
    # Créer des échantillons avec différents statuts et dates
    today = date.today()
    
    echantillons_data = [
        {
            'client': clients[0],
            'nature': 'Sol argileux rouge',
            'profondeur_debut': 0,
            'profondeur_fin': 2,
            'sondage': 'carotte',
            'nappe': 'Non rencontrée',
            'priorite': 'urgente',
            'chef_projet': 'Ing. Kouadio',
            'statut': 'essais',
            'date_reception': today - timedelta(days=5),
            'essais_types': ['AG', 'Proctor', 'CBR']
        },
        {
            'client': clients[1],
            'nature': 'Sol sableux fin',
            'profondeur_debut': 2,
            'profondeur_fin': 4,
            'sondage': 'vrac',
            'nappe': '3.5m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Diallo',
            'statut': 'traitement',
            'date_reception': today - timedelta(days=8),
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
            'statut': 'validation_chef_projet',
            'date_reception': today - timedelta(days=12),
            'essais_types': ['AG', 'Proctor']
        },
        {
            'client': clients[2],
            'nature': 'Grave latéritique',
            'profondeur_debut': 1,
            'profondeur_fin': 3,
            'sondage': 'vrac',
            'nappe': 'Non rencontrée',
            'priorite': 'urgente',
            'chef_projet': 'Ing. Yao',
            'statut': 'stockage',
            'date_reception': today - timedelta(days=2),
            'essais_types': ['AG', 'CBR']
        },
        {
            'client': clients[3],
            'nature': 'Sol argileux plastique',
            'profondeur_debut': 0,
            'profondeur_fin': 4,
            'sondage': 'carotte',
            'nappe': '1.8m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Bamba',
            'statut': 'valide',
            'date_reception': today - timedelta(days=20),
            'essais_types': ['Oedometre', 'Cisaillement', 'AG']
        },
        {
            'client': clients[1],
            'nature': 'Sable fin propre',
            'profondeur_debut': 3,
            'profondeur_fin': 5,
            'sondage': 'vrac',
            'nappe': '4.2m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Diallo',
            'statut': 'decodification',
            'date_reception': today - timedelta(days=7),
            'essais_types': ['Proctor', 'CBR']
        }
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
        
        # Vérifier si l'échantillon existe déjà
        existing = Echantillon.objects.filter(
            client=ech_data['client'],
            nature=ech_data['nature'],
            profondeur_debut=ech_data['profondeur_debut']
        ).first()
        
        if not existing:
            echantillon = Echantillon.objects.create(
                **ech_data,
                created_by=receptionniste
            )
            print(f"+ Échantillon {echantillon.code} - {echantillon.nature} ({echantillon.statut})")
            
            # Créer les essais avec dates selon le statut
            for essai_type in essais_types:
                section = 'route' if essai_type in ['AG', 'Proctor', 'CBR'] else 'mecanique'
                
                # Déterminer le statut de l'essai selon le statut de l'échantillon
                essai_statut = 'attente'
                date_reception = None
                date_debut = None
                date_fin = None
                
                if echantillon.statut in ['essais', 'decodification', 'traitement', 'validation', 'valide']:
                    essai_statut = 'termine'
                    date_reception = echantillon.date_reception + timedelta(days=1)
                    date_debut = date_reception + timedelta(days=random.randint(0, 2))
                    date_fin = date_debut + timedelta(days=durees[essai_type])
                elif echantillon.statut == 'stockage':
                    essai_statut = 'attente'
                    date_reception = echantillon.date_reception + timedelta(days=1)
                
                essai = Essai.objects.create(
                    echantillon=echantillon,
                    type=essai_type,
                    section=section,
                    statut=essai_statut,
                    duree_estimee=durees[essai_type],
                    date_reception=date_reception,
                    date_debut=date_debut,
                    date_fin=date_fin
                )
                
                # Ajouter des résultats pour les essais terminés
                if essai_statut == 'termine':
                    if essai_type == 'AG':
                        essai.resultats = {
                            'passant_80': random.randint(85, 95),
                            'passant_2': random.randint(60, 80),
                            'passant_0_08': random.randint(15, 35)
                        }
                    elif essai_type == 'Proctor':
                        essai.resultats = {
                            'densite_seche_max': round(random.uniform(1.8, 2.1), 2),
                            'teneur_eau_opt': round(random.uniform(8, 15), 1)
                        }
                    elif essai_type == 'CBR':
                        essai.resultats = {
                            'cbr_95': random.randint(15, 45),
                            'cbr_98': random.randint(20, 55)
                        }
                    elif essai_type == 'Oedometre':
                        essai.resultats = {
                            'cc': round(random.uniform(0.1, 0.4), 3),
                            'cs': round(random.uniform(0.01, 0.05), 3)
                        }
                    elif essai_type == 'Cisaillement':
                        essai.resultats = {
                            'cohesion': random.randint(10, 50),
                            'angle_frottement': random.randint(20, 35)
                        }
                    essai.save()
                
                print(f"  -> Essai {essai_type} ({essai_statut})")

    print(f"\n+ Données d'exemple créées avec succès!")
    print(f"+ {Echantillon.objects.count()} échantillons")
    print(f"+ {Essai.objects.count()} essais")
    print(f"+ {Client.objects.count()} clients")

if __name__ == '__main__':
    create_sample_data()