import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Client, Echantillon, Essai
from django.db import connection

print("\n=== SUPPRESSION DES DONNEES ===\n")

# Desactiver les contraintes de cles etrangeres temporairement
with connection.cursor() as cursor:
    cursor.execute("PRAGMA foreign_keys = OFF")
    
    # Supprimer essais
    cursor.execute("DELETE FROM essais")
    essais_count = cursor.rowcount
    print(f"OK {essais_count} essais supprimes")
    
    # Supprimer echantillons
    cursor.execute("DELETE FROM echantillons")
    echantillons_count = cursor.rowcount
    print(f"OK {echantillons_count} echantillons supprimes")
    
    # Supprimer clients
    cursor.execute("DELETE FROM clients")
    clients_count = cursor.rowcount
    print(f"OK {clients_count} clients supprimes")
    
    cursor.execute("PRAGMA foreign_keys = ON")

print("\nSUCCES: Toutes les donnees ont ete supprimees!\n")
