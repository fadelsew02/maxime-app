import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import WorkflowValidation

workflows = WorkflowValidation.objects.filter(etape_actuelle='chef_projet')
for wf in workflows:
    print(f"Code: {wf.code_echantillon}, Client: {wf.client_name}, File: {wf.file_name}")
