import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    print("Suppression des donnees...")
    
    cursor.execute("DELETE FROM workflow_validations")
    print(f"{cursor.rowcount} workflow_validations supprimes")
    
    cursor.execute("DELETE FROM rapports_marketing")
    print(f"{cursor.rowcount} rapports_marketing supprimes")
    
    cursor.execute("DELETE FROM rapports")
    print(f"{cursor.rowcount} rapports supprimes")
    
    cursor.execute("DELETE FROM essais")
    print(f"{cursor.rowcount} essais supprimes")
    
    cursor.execute("DELETE FROM echantillons")
    print(f"{cursor.rowcount} echantillons supprimes")
    
    cursor.execute("DELETE FROM clients")
    print(f"{cursor.rowcount} clients supprimes")

print("\nToutes les donnees ont ete supprimees avec succes!")
