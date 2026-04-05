import sqlite3
import os

db_path = 'crm.db'
target_email = 'contato@asamorim.com.br'

if not os.path.exists(db_path):
    print(f"Error: Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE email=?", (target_email,))
    row = cursor.fetchone()
    if row:
        print(f"User found: {row[0]}")
    else:
        print("User NOT found")
    conn.close()
