import sqlite3
import os

# Chemin vers la base de données
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# Connexion à la base de données
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Mettre à jour le dernier workflow rejeté (S-0003/25)
cursor.execute("""
    UPDATE workflow_validations
    SET rejet_chef_projet = 1,
        raison_rejet_chef_projet = 'Rapport rejeté par le chef de projet'
    WHERE code_echantillon = 'S-0003/25'
    AND statut = 'rejete'
    AND etape_actuelle = 'traitement'
    AND updated_at = (
        SELECT MAX(updated_at) 
        FROM workflow_validations 
        WHERE code_echantillon = 'S-0003/25'
    )
""")

affected = cursor.rowcount
conn.commit()

print(f"OK - {affected} workflow(s) mis à jour")

# Vérifier
cursor.execute("""
    SELECT code_echantillon, etape_actuelle, statut, rejet_chef_projet, raison_rejet_chef_projet
    FROM workflow_validations
    WHERE code_echantillon = 'S-0003/25'
    ORDER BY updated_at DESC
    LIMIT 1
""")

wf = cursor.fetchone()
if wf:
    print(f"\nWorkflow S-0003/25:")
    print(f"  Etape: {wf[1]}")
    print(f"  Statut: {wf[2]}")
    print(f"  Rejet chef projet: {wf[3]}")
    print(f"  Raison: {wf[4]}")

conn.close()
