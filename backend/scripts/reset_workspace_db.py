import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adiciona o diretório raiz ao sys.path para importar src
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

from src.infrastructure.database.models import BaseModel, WorkspaceModel, TeamModel, UserModel
from src.infrastructure.database.db import SQLALCHEMY_DATABASE_URL

def reset_database():
    print("Iniciando reset do banco de dados para arquitetura Workspace...")
    
    # Remove o banco de dados antigo se existir
    db_path = "./crm.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Banco de dados antigo '{db_path}' removido.")

    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Cria todas as tabelas
    print("Criando novas tabelas...")
    BaseModel.metadata.create_all(bind=engine)
    
    # Cria um Workspace e Time padrão (opcional, para testes iniciais)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("Criando registros iniciais (Workspace Default)...")
        # 1. Cria Workspace
        workspace = WorkspaceModel(name="Área de Trabalho Padrão")
        db.add(workspace)
        db.flush()
        
        # 2. Cria Time
        team = TeamModel(name="Geral", workspace_id=workspace.id)
        db.add(team)
        db.flush()
        
        # 3. Cria Usuário Admin padrão (apenas para teste)
        user = UserModel(
            name="Admin",
            email="admin@crm.com",
            password="admin", # Plain text conforme plano
            workspace_id=workspace.id,
            team_id=team.id,
            role="admin"
        )
        db.add(user)
        
        db.commit()
        print("Reset concluído com sucesso!")
        print(f"Workspace ID: {workspace.id}")
        print(f"Team ID: {team.id}")
        print(f"User: admin@crm.com / admin")
        
    except Exception as e:
        print(f"Erro ao inicializar dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
