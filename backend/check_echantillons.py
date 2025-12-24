"""Script pour vérifier le comptage des échantillons par client"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Client, Echantillon

print("Vérification du comptage des échantillons par client:\n")
print("-" * 80)

clients = Client.objects.all().order_by('-created_at')[:5]

for client in clients:
    echantillons = client.echantillons.all()
    count = echantillons.count()
    print(f"\nClient: {client.code} - {client.nom}")
    print(f"  Nombre d'échantillons: {count}")
    if count > 0:
        print(f"  Échantillons:")
        for ech in echantillons:
            print(f"    - {ech.code} ({ech.nature})")
    else:
        print(f"  Aucun échantillon")

print("\n" + "-" * 80)
print("\nVérification des échantillons sans client:")
orphans = Echantillon.objects.filter(client__isnull=True)
print(f"Nombre d'échantillons orphelins: {orphans.count()}")

print("\n" + "-" * 80)
print("\nTous les échantillons:")
all_echantillons = Echantillon.objects.all()
print(f"Total échantillons: {all_echantillons.count()}")
for ech in all_echantillons:
    print(f"  - {ech.code} -> Client: {ech.client.code if ech.client else 'AUCUN'}")
