import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.getenv('DATABASE_URL')
if url and url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql://', 1)

engine = create_engine(url)

with engine.connect() as conn:
    print("--- Pipelines ---")
    res = conn.execute(text("SELECT id, name, workspace_id FROM pipelines"))
    for row in res:
        print(row)
