"""
Script pour créer un échantillon de test avec des essais en attente
"""

import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon, Essai, Client, User
from django.utils import timezone

def create_test_data():
    """Crée un échantillon de test avec des essais"""
    
    print("\n=== Création de données de test ===\n")
    
    # Trouver ou créer un client
    client = Client.objects.first()
    if not client:
        print("❌ Aucun client trouvé. Veuillez d'abord créer un client.")
        return
    
    print(f"✓ Client: {client.nom}")
    
    # Créer un échantillon
    echantillon = Echantillon.objects.create(
        client=client,
        nature='Sol',
        profondeur_debut=0.0,
        profondeur_fin=2.0,
        sondage='vrac',
        statut='stockage',
        priorite='normale',
        essais_types=['AG', 'Proctor', 'CBR']
    )
    
    print(f"✓ Échantillon créé: {echantillon.code}")
    print(f"  Statut: {echantillon.statut}")
    print(f"  Essais types: {echantillon.essais_types}")
    
    # Créer les essais
    essais_config = [
        {'type': 'AG', 'section': 'route', 'duree': 5},
        {'type': 'Proctor', 'section': 'route', 'duree': 4},
        {'type': 'CBR', 'section': 'route', 'duree': 5},
    ]
    
    print(f"\n→ Création des essais...")
    for config in essais_config:
        essai = Essai.objects.create(
            echantillon=echantillon,
            type=config['type'],
            section=config['section'],
            statut='attente',
            duree_estimee=config['duree'],
            date_reception=timezone.now().date()
        )
        print(f"  ✓ Essai {essai.type} créé (statut: {essai.statut})")
    
    print(f"\n✅ Données de test créées avec succès!")
    print(f"\nPour tester:")
    print(f"1. Connectez-vous avec le compte 'operateur_route' (mot de passe: demo123)")
    print(f"2. Vous devriez voir l'échantillon {echantillon.code}")
    print(f"3. Démarrez un essai et vérifiez que le statut change de 'stockage' à 'essais'")

if __name__ == '__main__':
    create_test_data()
