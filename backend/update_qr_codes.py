"""Script pour mettre à jour les QR codes existants avec des URLs"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon

print("Mise à jour des QR codes existants...\n")
print("-" * 80)

# URL de base (à adapter selon votre configuration)
base_url = "http://localhost:3002"  # ou http://localhost:3000

echantillons = Echantillon.objects.all()
updated_count = 0

for ech in echantillons:
    old_qr = ech.qr_code
    # Générer le nouveau QR code avec URL
    code_for_url = ech.code.replace('/', '-')
    new_qr = f"{base_url}/echantillon/{code_for_url}"
    
    # Mettre à jour si différent
    if old_qr != new_qr:
        ech.qr_code = new_qr
        ech.save()
        updated_count += 1
        print(f"✓ {ech.code}")
        print(f"  Ancien: {old_qr}")
        print(f"  Nouveau: {new_qr}\n")

print("-" * 80)
print(f"\n✅ {updated_count} échantillon(s) mis à jour sur {echantillons.count()} total")
