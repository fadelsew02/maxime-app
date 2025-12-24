import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Essai, Echantillon

print("\n=== DIAGNOSTIC ESSAIS PAR ÉCHANTILLON ===\n")

# Lister tous les essais Oedometre
essais_oedo = Essai.objects.filter(type='Oedometre')
print(f"Total essais Oedometre: {essais_oedo.count()}\n")

for essai in essais_oedo:
    print(f"Essai ID: {essai.id}")
    print(f"  Échantillon: {essai.echantillon.code}")
    print(f"  Statut: {essai.statut}")
    print(f"  Opérateur: {essai.operateur}")
    print(f"  Date début: {essai.date_debut}")
    print(f"  Résultats: {essai.resultats}")
    print()

# Vérifier les échantillons
echantillons = Echantillon.objects.filter(code__in=['S-0002/25', 'S-0003/25', 'S-0008/25'])
print("\n=== ÉCHANTILLONS CONCERNÉS ===\n")
for ech in echantillons:
    print(f"Échantillon: {ech.code} (ID: {ech.id})")
    essais = Essai.objects.filter(echantillon=ech, type='Oedometre')
    print(f"  Nombre d'essais Oedometre: {essais.count()}")
    for essai in essais:
        print(f"    - Essai ID: {essai.id}, Statut: {essai.statut}, Opérateur: {essai.operateur}")
    print()
