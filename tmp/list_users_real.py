import sys
import sqlite3
import os
from pathlib import Path

# O banco real do backend
db_path = Path('backend/crm.db')
print(f"Banco: {db_path.resolve()}")

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
cursor.execute("SELECT id, name, email, role FROM users ORDER BY id")
rows = cursor.fetchall()
print(f"\nTotal usuarios: {len(rows)}")
for row in rows:
    print(f"  ID={row[0]} | {row[1]} | {row[2]} | role={row[3]}")

# Verificar se tem superadmin
cursor.execute("SELECT COUNT(*) FROM users WHERE role='superadmin'")
count = cursor.fetchone()[0]
print(f"\nSuperadmins: {count}")
conn.close()
