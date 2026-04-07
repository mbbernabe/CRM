import sqlite3
from pathlib import Path

db_path = Path('backend/crm.db')
print(f"Atualizando banco: {db_path.resolve()}")

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Promover mbbernabe@gmail.com para superadmin (ID=2)
cursor.execute("UPDATE users SET role='superadmin' WHERE email='mbbernabe@gmail.com'")
affected = cursor.rowcount
conn.commit()

print(f"Linhas atualizadas: {affected}")

# Verificar resultado
cursor.execute("SELECT id, name, email, role FROM users ORDER BY id")
rows = cursor.fetchall()
print("\nEstado atual:")
for row in rows:
    print(f"  ID={row[0]} | {row[1]} | {row[2]} | role={row[3]}")

conn.close()
print("\nConcluido!")
