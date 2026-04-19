import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.models import BaseModel
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()

# Garantir caminho absoluto para o crm.db no diretório root do backend como fallback
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DEFAULT_SQLITE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'crm.db')}"

# Priorizar DATABASE_URL do .env (Supabase/Postgres)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

# Ajuste para Render/Heroku que costumam fornecer postgres:// em vez de postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configurações do engine dependendo do banco
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL (Supabase) — Com Connection Pooling otimizado
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=5,           # Conexões mantidas abertas permanentemente
        max_overflow=10,       # Conexões extras permitidas em pico de uso
        pool_timeout=30,       # Timeout (seg) para obter conexão do pool
        pool_recycle=1800,     # Reciclar conexões a cada 30 min (evita timeout do Supabase)
        pool_pre_ping=True,    # Testa conexão antes de usar (evita erros de conn morta)
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    import src.infrastructure.database.models
    BaseModel.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
