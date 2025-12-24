import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maxime_backend.settings')
django.setup()

from core.models import Client, Echantillon, Essai, WorkflowValidation, Rapport, RapportMarketing

print("Suppression de toutes les données...")

# Supprimer dans l'ordre pour éviter les erreurs de contraintes
WorkflowValidation.objects.all().delete()
print("✓ Workflows supprimés")

RapportMarketing.objects.all().delete()
print("✓ Rapports marketing supprimés")

Rapport.objects.all().delete()
print("✓ Rapports supprimés")

Essai.objects.all().delete()
print("✓ Essais supprimés")

Echantillon.objects.all().delete()
print("✓ Échantillons supprimés")

Client.objects.all().delete()
print("✓ Clients supprimés")

print("\n✅ TOUTES LES DONNÉES ONT ÉTÉ SUPPRIMÉES !")
print("Vous pouvez maintenant recommencer avec des données propres.")
