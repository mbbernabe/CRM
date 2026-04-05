import sqlite3
import os

def migrate():
    db_path = 'crm.db'
    if not os.path.exists(db_path):
        print("Database not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Adding entity_type column to property_definitions...")
    try:
        # Padrão é 'contact' para todas as propriedades existentes
        cursor.execute("ALTER TABLE property_definitions ADD COLUMN entity_type VARCHAR NOT NULL DEFAULT 'contact'")
    except sqlite3.OperationalError as e:
        print(f"Notice: {e}")

    print("Creating companies and company_property_values tables...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR NOT NULL,
            domain VARCHAR UNIQUE,
            status VARCHAR DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS company_property_values (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL REFERENCES companies(id),
            property_id INTEGER NOT NULL REFERENCES property_definitions(id),
            value TEXT
        )
    ''')

    # Create indexes manually
    try:
        cursor.execute("CREATE INDEX ix_property_definitions_entity_type ON property_definitions(entity_type)")
        cursor.execute("CREATE INDEX ix_companies_domain ON companies(domain)")
    except sqlite3.OperationalError:
        pass # Ignora se os índices já existirem

    conn.commit()
    conn.close()
    print("Migration finished!")

if __name__ == "__main__":
    migrate()
