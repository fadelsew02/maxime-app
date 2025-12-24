import os
import django
import json
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Echantillon, Essai, WorkflowValidation

def migrate_essais_from_json(json_file_path):
    """Migrer les essais depuis un fichier JSON exporté du localStorage"""
    
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    migrated = 0
    errors = 0
    
    for key, value in data.items():
        # Ignorer les clés système
        if key in ['access_token', 'refresh_token', 'user', 'rapport_sent_', 'sent_to_', 'treatment_', 'aviso_', 'rejected_']:
            continue
            
        # Traiter les essais (format: CODE_ESSAI)
        if '_' in key and not any(x in key for x in ['sent_to', 'treatment', 'rapport', 'aviso', 'rejected']):
            try:
                parts = key.split('_')
                if len(parts) >= 2:
                    code_echantillon = '_'.join(parts[:-1])
                    type_essai = parts[-1]
                    
                    # Vérifier si l'échantillon existe
                    try:
                        echantillon = Echantillon.objects.get(code=code_echantillon)
                    except Echantillon.DoesNotExist:
                        print(f"⚠️  Échantillon {code_echantillon} introuvable, création...")
                        echantillon = Echantillon.objects.create(
                            code=code_echantillon,
                            client_nom=f"Client {code_echantillon}",
                            statut='en_cours'
                        )
                    
                    essai_data = json.loads(value) if isinstance(value, str) else value
                    
                    # Créer ou mettre à jour l'essai
                    essai, created = Essai.objects.update_or_create(
                        echantillon=echantillon,
                        type_essai=type_essai,
                        defaults={
                            'resultats': essai_data.get('resultats', {}),
                            'statut': 'termine' if essai_data.get('validationStatus') == 'accepted' else 'en_cours',
                            'date_debut': essai_data.get('dateDebut'),
                            'date_fin': essai_data.get('dateFin'),
                            'operateur': essai_data.get('operateur', 'Inconnu'),
                            'commentaires': essai_data.get('commentaires', ''),
                        }
                    )
                    
                    if created:
                        migrated += 1
                        print(f"✅ Essai migré: {code_echantillon} - {type_essai}")
                    else:
                        print(f"🔄 Essai mis à jour: {code_echantillon} - {type_essai}")
                        
            except Exception as e:
                errors += 1
                print(f"❌ Erreur migration {key}: {str(e)}")
    
    print(f"\n📊 Résumé: {migrated} essais migrés, {errors} erreurs")

def migrate_workflows_from_json(json_file_path):
    """Migrer les workflows depuis un fichier JSON exporté du localStorage"""
    
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    migrated = 0
    errors = 0
    
    # Grouper par code échantillon
    workflows = {}
    
    for key, value in data.items():
        if 'sent_to_chef_' in key and 'sent_to_chef_service' not in key:
            code = key.replace('sent_to_chef_', '')
            if code not in workflows:
                workflows[code] = {}
            workflows[code]['chef_projet'] = json.loads(value) if isinstance(value, str) else value
            
        elif 'sent_to_chef_service_' in key:
            code = key.replace('sent_to_chef_service_', '')
            if code not in workflows:
                workflows[code] = {}
            workflows[code]['chef_service'] = json.loads(value) if isinstance(value, str) else value
            
        elif 'sent_to_directeur_technique_' in key:
            code = key.replace('sent_to_directeur_technique_', '')
            if code not in workflows:
                workflows[code] = {}
            workflows[code]['directeur_technique'] = json.loads(value) if isinstance(value, str) else value
    
    # Créer les workflows
    for code, workflow_data in workflows.items():
        try:
            echantillon = Echantillon.objects.get(code=code)
            
            # Déterminer l'étape actuelle
            etape = 'chef_projet'
            statut = 'en_attente'
            
            if 'directeur_technique' in workflow_data:
                if workflow_data['directeur_technique'].get('validatedByDirecteurTechnique'):
                    etape = 'directeur_snertp'
                else:
                    etape = 'directeur_technique'
            elif 'chef_service' in workflow_data:
                if workflow_data['chef_service'].get('acceptedByChefService'):
                    etape = 'directeur_technique'
                else:
                    etape = 'chef_service'
            
            # Créer le workflow
            workflow, created = WorkflowValidation.objects.update_or_create(
                echantillon=echantillon,
                code_echantillon=code,
                defaults={
                    'etape_actuelle': etape,
                    'statut': statut,
                    'file_name': workflow_data.get('chef_projet', {}).get('file', ''),
                    'file_data': workflow_data.get('chef_projet', {}).get('fileData', ''),
                    
                    # Chef Projet
                    'validation_chef_projet': workflow_data.get('chef_projet', {}).get('accepted', False),
                    'commentaire_chef_projet': workflow_data.get('chef_projet', {}).get('comment', ''),
                    'rejet_chef_projet': workflow_data.get('chef_projet', {}).get('rejected', False),
                    
                    # Chef Service
                    'validation_chef_service': workflow_data.get('chef_service', {}).get('acceptedByChefService', False),
                    'commentaire_chef_service': workflow_data.get('chef_service', {}).get('commentChefService', ''),
                    'rejet_chef_service': workflow_data.get('chef_service', {}).get('rejectedByChefService', False),
                    
                    # Directeur Technique
                    'validation_directeur_technique': workflow_data.get('directeur_technique', {}).get('validatedByDirecteurTechnique', False),
                    'commentaire_directeur_technique': workflow_data.get('directeur_technique', {}).get('commentDirecteurTechnique', ''),
                }
            )
            
            if created:
                migrated += 1
                print(f"✅ Workflow migré: {code} - Étape: {etape}")
            else:
                print(f"🔄 Workflow mis à jour: {code}")
                
        except Echantillon.DoesNotExist:
            errors += 1
            print(f"❌ Échantillon {code} introuvable")
        except Exception as e:
            errors += 1
            print(f"❌ Erreur workflow {code}: {str(e)}")
    
    print(f"\n📊 Résumé: {migrated} workflows migrés, {errors} erreurs")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python migrate_localstorage.py <fichier_json>")
        print("\nPour exporter localStorage depuis le navigateur:")
        print("1. Ouvrir la console (F12)")
        print("2. Exécuter: copy(JSON.stringify(localStorage))")
        print("3. Coller dans un fichier localstorage.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    if not os.path.exists(json_file):
        print(f"❌ Fichier {json_file} introuvable")
        sys.exit(1)
    
    print("🚀 Début de la migration...\n")
    print("=" * 50)
    print("MIGRATION DES ESSAIS")
    print("=" * 50)
    migrate_essais_from_json(json_file)
    
    print("\n" + "=" * 50)
    print("MIGRATION DES WORKFLOWS")
    print("=" * 50)
    migrate_workflows_from_json(json_file)
    
    print("\n✅ Migration terminée!")
