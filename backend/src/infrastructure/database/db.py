from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from src.infrastructure.database.models import BaseModel

SQLALCHEMY_DATABASE_URL = "sqlite:///./crm.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    import src.infrastructure.database.models
    BaseModel.metadata.create_all(bind=engine)
    try:
        from seed_properties import seed as seed_props
        seed_props()
        from seed import seed as seed_contacts
        seed_contacts()
        from seed_companies import seed as seed_companies
        seed_companies()
    except Exception as e:
        print(f"Erro ao rodar seeds: {e}")
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
