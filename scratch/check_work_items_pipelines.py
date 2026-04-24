import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.getenv('DATABASE_URL')
if url and url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql://', 1)

engine = create_engine(url)

with engine.connect() as conn:
    print("--- Work Items with Pipeline IDs ---")
    res = conn.execute(text("SELECT id, title, pipeline_id, type_id, workspace_id FROM work_items"))
    for row in res:
        print(row)
