import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from src.infrastructure.database.models import BaseModel
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()

# Priorizar DATABASE_URL do .env (Supabase/Postgres)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    print("ERRO: DATABASE_URL não encontrada no .env")
    exit(1)

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Conectando ao banco para reset de schema...")
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def reset_db():
    try:
        # Tenta deletar todas as tabelas (cuidado com dependências)
        print("Limpando esquema existente (DROP TABLES)...")
        with engine.connect() as conn:
            # Desabilitar restrições de chave estrangeira temporariamente para o drop (específico de Postgres)
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            conn.commit()
        
        print("Recriando tabelas...")
        import src.infrastructure.database.models
        BaseModel.metadata.create_all(bind=engine)
        print("[OK] Esquema recriado com sucesso.")
    except Exception as e:
        print(f"Erro ao resetar banco: {str(e)}")

if __name__ == "__main__":
    reset_db()
