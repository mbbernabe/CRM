from src.infrastructure.database.db import init_db, engine
from src.infrastructure.database.models import BaseModel

print("Iniciando criação da tabela work_item_links...")
try:
    # O create_all só cria tabelas que não existem
    BaseModel.metadata.create_all(bind=engine)
    print("Sucesso! Tabela criada ou já existente.")
except Exception as e:
    print(f"Erro ao criar tabela: {e}")
