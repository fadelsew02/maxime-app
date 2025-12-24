"""
Script pour mettre à jour les dates des échantillons
"""

import os
import django
from datetime import date, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon, Essai

def update_echantillons_dates():
    """Mettre à jour les dates des échantillons selon leur statut"""
    
    print("Mise à jour des dates des échantillons...")
    
    echantillons = Echantillon.objects.all()
    
    for ech in echantillons:
        print(f"\nTraitement de {ech.code} - Statut: {ech.statut}")
        
        # Date de réception (déjà définie)
        if not ech.date_reception:
            ech.date_reception = date.today() - timedelta(days=random.randint(1, 30))
        
        # Date d'envoi aux essais (1-2 jours après réception)
        if not ech.date_envoi_essais and ech.statut not in ['attente', 'stockage']:
            ech.date_envoi_essais = ech.date_reception + timedelta(days=random.randint(1, 2))
            print(f"  + Date envoi essais: {ech.date_envoi_essais}")
        
        # Dates d'envoi par type d'essai selon le statut
        if ech.statut in ['essais', 'decodification', 'traitement', 'validation', 'valide']:
            essais = ech.essais.all()
            
            for essai in essais:
                # Date de réception de l'essai
                if not essai.date_reception:
                    essai.date_reception = ech.date_envoi_essais or (ech.date_reception + timedelta(days=1))
                
                # Date de début et fin selon le statut
                if essai.statut == 'termine' and not essai.date_debut:
                    essai.date_debut = essai.date_reception + timedelta(days=random.randint(0, 2))
                    essai.date_fin = essai.date_debut + timedelta(days=essai.duree_estimee)
                    essai.save()
                    print(f"    -> {essai.type}: {essai.date_debut} à {essai.date_fin}")
                
                # Mettre à jour les dates d'envoi spécifiques dans l'échantillon
                if essai.type == 'AG' and not ech.date_envoi_ag:
                    ech.date_envoi_ag = essai.date_reception
                elif essai.type == 'Proctor' and not ech.date_envoi_proctor:
                    ech.date_envoi_proctor = essai.date_reception
                elif essai.type == 'CBR' and not ech.date_envoi_cbr:
                    ech.date_envoi_cbr = essai.date_reception
                elif essai.type == 'Oedometre' and not ech.date_envoi_oedometre:
                    ech.date_envoi_oedometre = essai.date_reception
                elif essai.type == 'Cisaillement' and not ech.date_envoi_cisaillement:
                    ech.date_envoi_cisaillement = essai.date_reception
        
        # Date envoi traitement (après tous les essais terminés)
        if ech.statut in ['traitement', 'validation', 'valide'] and not ech.date_envoi_traitement:
            # Trouver la date de fin du dernier essai
            derniers_essais = ech.essais.filter(statut='termine').order_by('-date_fin')
            if derniers_essais.exists():
                derniere_date = derniers_essais.first().date_fin
                if derniere_date:
                    ech.date_envoi_traitement = derniere_date + timedelta(days=random.randint(1, 3))
                    print(f"  + Date envoi traitement: {ech.date_envoi_traitement}")
            elif ech.date_envoi_essais:
                # Si pas d'essais terminés, utiliser date envoi essais + délai
                ech.date_envoi_traitement = ech.date_envoi_essais + timedelta(days=random.randint(7, 14))
                print(f"  + Date envoi traitement (estimée): {ech.date_envoi_traitement}")
        
        # Date envoi chef projet (après traitement)
        if ech.statut in ['validation', 'valide'] and not ech.date_envoi_chef_projet:
            if ech.date_envoi_traitement:
                ech.date_envoi_chef_projet = ech.date_envoi_traitement + timedelta(days=random.randint(2, 5))
                print(f"  + Date envoi chef projet: {ech.date_envoi_chef_projet}")
            elif ech.date_envoi_essais:
                ech.date_envoi_chef_projet = ech.date_envoi_essais + timedelta(days=random.randint(10, 20))
                print(f"  + Date envoi chef projet (estimée): {ech.date_envoi_chef_projet}")
        
        ech.save()
    
    print(f"\n+ {echantillons.count()} echantillons mis a jour")

def add_missing_fields():
    """Ajouter les champs manquants au modèle Echantillon"""
    
    # Comme on ne peut pas modifier le modèle à chaud, on va créer des données
    # dans les champs existants ou utiliser des calculs
    
    print("\nAjout des dates calculées...")
    
    echantillons = Echantillon.objects.all()
    
    for ech in echantillons:
        # Calculer date_retour_predite si pas définie
        if not ech.date_retour_predite and ech.essais.exists():
            # Prendre la date de fin du dernier essai + délai de traitement
            derniers_essais = ech.essais.order_by('-date_fin')
            if derniers_essais.exists():
                derniere_date = derniers_essais.first().date_fin
                if derniere_date:
                    ech.date_retour_predite = derniere_date + timedelta(days=random.randint(5, 15))
                    ech.save()
                    print(f"  {ech.code}: Date retour prédite = {ech.date_retour_predite}")

if __name__ == '__main__':
    update_echantillons_dates()
    add_missing_fields()
    print("\n+ Mise a jour terminee!")