"""
Script pour tester l'API et afficher les données du tableau réceptionniste
"""

import requests
import json
from datetime import datetime

def test_api():
    """Tester l'API et récupérer les données"""
    
    base_url = "http://127.0.0.1:8000"
    
    print("=" * 60)
    print("TEST DE L'API SNERTP")
    print("=" * 60)
    
    # 1. Test de connexion
    print("\n1. Test de connexion...")
    try:
        login_data = {
            "username": "receptionniste",
            "password": "password123"
        }
        
        response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
        
        if response.status_code == 200:
            tokens = response.json()
            access_token = tokens['access']
            print("✓ Connexion réussie")
            
            # Headers pour les requêtes authentifiées
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # 2. Test récupération des échantillons
            print("\n2. Récupération des échantillons...")
            response = requests.get(f"{base_url}/api/echantillons/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                echantillons = data.get('results', [])
                print(f"✓ {len(echantillons)} échantillons récupérés")
                
                # 3. Affichage du tableau réceptionniste
                print("\n3. TABLEAU RECEPTIONNISTE")
                print("-" * 60)
                print("Client".ljust(20) + "Code".ljust(15) + "Date Réception".ljust(15) + "Statut".ljust(15))
                print("-" * 65)
                
                for ech in echantillons[:10]:  # Afficher les 10 premiers
                    client_nom = ech.get('client_nom', 'N/A')[:18]
                    code = ech.get('code', 'N/A')
                    date_reception = ech.get('date_reception', 'N/A')
                    statut = ech.get('statut', 'N/A')
                    
                    # Formater la date
                    if date_reception != 'N/A':
                        try:
                            date_obj = datetime.strptime(date_reception, '%Y-%m-%d')
                            date_reception = date_obj.strftime('%d/%m/%Y')
                        except:
                            pass
                    
                    print(f"{client_nom.ljust(20)}{code.ljust(15)}{date_reception.ljust(15)}{statut.ljust(15)}")
                
                # 4. Test récupération groupée par client
                print("\n4. Test données groupées par client...")
                response = requests.get(f"{base_url}/api/echantillons/grouped_by_client/", headers=headers)
                
                if response.status_code == 200:
                    clients_data = response.json()
                    print(f"✓ {len(clients_data)} clients avec échantillons")
                    
                    print("\nDONNEES GROUPEES PAR CLIENT:")
                    print("-" * 60)
                    for client in clients_data[:5]:  # Afficher les 5 premiers
                        print(f"Client: {client.get('client_nom', 'N/A')}")
                        print(f"  Nombre d'échantillons: {client.get('nombre_echantillons', 0)}")
                        print(f"  Échantillons: {len(client.get('echantillons', []))}")
                        print()
                
                else:
                    print(f"✗ Erreur récupération groupée: {response.status_code}")
                
            else:
                print(f"✗ Erreur récupération échantillons: {response.status_code}")
                print(response.text)
        
        else:
            print(f"✗ Erreur de connexion: {response.status_code}")
            print(response.text)
    
    except requests.exceptions.ConnectionError:
        print("✗ Impossible de se connecter au serveur")
        print("Assurez-vous que le backend Django est démarré sur le port 8000")
    
    except Exception as e:
        print(f"✗ Erreur: {e}")
    
    print("\n" + "=" * 60)
    print("TEST TERMINE")
    print("=" * 60)

if __name__ == '__main__':
    test_api()