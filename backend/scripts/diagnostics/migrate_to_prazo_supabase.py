import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.getenv('DATABASE_URL')

def migrate():
    print("--- [MIGRATION] Consolidating Task Dates to 'prazo' (Supabase) ---")
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        
        # 1. Identificar tipos de Tarefa (Global e Clones)
        cur.execute("SELECT id, workspace_id FROM work_item_types WHERE name = 'task_template'")
        types = cur.fetchall()
        
        for type_id, ws_id in types:
            print(f"\nProcessando Tipo ID: {type_id} (Workspace: {ws_id if ws_id else 'GLOBAL'})")
            
            # 2. Verificar/Criar campo 'prazo'
            cur.execute("SELECT id FROM work_item_field_definitions WHERE type_id = %s AND name = 'prazo'", (type_id,))
            range_field = cur.fetchone()
            
            if not range_field:
                # Criar campo prazo
                cur.execute("""
                    INSERT INTO work_item_field_definitions (type_id, name, label, field_type, is_required, is_default, \"order\")
                    VALUES (%s, 'prazo', 'Prazo (Início e Entrega)', 'date_range', false, true, 0)
                    RETURNING id
                """, (type_id,))
                range_field_id = cur.fetchone()[0]
                print(f" - Campo 'prazo' criado (ID: {range_field_id})")
            else:
                print(f" - Campo 'prazo' já existe (ID: {range_field[0]})")
            
            # 3. Migrar dados dos Work Items deste tipo
            cur.execute("SELECT id, custom_fields FROM work_items WHERE type_id = %s", (type_id,))
            items = cur.fetchall()
            
            for item_id, cf in items:
                if not cf: cf = {}
                
                # Tenta pegar de vários nomes possíveis
                start = cf.get('start_date') or cf.get('data_inicio') or cf.get('inicio')
                due = cf.get('due_date') or cf.get('prazo_final') or cf.get('entrega')
                
                if start or due:
                    # Formato date_range: "YYYY-MM-DD;YYYY-MM-DD"
                    cf['prazo'] = f"{start or ''};{due or ''}"
                    
                    # Remover campos antigos
                    for old_key in ['start_date', 'due_date', 'data_inicio', 'prazo_final', 'inicio', 'entrega', 'Data de Inicio', 'Prazo Final']:
                        if old_key in cf: del cf[old_key]
                    
                    import json
                    cur.execute("UPDATE work_items SET custom_fields = %s WHERE id = %s", (json.dumps(cf), item_id))
                    print(f"   - Item {item_id} migrado: {cf['prazo']}")
            
            # 4. Remover definições de campos antigos (start_date, due_date)
            # Antes de deletar, precisamos limpar as referências de source_field_id em clones (se houver)
            cur.execute("""
                UPDATE work_item_field_definitions 
                SET source_field_id = NULL 
                WHERE source_field_id IN (
                    SELECT id FROM work_item_field_definitions 
                    WHERE type_id = %s AND name IN ('start_date', 'due_date', 'data_inicio', 'prazo_final')
                )
            """, (type_id,))
            
            cur.execute("""
                DELETE FROM work_item_field_definitions 
                WHERE type_id = %s AND name IN ('start_date', 'due_date', 'data_inicio', 'prazo_final')
            """, (type_id,))
            print(f" - Definições de campos antigos removidas para tipo {type_id}")

        conn.commit()
        print("\n--- Migração concluída com sucesso! ---")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"ERRO na migração: {e}")
        if 'conn' in locals(): conn.rollback()

if __name__ == "__main__":
    migrate()
