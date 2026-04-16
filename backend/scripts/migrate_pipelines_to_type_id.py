import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    print("--- Iniciando Migração de Pipelines: type_id ---")
    
    try:
        # 1. Adicionar coluna type_id
        print("Adicionando coluna 'type_id' à tabela 'pipelines'...")
        cursor.execute("ALTER TABLE pipelines ADD COLUMN type_id INTEGER REFERENCES work_item_types(id) DEFAULT 1")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("  [OK] Coluna 'type_id' já existe.")
        else:
            print(f"  [ERRO] {e}")
            return

    # 2. Migrar dados baseados em entity_type
    print("Mapeando pipelines existentes para novos WorkItemTypes...")
    
    # Obter todos os tipos para mapeamento
    cursor.execute("SELECT id, name, workspace_id FROM work_item_types")
    types = cursor.fetchall()
    
    # Mapeamento: (name, workspace_id) -> id
    type_map = {}
    for tid, tname, twid in types:
        type_map[(tname, twid)] = tid
    
    # Obter todas as pipelines
    cursor.execute("SELECT id, name, entity_type, workspace_id FROM pipelines")
    pipelines = cursor.fetchall()
    
    for pid, pname, pentity, pwid in pipelines:
        # Tenta encontrar tipo específico do workspace
        target_type_id = type_map.get((pentity, pwid))
        
        # Se não encontrar, tenta o tipo global (workspace_id is None)
        if not target_type_id:
            target_type_id = type_map.get((pentity, None))
            
        if target_type_id:
            print(f"  Mapping Pipeline '{pname}' ({pentity}) to Type ID {target_type_id}")
            cursor.execute("UPDATE pipelines SET type_id = ? WHERE id = ?", (target_type_id, pid))
        else:
            print(f"  [AVISO] Não foi possível encontrar um WorkItemType para a pipeline '{pname}' ({pentity})")

    conn.commit()
    conn.close()
    print("\n--- Migração concluída com sucesso. ---")

if __name__ == "__main__":
    migrate()
