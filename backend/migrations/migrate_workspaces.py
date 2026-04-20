import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Iniciando migração de colunas para Workspaces...")
        
        # Colunas de SMTP
        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN smtp_host VARCHAR"))
            print("- smtp_host adicionado")
        except Exception as e: print(f"! smtp_host: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN smtp_port INTEGER"))
            print("- smtp_port adicionado")
        except Exception as e: print(f"! smtp_port: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN smtp_user VARCHAR"))
            print("- smtp_user adicionado")
        except Exception as e: print(f"! smtp_user: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN smtp_password VARCHAR"))
            print("- smtp_password adicionado")
        except Exception as e: print(f"! smtp_password: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN smtp_sender_email VARCHAR"))
            print("- smtp_sender_email adicionado")
        except Exception as e: print(f"! smtp_sender_email: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN smtp_sender_name VARCHAR"))
            print("- smtp_sender_name adicionado")
        except Exception as e: print(f"! smtp_sender_name: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN smtp_security VARCHAR DEFAULT 'STARTTLS'"))
            print("- smtp_security adicionado")
        except Exception as e: print(f"! smtp_security: {e}")

        # Colunas de API de Leads
        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN lead_api_key VARCHAR"))
            conn.execute(text("CREATE UNIQUE INDEX ix_workspaces_lead_api_key ON workspaces (lead_api_key)"))
            print("- lead_api_key adicionado")
        except Exception as e: print(f"! lead_api_key: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN lead_pipeline_id INTEGER REFERENCES pipelines(id)"))
            print("- lead_pipeline_id adicionado")
        except Exception as e: print(f"! lead_pipeline_id: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN lead_stage_id INTEGER REFERENCES pipeline_stages(id)"))
            print("- lead_stage_id adicionado")
        except Exception as e: print(f"! lead_stage_id: {e}")

        try:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN lead_type_id INTEGER REFERENCES work_item_types(id)"))
            print("- lead_type_id adicionado")
        except Exception as e: print(f"! lead_type_id: {e}")

        conn.commit()
        print("Migração concluída.")

if __name__ == "__main__":
    migrate()
