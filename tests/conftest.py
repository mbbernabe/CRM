import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Adiciona o diretório raiz do backend ao sys.path para que os testes encontrem os módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from main import app
from src.infrastructure.database.db import get_db
from src.infrastructure.database.models import BaseModel

# Configuração do Banco de Dados em Memória para Testes
# StaticPool é necessário para manter a conexão aberta em memória durante o teste
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Cria um novo banco de dados para cada teste."""
    BaseModel.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        BaseModel.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Override da dependência get_db para usar a sessão de teste."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers():
    """Fixture auxiliar para gerar headers de autenticação mockados/reais."""
    return {"Authorization": "Bearer test-token"}

@pytest.fixture
def team_headers():
    """Fixture para testar Multi-Tenancy."""
    return {"X-Team-ID": "team-123", "Authorization": "Bearer test-token"}
