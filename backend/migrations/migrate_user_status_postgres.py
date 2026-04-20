import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
DEFAULT_SQLITE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'crm.db')}"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    print(f"--- Iniciando Migração de Usuários (Postgres) em {SQLALCHEMY_DATABASE_URL.split('@')[-1]} ---")
    
    with engine.connect() as conn:
        # 1. Adicionar is_active em users
        try:
            print("Adicionando 'is_active' em 'users'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
            conn.commit()
            print("  [OK] Coluna 'is_active' adicionada.")
        except Exception as e:
            print(f"  [AVISO/ERRO] {e}")

        # 2. Adicionar last_activity em users
        try:
            print("Adicionando 'last_activity' em 'users'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN last_activity TIMESTAMP WITHOUT TIME ZONE"))
            conn.commit()
            print("  [OK] Coluna 'last_activity' adicionada.")
        except Exception as e:
            print(f"  [AVISO/ERRO] {e}")

        # 3. Adicionar deactivated_at em users
        try:
            print("Adicionando 'deactivated_at' em 'users'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP WITHOUT TIME ZONE"))
            conn.commit()
            print("  [OK] Coluna 'deactivated_at' adicionada.")
        except Exception as e:
            print(f"  [AVISO/ERRO] {e}")

    print("\n--- Migração concluída. ---")

if __name__ == "__main__":
    migrate()
