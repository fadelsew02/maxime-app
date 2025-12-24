"""
Script pour vérifier les données créées
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Client, Echantillon, Essai

User = get_user_model()

def check_data():
    """Vérifier les données dans la base"""
    
    print("=" * 60)
    print("VERIFICATION DES DONNEES SNERTP")
    print("=" * 60)
    
    # Utilisateurs
    users = User.objects.all()
    print(f"\n1. UTILISATEURS ({users.count()})")
    print("-" * 40)
    for user in users:
        print(f"  {user.username:20s} - {user.get_role_display()}")
    
    # Clients
    clients = Client.objects.all()
    print(f"\n2. CLIENTS ({clients.count()})")
    print("-" * 40)
    for client in clients:
        print(f"  {client.code:10s} - {client.nom}")
    
    # Échantillons
    echantillons = Echantillon.objects.all()
    print(f"\n3. ECHANTILLONS ({echantillons.count()})")
    print("-" * 40)
    for ech in echantillons:
        essais_count = ech.essais.count()
        print(f"  {ech.code:15s} - {ech.nature:20s} - {ech.statut:15s} - {essais_count} essais")
    
    # Essais par statut
    essais = Essai.objects.all()
    print(f"\n4. ESSAIS PAR STATUT ({essais.count()} total)")
    print("-" * 40)
    for statut, label in Essai.STATUT_CHOICES:
        count = essais.filter(statut=statut).count()
        if count > 0:
            print(f"  {label:15s}: {count}")
    
    # Essais par type
    print(f"\n5. ESSAIS PAR TYPE")
    print("-" * 40)
    for type_essai, label in Essai.TYPE_CHOICES:
        count = essais.filter(type=type_essai).count()
        if count > 0:
            print(f"  {label:25s}: {count}")
    
    # Données pour le tableau réceptionniste
    print(f"\n6. DONNEES POUR TABLEAU RECEPTIONNISTE")
    print("-" * 40)
    print("Client".ljust(20) + "Code Echantillon".ljust(20) + "Date Reception".ljust(15) + "Statut".ljust(15))
    print("-" * 70)
    
    for ech in echantillons.order_by('-date_reception')[:10]:
        client_nom = ech.client.nom[:18] if len(ech.client.nom) > 18 else ech.client.nom
        print(f"{client_nom.ljust(20)}{ech.code.ljust(20)}{str(ech.date_reception).ljust(15)}{ech.statut.ljust(15)}")
    
    print("\n" + "=" * 60)
    print("VERIFICATION TERMINEE")
    print("=" * 60)

if __name__ == '__main__':
    check_data()