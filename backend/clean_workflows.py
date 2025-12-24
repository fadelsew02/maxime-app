import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Supprimer tous les workflows sauf le plus récent par code_echantillon
cursor.execute("""
    DELETE FROM workflow_validations
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, code_echantillon, MAX(updated_at) as max_date
            FROM workflow_validations
            GROUP BY code_echantillon
        )
    )
""")

deleted = cursor.rowcount
conn.commit()

print(f"OK - {deleted} workflow(s) en double supprimés")

# Afficher les workflows restants
cursor.execute("""
    SELECT code_echantillon, etape_actuelle, statut, rejet_chef_projet, updated_at
    FROM workflow_validations
    ORDER BY updated_at DESC
""")

print("\nWorkflows restants:")
for wf in cursor.fetchall():
    print(f"  {wf[0]} | etape={wf[1]} | statut={wf[2]} | rejet={wf[3]} | date={wf[4]}")

conn.close()
