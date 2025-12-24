"""
Script pour mettre à jour les échantillons existants avec date_envoi_essais
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon

def update_date_envoi_essais():
    """Met à jour tous les échantillons sans date_envoi_essais"""
    echantillons = Echantillon.objects.filter(date_envoi_essais__isnull=True)
    count = 0
    
    for echantillon in echantillons:
        echantillon.date_envoi_essais = echantillon.date_reception
        echantillon.save()
        count += 1
        print(f"✓ {echantillon.code}: date_envoi_essais = {echantillon.date_envoi_essais}")
    
    print(f"\n✅ {count} échantillon(s) mis à jour avec succès!")

if __name__ == '__main__':
    print("Mise à jour des dates d'envoi aux essais...\n")
    update_date_envoi_essais()
