#!/usr/bin/env python
"""
Script pour initialiser les capacités du laboratoire
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CapaciteLaboratoire

def init_capacites():
    """Initialise les capacités du laboratoire"""
    
    capacites_data = [
        {
            'type_essai': 'AG',
            'capacite_quotidienne': 5,
            'duree_standard_jours': 5,
        },
        {
            'type_essai': 'Proctor',
            'capacite_quotidienne': 4,
            'duree_standard_jours': 5,
        },
        {
            'type_essai': 'CBR',
            'capacite_quotidienne': 4,
            'duree_standard_jours': 9,
        },
        {
            'type_essai': 'Oedometre',
            'capacite_quotidienne': 10,
            'capacite_simultanee': 10,
            'duree_standard_jours': 18,
        },
        {
            'type_essai': 'Cisaillement',
            'capacite_quotidienne': 4,
            'duree_standard_jours': 4,
        },
    ]
    
    for data in capacites_data:
        capacite, created = CapaciteLaboratoire.objects.get_or_create(
            type_essai=data['type_essai'],
            defaults=data
        )
        
        if created:
            print(f"[OK] Capacite creee pour {data['type_essai']}")
        else:
            print(f"[INFO] Capacite existe deja pour {data['type_essai']}")

if __name__ == '__main__':
    print("Initialisation des capacités du laboratoire...")
    init_capacites()
    print("Terminé!")