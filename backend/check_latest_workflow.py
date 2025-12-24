import sqlite3
import os

# Chemin vers la base de données
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# Connexion à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Récupérer le dernier workflow modifié
cursor.execute("""
    SELECT id, code_echantillon, etape_actuelle, statut, 
           rejet_chef_projet, raison_rejet_chef_projet,
           updated_at
    FROM workflow_validations
    ORDER BY updated_at DESC
    LIMIT 5
""")

workflows = cursor.fetchall()

print("5 derniers workflows modifiés:")
print("=" * 100)
for wf in workflows:
    print(f"\nCode: {wf[1]}")
    print(f"Etape: {wf[2]}")
    print(f"Statut: {wf[3]}")
    print(f"Rejet chef projet: {wf[4]}")
    print(f"Raison rejet: {wf[5]}")
    print(f"Dernière modification: {wf[6]}")
    print("-" * 100)

conn.close()
