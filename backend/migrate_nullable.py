import sqlite3
import os

db_path = 'crm.db'

def migrate():
    if not os.path.exists(db_path):
        print(f"Banco {db_path} não encontrado.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Iniciando migração de work_item_types...")
        
        # 1. Obter schema atual
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='work_item_types'")
        create_sql = cursor.fetchone()[0]
        print(f"Schema original: {create_sql}")
        
        # 2. Renomear tabela atual
        cursor.execute("DROP TABLE IF EXISTS work_item_types_old")
        cursor.execute("ALTER TABLE work_item_types RENAME TO work_item_types_old")
        
        # 3. Criar nova tabela com nullable workspace_id
        # Note: We need to ensure the columns and constraints match what was before, but omitting NOT NULL on workspace_id
        new_schema = """
        CREATE TABLE work_item_types (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            name VARCHAR NOT NULL,
            label VARCHAR NOT NULL,
            icon VARCHAR,
            color VARCHAR,
            workspace_id INTEGER,
            is_system BOOLEAN DEFAULT 0,
            FOREIGN KEY(workspace_id) REFERENCES workspaces (id),
            CONSTRAINT _workspace_item_type_uc UNIQUE (workspace_id, name)
        )
        """
        cursor.execute(new_schema)
        
        # 4. Copiar dados
        cursor.execute("INSERT INTO work_item_types (id, name, label, icon, color, workspace_id, is_system) SELECT id, name, label, icon, color, workspace_id, is_system FROM work_item_types_old")
        
        # 5. Remover tabela velha
        cursor.execute("DROP TABLE work_item_types_old")
        
        print("Migração de work_item_types concluída com sucesso!")
        
        # Repetir para dependentes se necessário? 
        # work_item_field_groups e work_item_field_definitions também precisam ser nullable?
        # Sim, para templates globais seus grupos e definições também terão workspace_id = NULL
        
        # Grupos
        print("Migrando work_item_field_groups...")
        cursor.execute("DROP TABLE IF EXISTS work_item_field_groups_old")
        cursor.execute("ALTER TABLE work_item_field_groups RENAME TO work_item_field_groups_old")
        cursor.execute("""
        CREATE TABLE work_item_field_groups (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
            type_id INTEGER NOT NULL, 
            name VARCHAR NOT NULL, 
            "order" INTEGER DEFAULT 0, 
            workspace_id INTEGER, 
            FOREIGN KEY(type_id) REFERENCES work_item_types (id), 
            FOREIGN KEY(workspace_id) REFERENCES workspaces (id), 
            CONSTRAINT _type_group_uc UNIQUE (type_id, name)
        )
        """)
        cursor.execute("INSERT INTO work_item_field_groups (id, type_id, name, \"order\", workspace_id) SELECT id, type_id, name, \"order\", workspace_id FROM work_item_field_groups_old")
        cursor.execute("DROP TABLE work_item_field_groups_old")

        # Pipelines
        print("Migrando pipelines...")
        cursor.execute("DROP TABLE IF EXISTS pipelines_old")
        cursor.execute("ALTER TABLE pipelines RENAME TO pipelines_old")
        cursor.execute("""
        CREATE TABLE pipelines (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
            name VARCHAR NOT NULL, 
            entity_type VARCHAR NOT NULL, 
            team_id INTEGER, 
            workspace_id INTEGER, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            item_label_singular VARCHAR, 
            item_label_plural VARCHAR, 
            FOREIGN KEY(team_id) REFERENCES teams (id), 
            FOREIGN KEY(workspace_id) REFERENCES workspaces (id), 
            CONSTRAINT _workspace_pipeline_uc UNIQUE (workspace_id, name)
        )
        """)
        # We omit created_at from SELECT if it doesn't exist in pipelines_old, or use a literal
        cursor.execute("INSERT INTO pipelines (id, name, entity_type, team_id, workspace_id, item_label_singular, item_label_plural) SELECT id, name, entity_type, team_id, workspace_id, item_label_singular, item_label_plural FROM pipelines_old")
        cursor.execute("DROP TABLE pipelines_old")

        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"Erro na migração: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
