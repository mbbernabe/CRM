import os
import sys
import sqlite3
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
    print("--- [DATABASE RESET] ---")
    
    # Resolver o caminho absoluto para o banco de dados
    # O backend espera o banco em backend/crm.db
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    db_relative_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
    db_path = os.path.abspath(os.path.join(base_dir, db_relative_path))

    if os.path.exists(db_path):
        print(f"Apagando banco de dados existente em: {db_path}")
        try:
            os.remove(db_path)
            print("Arquivo removido com sucesso.")
        except Exception as e:
            print(f"Erro ao remover arquivo: {e}")
            return

    # Usar a URL absoluta para o SQLAlchemy
    absolute_url = f"sqlite:///{db_path}"
    print(f"Usando URL: {absolute_url}")
    engine = create_engine(absolute_url, connect_args={"check_same_thread": False})
    
    print("Criando tabelas a partir dos modelos...")
    BaseModel.metadata.create_all(bind=engine)
    print("Tabelas criadas com sucesso.")

    # Verificar se as tabelas foram criadas usando sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    table_names = [t[0] for t in tables]
    print(f"Tabelas no banco ({len(table_names)}): {table_names}")
    conn.close()

    if len(table_names) == 0:
        print("AVISO: Nenhuma tabela foi criada. Verifique as definições dos modelos.")
    else:
        print("--- [RESET CONCLUÍDO COM SUCESSO] ---")


if __name__ == "__main__":
    reset_db()
