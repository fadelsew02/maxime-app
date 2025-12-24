import os
import sys
import locale

# Set locale to UTF-8
if sys.platform == 'win32':
    try:
        locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_ALL, 'C.UTF-8')
        except:
            pass

os.environ['PGCLIENTENCODING'] = 'UTF8'
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LANG'] = 'en_US.UTF-8'

# Patch open() to use UTF-8 by default with error handling
import builtins
_original_open = builtins.open
def patched_open(*args, **kwargs):
    if 'encoding' not in kwargs and len(args) < 2:
        kwargs['encoding'] = 'utf-8'
        kwargs['errors'] = 'replace'
    return _original_open(*args, **kwargs)
builtins.open = patched_open

import psycopg2

try:
    # Try connection with explicit encoding
    conn = psycopg2.connect(
        dbname='snertp_lab_db',
        user='postgres',
        password='0123456789',
        host='127.0.0.1',
        port='5432',
        options='-c client_encoding=UTF8'
    )
    print("✓ Connexion réussie à la base de données!")
    
    # Test a simple query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"Version PostgreSQL: {version[0][:50]}...")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"✗ Erreur de connexion: {e}")
    print(f"Type d'erreur: {type(e).__name__}")
    import traceback
    traceback.print_exc()
