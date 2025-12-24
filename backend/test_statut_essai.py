"""
Script de test pour vérifier le changement de statut des échantillons
quand un essai est démarré
"""

import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon, Essai
from django.utils import timezone

def test_demarrage_essai():
    """Teste le demarrage d'un essai et le changement de statut de l'echantillon"""
    
    print("\n=== Test de demarrage d'essai ===\n")
    
    # Trouver un échantillon en stockage avec des essais en attente
    echantillons = Echantillon.objects.filter(statut='stockage')
    
    if not echantillons.exists():
        print("[X] Aucun echantillon en statut 'stockage' trouve")
        return
    
    echantillon = echantillons.first()
    print(f"[OK] Echantillon trouve: {echantillon.code}")
    print(f"  Statut actuel: {echantillon.statut}")
    
    # Trouver un essai en attente pour cet échantillon
    essais = Essai.objects.filter(echantillon=echantillon, statut='attente')
    
    if not essais.exists():
        print(f"[X] Aucun essai en attente pour l'echantillon {echantillon.code}")
        return
    
    essai = essais.first()
    print(f"\n[OK] Essai trouve: {essai.type}")
    print(f"  Statut actuel: {essai.statut}")
    
    # Démarrer l'essai
    print(f"\n[->] Demarrage de l'essai...")
    essai.statut = 'en_cours'
    essai.date_debut = timezone.now().date()
    essai.operateur = 'Test Operateur'
    essai.save()
    
    # Mettre à jour le statut de l'échantillon
    echantillon.refresh_from_db()
    if echantillon.statut == 'stockage':
        echantillon.statut = 'essais'
        echantillon.save()
        print(f"[OK] Statut de l'echantillon change: stockage -> essais")
    
    # Vérifier les changements
    essai.refresh_from_db()
    echantillon.refresh_from_db()
    
    print(f"\n=== Resultats ===")
    print(f"Essai {essai.type}:")
    print(f"  - Statut: {essai.statut}")
    print(f"  - Date debut: {essai.date_debut}")
    print(f"  - Operateur: {essai.operateur}")
    
    print(f"\nEchantillon {echantillon.code}:")
    print(f"  - Statut: {echantillon.statut}")
    
    if echantillon.statut == 'essais':
        print(f"\n[SUCCESS] TEST REUSSI: L'echantillon est maintenant en statut 'essais'")
    else:
        print(f"\n[FAIL] TEST ECHOUE: L'echantillon est toujours en statut '{echantillon.statut}'")

if __name__ == '__main__':
    test_demarrage_essai()
