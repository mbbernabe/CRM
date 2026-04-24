import sqlite3
import json

conn = sqlite3.connect('backend/crm.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", tables)

for table in [t[0] for t in tables]:
    print(f"\n--- {table} ---")
    try:
        cursor.execute(f"SELECT * FROM {table} LIMIT 5")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
    except Exception as e:
        print("Error:", e)

conn.close()
