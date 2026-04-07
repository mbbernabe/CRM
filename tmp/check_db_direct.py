import sys
import sqlite3
from pathlib import Path

# Backend usa o banco em backend/crm.db (relativo a onde o backend roda, que é a pasta backend/)
db_path = Path('backend/crm.db')
print(f"Banco: {db_path.resolve()}")
print(f"Existe: {db_path.exists()}")

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
cursor.execute("SELECT id, name, email, role, password FROM users")
rows = cursor.fetchall()
print(f"Total usuarios: {len(rows)}")
for row in rows:
    print(f"  ID={row[0]} | {row[1]} | {row[2]} | role={row[3]} | hash={row[4][:30]}...")
conn.close()
