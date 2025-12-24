import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Client, Echantillon, WorkflowValidation

print("=== CLIENTS ===")
clients = Client.objects.all()
for client in clients:
    print(f"ID: {client.id}, Code: {client.code}, Nom: {client.nom}")

print("\n=== ECHANTILLONS ===")
echantillons = Echantillon.objects.all()
for ech in echantillons:
    print(f"Code: {ech.code}, Client ID: {ech.client.id if ech.client else 'None'}, Client Code: {ech.client.code if ech.client else 'None'}, Client Nom: {ech.client_nom}")

print("\n=== WORKFLOWS ===")
workflows = WorkflowValidation.objects.filter(etape_actuelle='chef_projet')
for wf in workflows:
    print(f"Echantillon: {wf.code_echantillon}, Client: {wf.client_name}, Etape: {wf.etape_actuelle}")
