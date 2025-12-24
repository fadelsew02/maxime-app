import os
os.environ['PGCLIENTENCODING'] = 'UTF8'

import psycopg2

# Try with a simple DSN string
dsn = "postgresql://postgres:0123456789@127.0.0.1:5432/snertp_lab_db"

try:
    conn = psycopg2.connect(dsn)
    print("✓ Connexion réussie!")
    conn.close()
except Exception as e:
    print(f"✗ Erreur: {e}")
    
    # Try to find the problematic file
    print("\nRecherche du fichier problématique...")
    import psycopg2.extensions
    print(f"psycopg2 version: {psycopg2.__version__}")
    print(f"libpq version: {psycopg2.extensions.libpq_version()}")
