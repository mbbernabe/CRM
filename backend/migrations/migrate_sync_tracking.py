import sqlite3
import os

DB_PATH = 'crm.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Banco de dados {DB_PATH} não encontrado.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Adicionando coluna source_type_id em work_item_types...")
        cursor.execute("ALTER TABLE work_item_types ADD COLUMN source_type_id INTEGER REFERENCES work_item_types(id);")
        
        print("Adicionando coluna source_field_id em work_item_field_definitions...")
        cursor.execute("ALTER TABLE work_item_field_definitions ADD COLUMN source_field_id INTEGER REFERENCES work_item_field_definitions(id);")
        
        conn.commit()
        print("Migração concluída com sucesso!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Colunas já existem. Pulando.")
        else:
            print(f"Erro na migração: {e}")
            conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
