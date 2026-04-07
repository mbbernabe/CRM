import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from src.infrastructure.database.models import BaseModel

# Garantir caminho absoluto para o crm.db no diretório root do backend
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATABASE_PATH = os.path.join(BASE_DIR, "crm.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    import src.infrastructure.database.models
    BaseModel.metadata.create_all(bind=engine)
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
