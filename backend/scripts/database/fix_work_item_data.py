import sqlite3
import json

def fix_field_definitions():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    # 1. Buscar todos os campos que possuem options_json
    cursor.execute("SELECT id, name, options_json FROM work_item_field_definitions WHERE options_json IS NOT NULL")
    fields = cursor.fetchall()
    
    print(f"--- Iniciando Sanitização de {len(fields)} campos ---")
    
    updated_count = 0
    for f_id, f_name, f_json in fields:
        if not f_json: continue
        
        try:
            # Tenta carregar. Se falhar, é porque não é JSON
            json.loads(f_json)
            # print(f"ID {f_id}: Já é JSON válido.")
        except:
            print(f"ID {f_id} ({f_name}): Corrigindo formato...")
            # Trata como uma string separada por ponto e vírgula (formato comum legado)
            # ou qualquer outro caractere, e converte para lista
            if ';' in f_json:
                new_list = [x.strip() for x in f_json.split(';') if x.strip()]
            elif ',' in f_json:
                new_list = [x.strip() for x in f_json.split(',') if x.strip()]
            else:
                new_list = [f_json.strip()]
            
            new_json = json.dumps(new_list)
            cursor.execute("UPDATE work_item_field_definitions SET options_json = ? WHERE id = ?", (new_json, f_id))
            updated_count += 1
            print(f"   -> Convertido para: {new_json}")

    conn.commit()
    conn.close()
    print(f"\n--- Sanitização concluída. {updated_count} registros corrigidos. ---")

if __name__ == "__main__":
    fix_field_definitions()
