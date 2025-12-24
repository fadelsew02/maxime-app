import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import WorkflowValidation, RapportMarketing, Rapport, Essai, Echantillon, Client

# Supprimer dans l'ordre pour éviter les erreurs de contraintes
print("Suppression des donnees...")

workflow_count = WorkflowValidation.objects.count()
WorkflowValidation.objects.all().delete()
print(f"{workflow_count} WorkflowValidation supprimes")

rapport_marketing_count = RapportMarketing.objects.count()
RapportMarketing.objects.all().delete()
print(f"{rapport_marketing_count} RapportMarketing supprimes")

rapport_count = Rapport.objects.count()
Rapport.objects.all().delete()
print(f"{rapport_count} Rapport supprimes")

essai_count = Essai.objects.count()
Essai.objects.all().delete()
print(f"{essai_count} Essai supprimes")

echantillon_count = Echantillon.objects.count()
Echantillon.objects.all().delete()
print(f"{echantillon_count} Echantillon supprimes")

client_count = Client.objects.count()
Client.objects.all().delete()
print(f"{client_count} Client supprimes")

print("\nToutes les donnees ont ete supprimees avec succes!")
