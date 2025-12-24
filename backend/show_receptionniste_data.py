"""
Script pour afficher les données du tableau réceptionniste
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Echantillon

def show_receptionniste_data():
    """Afficher les données pour le tableau réceptionniste"""
    
    print("=" * 120)
    print("TABLEAU RECEPTIONNISTE - DONNEES COMPLETES")
    print("=" * 120)
    
    # En-têtes du tableau
    headers = [
        "Client",
        "Code Echantillon", 
        "Date Reception",
        "Date Envoi Essais",
        "Date Envoi Traitement",
        "Date Envoi Chef Projet",
        "Statut"
    ]
    
    # Largeurs des colonnes
    widths = [20, 18, 15, 17, 20, 20, 15]
    
    # Afficher les en-têtes
    header_line = ""
    for i, header in enumerate(headers):
        header_line += header.ljust(widths[i])
    print(header_line)
    print("-" * 125)
    
    # Récupérer tous les échantillons
    echantillons = Echantillon.objects.select_related('client').order_by('-date_reception')
    
    for ech in echantillons:
        # Préparer les données
        client_nom = (ech.client.nom[:18] if len(ech.client.nom) > 18 else ech.client.nom) if ech.client else "N/A"
        code = ech.code
        date_reception = str(ech.date_reception) if ech.date_reception else "-"
        date_envoi_essais = str(ech.date_envoi_essais) if ech.date_envoi_essais else "-"
        date_envoi_traitement = str(ech.date_envoi_traitement) if ech.date_envoi_traitement else "-"
        date_envoi_chef_projet = str(ech.date_envoi_chef_projet) if ech.date_envoi_chef_projet else "-"
        statut = ech.statut
        
        # Construire la ligne
        line = ""
        values = [client_nom, code, date_reception, date_envoi_essais, date_envoi_traitement, date_envoi_chef_projet, statut]
        
        for i, value in enumerate(values):
            line += str(value).ljust(widths[i])
        
        print(line)
    
    print("-" * 125)
    print(f"Total: {echantillons.count()} échantillons")
    
    # Statistiques par statut
    print(f"\nSTATISTIQUES PAR STATUT:")
    print("-" * 40)
    
    for statut, label in Echantillon.STATUT_CHOICES:
        count = echantillons.filter(statut=statut).count()
        if count > 0:
            print(f"  {label.ljust(20)}: {count}")
    
    print("\n" + "=" * 120)

if __name__ == '__main__':
    show_receptionniste_data()