import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import WorkflowValidation, Echantillon

print("Correction des workflows...")

workflows = WorkflowValidation.objects.all()
for wf in workflows:
    try:
        ech = Echantillon.objects.get(code=wf.code_echantillon)
        if ech.client:
            # Mettre a jour avec le code client au lieu du nom
            old_name = wf.client_name
            new_name = f"{ech.client.nom} ({ech.client.code})"
            wf.client_name = new_name
            wf.save()
            print(f"Workflow {wf.code_echantillon}: '{old_name}' -> '{new_name}'")
    except Echantillon.DoesNotExist:
        print(f"Echantillon {wf.code_echantillon} non trouve")

print("\nTermine!")
