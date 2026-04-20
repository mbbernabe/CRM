import sqlite3

def migrate():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    print("--- Iniciando Migração de Esquema ---")
    
    try:
        # 1. Adicionar is_system em work_item_types
        print("Adicionando 'is_system' em 'work_item_types'...")
        cursor.execute("ALTER TABLE work_item_types ADD COLUMN is_system BOOLEAN DEFAULT 0")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("  [OK] Coluna 'is_system' já existe.")
        else:
            print(f"  [ERRO] {e}")

    try:
        # 2. Adicionar group_id em work_item_field_definitions
        print("Adicionando 'group_id' em 'work_item_field_definitions'...")
        cursor.execute("ALTER TABLE work_item_field_definitions ADD COLUMN group_id INTEGER REFERENCES work_item_field_groups(id)")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("  [OK] Coluna 'group_id' já existe.")
        else:
            print(f"  [ERRO] {e}")

    conn.commit()
    conn.close()
    print("\n--- Migração concluída. ---")

if __name__ == "__main__":
    migrate()
