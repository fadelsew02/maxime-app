"""
Utilitaires pour les calculs de dates et prédictions
"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from django.utils import timezone


# Jours fériés 2025
JOURS_FERIES_2025 = [
    datetime(2025, 1, 1).date(),   # Jour de l'an
    datetime(2025, 4, 21).date(),  # Lundi de Pâques
    datetime(2025, 5, 1).date(),   # Fête du travail
    datetime(2025, 5, 29).date(),  # Ascension
    datetime(2025, 6, 9).date(),   # Lundi de Pentecôte
    datetime(2025, 8, 7).date(),   # Fête de l'indépendance
    datetime(2025, 8, 15).date(),  # Assomption
    datetime(2025, 11, 1).date(),  # Toussaint
    datetime(2025, 11, 15).date(), # Journée nationale de la paix
    datetime(2025, 12, 25).date(), # Noël
]

# Durées réelles des essais (en jours)
DUREES_ESSAIS = {
    'AG': 5,
    'Proctor': 5,
    'CBR': 9,
    'Oedometre': 18,
    'Cisaillement': 4,
}

# Capacités par type d'essai par jour
CAPACITES_PAR_JOUR = {
    'AG': 5,
    'Proctor': 4,
    'CBR': 4,
    'Oedometre': 10,
    'Cisaillement': 4,
}


def est_jour_ferie(date):
    """Vérifie si une date est un jour férié"""
    return date in JOURS_FERIES_2025


def est_weekend(date):
    """Vérifie si une date est un weekend"""
    return date.weekday() in [5, 6]  # Samedi ou Dimanche


def ajouter_jours_ouvrables(date_debut, nombre_jours):
    """Ajoute des jours ouvrables (excluant week-ends et jours fériés)"""
    date_resultat = date_debut
    jours_ajoutes = 0
    
    while jours_ajoutes < nombre_jours:
        date_resultat += timedelta(days=1)
        if not est_weekend(date_resultat) and not est_jour_ferie(date_resultat):
            jours_ajoutes += 1
    
    return date_resultat


def compter_echantillons_en_attente():
    """Compte les échantillons en attente par type d'essai"""
    from .models import Echantillon
    
    compteurs = {
        'AG': 0,
        'Proctor': 0,
        'CBR': 0,
        'Oedometre': 0,
        'Cisaillement': 0
    }
    
    echantillons = Echantillon.objects.filter(statut__in=['stockage', 'essais'])
    
    for ech in echantillons:
        essais_types = ech.essais_types or []
        for type_essai in essais_types:
            if type_essai in compteurs:
                compteurs[type_essai] += 1
    
    return compteurs


def calculer_date_envoi_et_retour(echantillon):
    """
    Calcule la date d'envoi et de retour prédite pour un échantillon
    basé sur les contraintes réelles du laboratoire
    """
    aujourd_hui = timezone.now().date()
    charge = compter_echantillons_en_attente()
    
    essais_types = echantillon.essais_types or []
    
    delai_max_envoi = 0
    duree_essai_plus_long = 0
    details_par_essai = {}
    
    for essai in essais_types:
        duree_essai = DUREES_ESSAIS.get(essai, 0)
        capacite_jour = CAPACITES_PAR_JOUR.get(essai, 1)
        charge_actuelle = charge.get(essai, 0)
        
        delai_attente = 0
        
        # Calcul spécifique pour l'œdométrique
        if essai == 'Oedometre':
            if charge_actuelle >= 10:
                delai_attente = int((charge_actuelle - 9) * 18 / 10)
        else:
            delai_attente = int(charge_actuelle / capacite_jour)
        
        # Garder la durée de l'essai le plus long
        if duree_essai > duree_essai_plus_long:
            duree_essai_plus_long = duree_essai
        
        # Garder le délai d'attente le plus long
        if delai_attente > delai_max_envoi:
            delai_max_envoi = delai_attente
        
        # Calculer les dates pour cet essai
        date_envoi_essai = ajouter_jours_ouvrables(aujourd_hui, delai_attente)
        date_retour_essai = ajouter_jours_ouvrables(aujourd_hui, delai_attente + duree_essai + 2)
        
        details_par_essai[essai] = {
            'delai_attente': delai_attente,
            'duree_essai': duree_essai,
            'date_envoi': date_envoi_essai.strftime('%A %d %B %Y'),
            'date_retour': date_retour_essai.strftime('%A %d %B %Y'),
            'charge_actuelle': charge_actuelle
        }
    
    # Date d'envoi = aujourd'hui + délai d'attente maximum
    date_envoi = ajouter_jours_ouvrables(aujourd_hui, delai_max_envoi)
    
    # Date de retour = délai d'attente + essai le plus long + 2 jours de traitement
    delai_traitement = 2
    delai_retour_total = delai_max_envoi + duree_essai_plus_long + delai_traitement
    date_retour = ajouter_jours_ouvrables(aujourd_hui, delai_retour_total)
    
    # Calcul de la confiance
    confidence = 90
    if delai_max_envoi > 5:
        confidence -= 15
    elif delai_max_envoi > 2:
        confidence -= 5
    
    confidence = min(95, max(75, confidence))
    
    return {
        'date_envoi': date_envoi.strftime('%A %d %B %Y'),
        'date_envoi_iso': date_envoi.isoformat(),
        'confidence': confidence,
        'raison': 'Basé sur les contraintes réelles du laboratoire',
        'delai_jours': delai_max_envoi,
        'date_retour': date_retour.strftime('%A %d %B %Y'),
        'date_retour_iso': date_retour.isoformat(),
        'confidence_retour': confidence - 5,
        'raison_retour': f'Délai total: {duree_essai_plus_long} jours d\'essais + {delai_traitement} jours de traitement',
        'delai_retour_jours': delai_retour_total,
        'charge_par_essai': charge,
        'details_par_essai': details_par_essai
    }


def generer_dates_envoi_par_type(echantillons, type_essai, date_base_str, capacite_jour):
    """
    Génère des dates d'envoi différentes selon la contrainte de capacité
    """
    compteur = 0
    date_base = datetime.strptime(date_base_str, '%Y-%m-%d').date()
    
    for ech in echantillons:
        essais_types = ech.get('essais_types', [])
        if type_essai in essais_types:
            jours_decalage = int(compteur / capacite_jour)
            date_envoi = date_base + timedelta(days=jours_decalage)
            ech[f'date_envoi_{type_essai.lower()}'] = date_envoi.strftime('%d/%m/%Y')
            compteur += 1
    
    return echantillons
