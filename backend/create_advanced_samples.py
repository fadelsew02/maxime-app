"""
Script pour créer des échantillons avec des statuts avancés et toutes les dates
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

def create_advanced_samples():
    """Créer des échantillons avec tous les statuts et dates complètes"""
    
    print("Création d'échantillons avancés...")
    
    receptionniste = User.objects.get(username='receptionniste')
    clients = list(Client.objects.all()[:5])  # Prendre les 5 premiers clients
    
    today = date.today()
    
    # Échantillons avec différents statuts et dates complètes
    echantillons_data = [
        {
            'client': clients[0],
            'nature': 'Sol argileux compact',
            'profondeur_debut': 0,
            'profondeur_fin': 3,
            'sondage': 'carotte',
            'nappe': 'Non rencontrée',
            'priorite': 'urgente',
            'chef_projet': 'Ing. Kouadio',
            'statut': 'valide',
            'date_reception': today - timedelta(days=25),
            'essais_types': ['AG', 'Proctor', 'CBR']
        },
        {
            'client': clients[1],
            'nature': 'Sable argileux',
            'profondeur_debut': 1,
            'profondeur_fin': 4,
            'sondage': 'vrac',
            'nappe': '2.8m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Diallo',
            'statut': 'validation',
            'date_reception': today - timedelta(days=18),
            'essais_types': ['Oedometre', 'Cisaillement', 'AG']
        },
        {
            'client': clients[2],
            'nature': 'Grave cimentée',
            'profondeur_debut': 0,
            'profondeur_fin': 2,
            'sondage': 'carotte',
            'nappe': 'Non rencontrée',
            'priorite': 'urgente',
            'chef_projet': 'Ing. Yao',
            'statut': 'traitement',
            'date_reception': today - timedelta(days=15),
            'essais_types': ['AG', 'CBR']
        },
        {
            'client': clients[3],
            'nature': 'Sol limoneux plastique',
            'profondeur_debut': 2,
            'profondeur_fin': 5,
            'sondage': 'vrac',
            'nappe': '3.2m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Bamba',
            'statut': 'decodification',
            'date_reception': today - timedelta(days=12),
            'essais_types': ['Proctor', 'CBR', 'Oedometre']
        },
        {
            'client': clients[4],
            'nature': 'Sable fin uniforme',
            'profondeur_debut': 0,
            'profondeur_fin': 3,
            'sondage': 'vrac',
            'nappe': '4.5m',
            'priorite': 'normale',
            'chef_projet': 'Ing. Kouadio',
            'statut': 'essais',
            'date_reception': today - timedelta(days=8),
            'essais_types': ['AG', 'Proctor']
        },
        {
            'client': clients[0],
            'nature': 'Argile plastique',
            'profondeur_debut': 3,
            'profondeur_fin': 6,
            'sondage': 'carotte',
            'nappe': '1.5m',
            'priorite': 'urgente',
            'chef_projet': 'Ing. Diallo',
            'statut': 'valide',
            'date_reception': today - timedelta(days=30),
            'essais_types': ['Cisaillement', 'Oedometre']
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
        
        # Créer l'échantillon
        echantillon = Echantillon.objects.create(
            **ech_data,
            created_by=receptionniste
        )
        
        print(f"\n+ Échantillon {echantillon.code} - {echantillon.statut}")
        
        # Calculer les dates selon le statut
        date_reception = echantillon.date_reception
        date_envoi_essais = date_reception + timedelta(days=random.randint(1, 2))
        
        # Mettre à jour les dates de l'échantillon
        echantillon.date_envoi_essais = date_envoi_essais
        
        # Créer les essais avec dates appropriées
        essais_crees = []
        for essai_type in essais_types:
            section = 'route' if essai_type in ['AG', 'Proctor', 'CBR'] else 'mecanique'
            
            # Déterminer les dates selon le statut de l'échantillon
            date_reception_essai = date_envoi_essais
            date_debut = None
            date_fin = None
            statut_essai = 'attente'
            
            if echantillon.statut in ['essais', 'decodification', 'traitement', 'validation', 'valide']:
                statut_essai = 'termine'
                date_debut = date_reception_essai + timedelta(days=random.randint(0, 3))
                date_fin = date_debut + timedelta(days=durees[essai_type])
            
            essai = Essai.objects.create(
                echantillon=echantillon,
                type=essai_type,
                section=section,
                statut=statut_essai,
                duree_estimee=durees[essai_type],
                date_reception=date_reception_essai,
                date_debut=date_debut,
                date_fin=date_fin
            )
            
            essais_crees.append(essai)
            print(f"  -> {essai_type}: {statut_essai}")
            
            # Ajouter des résultats pour les essais terminés
            if statut_essai == 'termine':
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
        
        # Calculer les dates de traitement et chef projet selon le statut
        if echantillon.statut in ['traitement', 'validation', 'valide']:
            # Date envoi traitement = fin du dernier essai + délai
            derniers_essais = [e for e in essais_crees if e.date_fin]
            if derniers_essais:
                derniere_date = max(e.date_fin for e in derniers_essais)
                echantillon.date_envoi_traitement = derniere_date + timedelta(days=random.randint(1, 3))
                print(f"  + Date envoi traitement: {echantillon.date_envoi_traitement}")
        
        if echantillon.statut in ['validation', 'valide']:
            # Date envoi chef projet = date traitement + délai
            if echantillon.date_envoi_traitement:
                echantillon.date_envoi_chef_projet = echantillon.date_envoi_traitement + timedelta(days=random.randint(2, 5))
                print(f"  + Date envoi chef projet: {echantillon.date_envoi_chef_projet}")
        
        # Calculer date de retour prédite
        if essais_crees and any(e.date_fin for e in essais_crees):
            derniere_date = max(e.date_fin for e in essais_crees if e.date_fin)
            echantillon.date_retour_predite = derniere_date + timedelta(days=random.randint(5, 15))
        
        echantillon.save()
    
    print(f"\n+ {len(echantillons_data)} échantillons avancés créés")

if __name__ == '__main__':
    create_advanced_samples()