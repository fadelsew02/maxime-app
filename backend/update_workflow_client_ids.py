#!/usr/bin/env python
"""
Script pour mettre à jour les client_id dans les WorkflowValidation existants
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import WorkflowValidation, Echantillon

def update_workflow_client_ids():
    """Mettre à jour tous les workflows avec le client_id"""
    workflows = WorkflowValidation.objects.filter(client_id__isnull=True)
    updated_count = 0
    
    print(f"Mise à jour de {workflows.count()} workflows...")
    
    for workflow in workflows:
        try:
            # Récupérer l'échantillon
            echantillon = Echantillon.objects.filter(code=workflow.code_echantillon).first()
            
            if echantillon and echantillon.client:
                workflow.client_id = echantillon.client.id
                workflow.save(update_fields=['client_id'])
                updated_count += 1
                print(f"✓ Workflow {workflow.code_echantillon}: client_id = {echantillon.client.id}")
            else:
                print(f"✗ Workflow {workflow.code_echantillon}: échantillon ou client introuvable")
        except Exception as e:
            print(f"✗ Erreur pour {workflow.code_echantillon}: {e}")
    
    print(f"\n✅ {updated_count}/{workflows.count()} workflows mis à jour")

if __name__ == '__main__':
    update_workflow_client_ids()
