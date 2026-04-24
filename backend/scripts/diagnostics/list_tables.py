import sqlite3
import os

db_path = 'backend/crm.db'
if not os.path.exists(db_path):
    print(f"File {db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in database:")
    for t in tables:
        print(f" - {t[0]}")
    
    print("\nContent of work_item_field_definitions for task_template:")
    cursor.execute("""
        SELECT fd.label, fd.name, fd.field_type 
        FROM work_item_field_definitions fd
        JOIN work_item_types t ON fd.type_id = t.id
        WHERE t.name = 'task_template'
    """)
    fields = cursor.fetchall()
    for f in fields:
        print(f" - {f[0]} ({f[1]}): {f[2]}")
    conn.close()
