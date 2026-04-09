import sqlite3
import os
import sys

# Garantir que o root do backend esteja no path para importar src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from src.infrastructure.database.models import BaseModel
from src.infrastructure.database.db import DATABASE_PATH

def sync_schema():
    print(f"Syncing schema for database at {DATABASE_PATH}...")
    
    if not os.path.exists(DATABASE_PATH):
        print("Database file not found!")
        return

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    type_map = {
        "INTEGER": "INTEGER",
        "String": "VARCHAR",
        "VARCHAR": "VARCHAR",
        "DATETIME": "DATETIME",
        "DateTime": "DATETIME",
        "BOOLEAN": "BOOLEAN",
        "Boolean": "BOOLEAN",
        "TEXT": "TEXT",
        "Text": "TEXT",
        "JSON": "JSON"
    }

    for table_name, table in BaseModel.metadata.tables.items():
        print(f"Checking table '{table_name}'...")
        # Get existing columns
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing_cols = {row[1]: row[2] for row in cursor.fetchall()}
        
        if not existing_cols:
            print(f"Table '{table_name}' does not exist in DB yet. create_all will handle it.")
            continue

        for col_name, column in table.columns.items():
            if col_name not in existing_cols:
                # Determine type
                col_type = str(column.type).split('(')[0].upper()
                sqlite_type = type_map.get(col_type, "TEXT")
                
                print(f"Missing column: {table_name}.{col_name} ({sqlite_type})")
                try:
                    cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {sqlite_type}")
                    print(f"Column '{col_name}' added.")
                except Exception as e:
                    print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Schema sync completed.")

if __name__ == "__main__":
    sync_schema()
