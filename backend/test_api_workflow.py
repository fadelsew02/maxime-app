import requests
import json

# URL de l'API
base_url = 'http://127.0.0.1:8000/api'

# Récupérer un workflow par code
code = 'S-0003/25'
url = f'{base_url}/workflows/?code_echantillon={code}'

try:
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data.get('results'):
            workflow = data['results'][0]
            print(f"Workflow pour {code}:")
            print(json.dumps(workflow, indent=2))
            print("\n" + "="*80)
            print(f"rejet_chef_projet: {workflow.get('rejet_chef_projet')}")
            print(f"raison_rejet_chef_projet: {workflow.get('raison_rejet_chef_projet')}")
            print(f"etape_actuelle: {workflow.get('etape_actuelle')}")
            print(f"statut: {workflow.get('statut')}")
        else:
            print(f"Aucun workflow trouvé pour {code}")
    else:
        print(f"Erreur API: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Erreur: {e}")
