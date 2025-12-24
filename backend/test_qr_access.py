"""Script pour tester l'accès aux QR codes"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon

print("🔍 Test des QR codes avec URLs\n")
print("=" * 80)

echantillons = Echantillon.objects.all()[:3]

for ech in echantillons:
    print(f"\n📦 Échantillon: {ech.code}")
    print(f"   Nature: {ech.nature}")
    print(f"   Client: {ech.client.nom}")
    print(f"   Photo: {'✅ Oui' if ech.photo else '❌ Non'}")
    print(f"   QR Code URL: {ech.qr_code}")
    print(f"   👉 Testez en ouvrant: {ech.qr_code}")
    print("-" * 80)

print(f"\n✅ Total: {echantillons.count()} échantillon(s) dans la base")
print("\n💡 Pour tester:")
print("   1. Copiez une des URLs ci-dessus")
print("   2. Ouvrez-la dans votre navigateur")
print("   3. Vous devriez voir la page de détails avec la photo (si disponible)")
