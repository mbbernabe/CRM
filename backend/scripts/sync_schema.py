from sqlalchemy import create_engine, inspect, text
from src.infrastructure.database.models import BaseModel
from src.infrastructure.database.db import SQLALCHEMY_DATABASE_URL

def sync_schema():
    print(f"Syncing schema for database at {SQLALCHEMY_DATABASE_URL}...")
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    inspector = inspect(engine)
    
    type_map = {
        "INTEGER": "INTEGER",
        "VARCHAR": "VARCHAR",
        "DATETIME": "TIMESTAMP",
        "BOOLEAN": "BOOLEAN",
        "TEXT": "TEXT",
        "JSON": "JSONB" # Postgres uses JSONB for efficiency
    }

    with engine.connect() as conn:
        for table_name, table in BaseModel.metadata.tables.items():
            print(f"Checking table '{table_name}'...")
            
            # Check if table exists
            if not inspector.has_table(table_name):
                print(f"Table '{table_name}' does not exist in DB yet. create_all will handle it.")
                continue

            # Get existing columns
            existing_cols = {col['name']: str(col['type']).split('(')[0].upper() for col in inspector.get_columns(table_name)}
            
            for col_name, column in table.columns.items():
                if col_name not in existing_cols:
                    # Determine type
                    col_type = str(column.type).split('(')[0].upper()
                    db_type = type_map.get(col_type, "TEXT")
                    
                    print(f"Missing column: {table_name}.{col_name} ({db_type})")
                    try:
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {db_type}"))
                        conn.commit()
                        print(f"Column '{col_name}' added.")
                    except Exception as e:
                        print(f"Error adding {col_name}: {e}")

    print("Schema sync completed.")

if __name__ == "__main__":
    sync_schema()
