import sqlite3
import os

def migrate():
    db_path = "crm.db"
    if not os.path.exists(db_path):
        db_path = "backend/crm.db"
    
    print(f"Usando banco de dados: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Adicionando coluna is_default à tabela work_item_field_definitions...")
        # SQLite não suporta IF NOT EXISTS em ADD COLUMN em versões muito antigas, 
        # mas faremos um check manual das colunas.
        cursor.execute("PRAGMA table_info(work_item_field_definitions)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'is_default' not in columns:
            cursor.execute("ALTER TABLE work_item_field_definitions ADD COLUMN is_default BOOLEAN DEFAULT 1")
            print("Coluna is_default adicionada com sucesso.")
        else:
            print("Coluna is_default já existe.")

        conn.commit()
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
