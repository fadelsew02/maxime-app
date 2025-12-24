"""
Script pour vérifier les dates des essais
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon, Essai

def test_essais_dates():
    """Affiche les essais avec leurs dates"""
    echantillons = Echantillon.objects.all()[:5]
    
    for echantillon in echantillons:
        print(f"\n{'='*60}")
        print(f"Échantillon: {echantillon.code}")
        print(f"Date réception: {echantillon.date_reception}")
        print(f"Essais:")
        
        essais = echantillon.essais.all()
        if essais.exists():
            for essai in essais:
                print(f"  - {essai.type}: date_reception={essai.date_reception}, statut={essai.statut}")
        else:
            print("  Aucun essai")

if __name__ == '__main__':
    print("Vérification des dates des essais...\n")
    test_essais_dates()
