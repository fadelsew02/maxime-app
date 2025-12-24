"""
Script pour vider la base de données sauf les utilisateurs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import (
    Client, Echantillon, Essai, Notification, 
    ValidationHistory, Rapport, PlanificationEssai, CapaciteLaboratoire
)

def clear_database():
    print("Suppression des donnees...")
    
    deleted_counts = {}
    
    models = [
        ('PlanificationEssai', PlanificationEssai),
        ('Notification', Notification),
        ('ValidationHistory', ValidationHistory),
        ('Rapport', Rapport),
        ('Essai', Essai),
        ('Echantillon', Echantillon),
        ('Client', Client),
        ('CapaciteLaboratoire', CapaciteLaboratoire),
    ]
    
    for name, model in models:
        try:
            count = model.objects.all().delete()[0]
            deleted_counts[name] = count
        except Exception as e:
            deleted_counts[name] = f"Erreur: {str(e)}"
    
    print("\nSuppression terminee:")
    for model, count in deleted_counts.items():
        print(f"   - {model}: {count}")
    
    print("\nLes utilisateurs ont ete conserves")

if __name__ == '__main__':
    confirm = input("Voulez-vous vraiment supprimer toutes les donnees (sauf users)? (oui/non): ")
    if confirm.lower() == 'oui':
        clear_database()
    else:
        print("Operation annulee")
