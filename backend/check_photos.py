"""Script pour vérifier les photos des échantillons"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon
from django.conf import settings

print("🖼️  Vérification des photos des échantillons\n")
print("=" * 80)

echantillons = Echantillon.objects.all()
total = echantillons.count()
with_photo = 0
without_photo = 0

print(f"\n📁 Dossier media: {settings.MEDIA_ROOT}")
print(f"🌐 URL media: {settings.MEDIA_URL}\n")
print("-" * 80)

for ech in echantillons:
    if ech.photo:
        with_photo += 1
        photo_path = os.path.join(settings.MEDIA_ROOT, str(ech.photo))
        exists = os.path.exists(photo_path)
        status = "✅ Existe" if exists else "❌ Manquant"
        
        print(f"\n📦 {ech.code}")
        print(f"   Photo DB: {ech.photo}")
        print(f"   Chemin: {photo_path}")
        print(f"   Statut: {status}")
        print(f"   URL: http://127.0.0.1:8000{settings.MEDIA_URL}{ech.photo}")
    else:
        without_photo += 1
        print(f"\n📦 {ech.code}")
        print(f"   Photo: ❌ Aucune photo")

print("\n" + "=" * 80)
print(f"\n📊 Résumé:")
print(f"   Total échantillons: {total}")
print(f"   Avec photo: {with_photo}")
print(f"   Sans photo: {without_photo}")

if with_photo > 0:
    print(f"\n💡 Pour tester l'accès aux photos:")
    first_with_photo = echantillons.filter(photo__isnull=False).first()
    if first_with_photo:
        print(f"   Ouvrez: http://127.0.0.1:8000{settings.MEDIA_URL}{first_with_photo.photo}")
