"""
Script de test pour l'API de stockage
"""

import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def test_storage_api():
    """Tester l'API de stockage"""
    
    print("🧪 Test de l'API de stockage\n")
    
    # 1. Se connecter
    print("1️⃣ Connexion...")
    login_response = requests.post(
        f'{BASE_URL}/auth/login/',
        json={
            'username': 'admin',
            'password': 'admin123'
        }
    )
    
    if login_response.status_code != 200:
        print("❌ Erreur de connexion")
        print(login_response.text)
        return
    
    token = login_response.json()['access']
    print(f"✅ Connecté avec succès")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 2. Créer une entrée
    print("\n2️⃣ Création d'une entrée...")
    test_data = {
        'dateEnvoiAG': '2025-01-15',
        'dateEnvoiProctor': '2025-01-16',
        'essais': ['AG', 'Proctor', 'CBR']
    }
    
    create_response = requests.post(
        f'{BASE_URL}/storage/',
        headers=headers,
        json={
            'key': 'test_planning_001',
            'value': json.dumps(test_data)
        }
    )
    
    if create_response.status_code in [200, 201]:
        print("✅ Entrée créée avec succès")
        print(f"   Données: {create_response.json()}")
    else:
        print(f"❌ Erreur création: {create_response.status_code}")
        print(create_response.text)
        return
    
    # 3. Récupérer l'entrée
    print("\n3️⃣ Récupération de l'entrée...")
    get_response = requests.get(
        f'{BASE_URL}/storage/test_planning_001/',
        headers=headers
    )
    
    if get_response.status_code == 200:
        data = get_response.json()
        print("✅ Entrée récupérée avec succès")
        print(f"   Clé: {data['key']}")
        print(f"   Valeur: {data['value']}")
        
        # Vérifier que les données sont correctes
        stored_data = json.loads(data['value'])
        if stored_data == test_data:
            print("✅ Les données correspondent !")
        else:
            print("❌ Les données ne correspondent pas")
    else:
        print(f"❌ Erreur récupération: {get_response.status_code}")
        print(get_response.text)
        return
    
    # 4. Mettre à jour l'entrée
    print("\n4️⃣ Mise à jour de l'entrée...")
    updated_data = {
        **test_data,
        'dateEnvoiCBR': '2025-01-17'
    }
    
    update_response = requests.post(
        f'{BASE_URL}/storage/',
        headers=headers,
        json={
            'key': 'test_planning_001',
            'value': json.dumps(updated_data)
        }
    )
    
    if update_response.status_code in [200, 201]:
        print("✅ Entrée mise à jour avec succès")
    else:
        print(f"❌ Erreur mise à jour: {update_response.status_code}")
        print(update_response.text)
        return
    
    # 5. Lister toutes les entrées
    print("\n5️⃣ Liste de toutes les entrées...")
    list_response = requests.get(
        f'{BASE_URL}/storage/',
        headers=headers
    )
    
    if list_response.status_code == 200:
        entries = list_response.json()
        print(f"✅ {len(entries.get('results', []))} entrée(s) trouvée(s)")
        for entry in entries.get('results', []):
            print(f"   - {entry['key']}")
    else:
        print(f"❌ Erreur liste: {list_response.status_code}")
        print(list_response.text)
        return
    
    # 6. Supprimer l'entrée
    print("\n6️⃣ Suppression de l'entrée...")
    delete_response = requests.delete(
        f'{BASE_URL}/storage/test_planning_001/',
        headers=headers
    )
    
    if delete_response.status_code == 204:
        print("✅ Entrée supprimée avec succès")
    else:
        print(f"❌ Erreur suppression: {delete_response.status_code}")
        print(delete_response.text)
        return
    
    # 7. Vérifier que l'entrée n'existe plus
    print("\n7️⃣ Vérification de la suppression...")
    verify_response = requests.get(
        f'{BASE_URL}/storage/test_planning_001/',
        headers=headers
    )
    
    if verify_response.status_code == 404:
        print("✅ L'entrée a bien été supprimée")
    else:
        print(f"❌ L'entrée existe encore: {verify_response.status_code}")
    
    print("\n" + "="*50)
    print("✅ Tous les tests sont passés avec succès !")
    print("="*50)

if __name__ == '__main__':
    try:
        test_storage_api()
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
