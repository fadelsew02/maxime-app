import sqlite3
import os
import sys

# Forcer l'encodage UTF-8 pour la sortie
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# Chemin vers la base de données
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# Connexion à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Liste des colonnes à ajouter
columns_to_add = [
    ('validation_chef_projet', 'BOOLEAN DEFAULT 0'),
    ('rejet_chef_projet', 'BOOLEAN DEFAULT 0'),
    ('raison_rejet_chef_projet', 'TEXT DEFAULT ""'),
    ('commentaire_chef_projet', 'TEXT DEFAULT ""'),
    ('validation_chef_service', 'BOOLEAN DEFAULT 0'),
    ('rejet_chef_service', 'BOOLEAN DEFAULT 0'),
    ('raison_rejet_chef_service', 'TEXT DEFAULT ""'),
    ('commentaire_chef_service', 'TEXT DEFAULT ""'),
    ('validation_directeur_technique', 'BOOLEAN DEFAULT 0'),
    ('rejet_directeur_technique', 'BOOLEAN DEFAULT 0'),
    ('raison_rejet_directeur_technique', 'TEXT DEFAULT ""'),
    ('commentaire_directeur_technique', 'TEXT DEFAULT ""'),
    ('rejet_directeur_snertp', 'BOOLEAN DEFAULT 0'),
    ('raison_rejet_directeur_snertp', 'TEXT DEFAULT ""'),
]

# Vérifier les colonnes existantes
cursor.execute("PRAGMA table_info(workflow_validations)")
existing_columns = [row[1] for row in cursor.fetchall()]

# Ajouter les colonnes manquantes
for column_name, column_type in columns_to_add:
    if column_name not in existing_columns:
        try:
            sql = f"ALTER TABLE workflow_validations ADD COLUMN {column_name} {column_type}"
            cursor.execute(sql)
            print(f"OK - Colonne '{column_name}' ajoutee avec succes")
        except sqlite3.OperationalError as e:
            print(f"ERREUR - Erreur lors de l'ajout de '{column_name}': {e}")
    else:
        print(f"INFO - Colonne '{column_name}' existe deja")

# Valider les changements
conn.commit()
conn.close()

print("\nOK - Script termine avec succes!")
