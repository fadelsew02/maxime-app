import sqlite3
import os

# Chemin vers la base de données
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# Connexion à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Mettre à jour les workflows avec statut='rejete' et etape_actuelle='traitement'
# pour marquer rejet_chef_projet = 1
cursor.execute("""
    UPDATE workflow_validations
    SET rejet_chef_projet = 1,
        raison_rejet_chef_projet = 'Rejet test - migration'
    WHERE statut = 'rejete' 
    AND etape_actuelle = 'traitement'
    AND rejet_chef_projet = 0
""")

affected_rows = cursor.rowcount
conn.commit()

print(f"OK - {affected_rows} workflow(s) mis à jour")

# Afficher les workflows mis à jour
cursor.execute("""
    SELECT code_echantillon, etape_actuelle, statut, rejet_chef_projet, raison_rejet_chef_projet
    FROM workflow_validations
    WHERE rejet_chef_projet = 1
""")

workflows = cursor.fetchall()
print(f"\nWorkflows rejetés:")
for wf in workflows:
    print(f"  - {wf[0]}: etape={wf[1]}, statut={wf[2]}, rejet={wf[3]}")

conn.close()
