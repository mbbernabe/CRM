import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adiciona o diretório raiz ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.models import (
    BaseModel, WorkspaceModel, TeamModel, UserModel, 
    PropertyGroupModel, PropertyDefinitionModel, EntityPropertyLinkModel,
    CompanyModel, ContactModel, PipelineModel, PipelineStageModel,
    SystemSettingsModel
)
from src.infrastructure.database.db import SQLALCHEMY_DATABASE_URL

def reset_db():
    print(f"--- [DATABASE RESET] ---")
    print(f"URL: {SQLALCHEMY_DATABASE_URL}")
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    print("⚠️ ATENÇÃO: Isso irá apagar TODAS as tabelas no banco de dados remoto!")
    confirm = input("Tem certeza que deseja continuar? (s/N): ")
    if confirm.lower() != 's':
        print("Operação cancelada.")
        return

    print("Apagando todas as tabelas existentes...")
    BaseModel.metadata.drop_all(bind=engine)
    print("Tabelas apagadas.")

    print("Criando tabelas a partir dos modelos...")
    BaseModel.metadata.create_all(bind=engine)
    print("Tabelas criadas com sucesso.")

    print("--- [RESET CONCLUÍDO COM SUCESSO] ---")


if __name__ == "__main__":
    reset_db()
