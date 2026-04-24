import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.models import BaseModel
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()

# Priorizar DATABASE_URL do .env (Supabase/Postgres)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("A variável de ambiente DATABASE_URL não foi definida no arquivo .env")

# Ajuste para Render/Heroku que costumam fornecer postgres:// em vez de postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# PostgreSQL (Supabase) — Com Connection Pooling otimizado
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,           # Conexões mantidas abertas permanentemente
    max_overflow=10,       # Conexões extras permitidas em pico de uso
    pool_timeout=30,       # Timeout (seg) para obter conexão do pool
    pool_recycle=1800,     # Reciclar conexões a cada 30 min (evita timeout do Supabase)
    pool_pre_ping=True,    # Testa conexão antes de usar (evita erros de conn morta)
)
# SessionLocal configuration
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
