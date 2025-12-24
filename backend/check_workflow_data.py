import sqlite3
import os

# Chemin vers la base de données
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# Connexion à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Vérifier les colonnes de la table
cursor.execute("PRAGMA table_info(workflow_validations)")
columns = cursor.fetchall()

print("Colonnes de la table workflow_validations:")
print("-" * 80)
for col in columns:
    print(f"{col[1]:40} {col[2]:15}")

print("\n" + "=" * 80)
print("Données des workflows:")
print("=" * 80)

# Récupérer tous les workflows
cursor.execute("""
    SELECT id, code_echantillon, etape_actuelle, statut, 
           rejet_chef_projet, raison_rejet_chef_projet
    FROM workflow_validations
    ORDER BY created_at DESC
    LIMIT 10
""")

workflows = cursor.fetchall()

if workflows:
    for wf in workflows:
        print(f"\nID: {wf[0]}")
        print(f"Code: {wf[1]}")
        print(f"Etape: {wf[2]}")
        print(f"Statut: {wf[3]}")
        print(f"Rejet chef projet: {wf[4]}")
        print(f"Raison rejet: {wf[5]}")
        print("-" * 80)
else:
    print("Aucun workflow trouvé")

conn.close()
