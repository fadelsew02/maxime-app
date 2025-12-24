"""
Script pour définir la date_reception des essais existants
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon, Essai

def set_essais_date_reception():
    """Définit la date_reception des essais à la date de réception de l'échantillon"""
    essais = Essai.objects.filter(date_reception__isnull=True)
    count = 0
    
    for essai in essais:
        # Définir la date_reception de l'essai à la date de réception de l'échantillon
        essai.date_reception = essai.echantillon.date_reception
        essai.save()
        count += 1
        print(f"✓ {essai.echantillon.code} - {essai.type}: date_reception = {essai.date_reception}")
    
    print(f"\n✅ {count} essai(s) mis à jour avec succès!")

if __name__ == '__main__':
    print("Mise à jour des dates de réception des essais...\n")
    set_essais_date_reception()
