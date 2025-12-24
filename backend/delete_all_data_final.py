import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

print("Suppression de toutes les données...")

cursor.execute("SELECT COUNT(*) FROM essais")
essais_count = cursor.fetchone()[0]
print(f"Essais: {essais_count}")

cursor.execute("SELECT COUNT(*) FROM echantillons")
echantillons_count = cursor.fetchone()[0]
print(f"Échantillons: {echantillons_count}")

cursor.execute("SELECT COUNT(*) FROM clients")
clients_count = cursor.fetchone()[0]
print(f"Clients: {clients_count}")

cursor.execute("DELETE FROM essais")
print("[OK] Tous les essais supprimes")

cursor.execute("DELETE FROM echantillons")
print("[OK] Tous les echantillons supprimes")

cursor.execute("DELETE FROM clients")
print("[OK] Tous les clients supprimes")

conn.commit()
conn.close()

print("\n[SUCCESS] Toutes les donnees ont ete supprimees avec succes!")
