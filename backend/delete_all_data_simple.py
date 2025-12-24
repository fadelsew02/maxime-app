import sqlite3

db_path = 'db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Suppression de toutes les données...")

cursor.execute("SELECT COUNT(*) FROM core_essai")
essais_count = cursor.fetchone()[0]
print(f"Essais: {essais_count}")

cursor.execute("SELECT COUNT(*) FROM core_echantillon")
echantillons_count = cursor.fetchone()[0]
print(f"Échantillons: {echantillons_count}")

cursor.execute("SELECT COUNT(*) FROM core_client")
clients_count = cursor.fetchone()[0]
print(f"Clients: {clients_count}")

cursor.execute("DELETE FROM core_essai")
print("✓ Tous les essais supprimés")

cursor.execute("DELETE FROM core_echantillon")
print("✓ Tous les échantillons supprimés")

cursor.execute("DELETE FROM core_client")
print("✓ Tous les clients supprimés")

conn.commit()
conn.close()

print("\nToutes les données ont été supprimées avec succès!")
