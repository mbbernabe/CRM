import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.getenv('DATABASE_URL')
if url and url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql://', 1)

engine = create_engine(url)

with engine.connect() as conn:
    print("--- Work Item Types ---")
    res = conn.execute(text("SELECT id, name, label, workspace_id FROM work_item_types"))
    for row in res:
        print(row)
        
    print("\n--- Work Items ---")
    res = conn.execute(text("SELECT id, title, type_id, owner_id, workspace_id, custom_fields FROM work_items LIMIT 10"))
    for row in res:
        print(row)
