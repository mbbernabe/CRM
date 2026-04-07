import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '../../crm.db')

def fix_schema():
    print(f"🔍 Verificando esquema em {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Colunas para adicionar na tabela workspaces
    columns_to_add = [
        ("description", "TEXT"),
        ("logo_url", "VARCHAR"),
        ("primary_color", "VARCHAR DEFAULT '#0091ae'"),
        ("accent_color", "VARCHAR DEFAULT '#ff7a59'")
    ]
    
    cursor.execute("PRAGMA table_info(workspaces)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            print(f"➕ Adicionando coluna '{col_name}'...")
            try:
                cursor.execute(f"ALTER TABLE workspaces ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"⚠️ Erro ao adicionar {col_name}: {e}")
    
    # Colunas para adicionar na tabela pipelines
    pipeline_columns = [
        ("item_label_singular", "VARCHAR"),
        ("item_label_plural", "VARCHAR")
    ]
    
    cursor.execute("PRAGMA table_info(pipelines)")
    existing_pipeline_cols = [row[1] for row in cursor.fetchall()]
    
    for col_name, col_type in pipeline_columns:
        if col_name not in existing_pipeline_cols:
            print(f"➕ Adicionando coluna '{col_name}' em pipelines...")
            try:
                cursor.execute(f"ALTER TABLE pipelines ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"⚠️ Erro ao adicionar {col_name} em pipelines: {e}")

    conn.commit()
    conn.close()
    print("✅ Ajuste de esquema concluído.")

if __name__ == "__main__":
    fix_schema()
