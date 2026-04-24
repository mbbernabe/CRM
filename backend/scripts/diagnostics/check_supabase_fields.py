import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.getenv('DATABASE_URL')

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    # Encontrar o tipo Tarefa
    cur.execute("SELECT id, name, label FROM work_item_types WHERE name = 'task_template' AND workspace_id IS NULL")
    task_type = cur.fetchone()
    
    if task_type:
        type_id = task_type[0]
        print(f"Tipo: {task_type[2]} ({task_type[1]}) ID: {type_id}")
        
        # Listar campos
        cur.execute("SELECT name, label, field_type FROM work_item_field_definitions WHERE type_id = %s ORDER BY \"order\"", (type_id,))
        fields = cur.fetchall()
        print("\nCampos no Template Global:")
        for f in fields:
            print(f" - {f[1]} ({f[0]}): {f[2]}")
            
        # Verificar se algum workspace clonou e mudou
        cur.execute("SELECT id, workspace_id FROM work_item_types WHERE name = 'task_template' AND workspace_id IS NOT NULL")
        clones = cur.fetchall()
        for clone in clones:
            print(f"\nCampos no Workspace {clone[1]}:")
            cur.execute("SELECT name, label, field_type FROM work_item_field_definitions WHERE type_id = %s ORDER BY \"order\"", (clone[0],))
            c_fields = cur.fetchall()
            for f in c_fields:
                print(f" - {f[1]} ({f[0]}): {f[2]}")
    else:
        print("Template 'task_template' nao encontrado.")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Erro: {e}")
