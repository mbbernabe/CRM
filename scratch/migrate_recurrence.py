from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres.npblzejgnbvfzexqrwhy:Zpep0a45Vr6353vJ@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Executando migração...")
    conn.execute(text('ALTER TABLE work_items ADD COLUMN IF NOT EXISTS recurrence_config JSONB'))
    conn.commit()
    print("Coluna recurrence_config adicionada com sucesso!")
