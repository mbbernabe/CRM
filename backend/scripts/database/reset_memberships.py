import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Adiciona o diretório raiz ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.models import (
    BaseModel, WorkspaceModel, TeamModel, UserModel, MembershipModel,
    SystemSettingsModel
)
from src.infrastructure.database.db import SQLALCHEMY_DATABASE_URL
from src.infrastructure.security.auth_utils import SecurityUtils

def reset_and_seed():
    print("--- [MULTI-WORKSPACE RESET & SEED] ---")
    
    # Resolver o caminho absoluto para o banco de dados se for SQLite
    db_url = SQLALCHEMY_DATABASE_URL
    if db_url.startswith("sqlite:///"):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
        db_relative_path = db_url.replace("sqlite:///", "")
        db_path = os.path.abspath(os.path.join(base_dir, db_relative_path))
        db_url = f"sqlite:///{db_path}"
        
        # Remove arquivo se existir
        if os.path.exists(db_path):
            print(f"Removendo banco atual em: {db_path}")
            os.remove(db_path)

    engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
    
    print("Limpando banco de dados...")
    if "postgresql" in db_url or "psycopg2" in db_url:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Lista todas as tabelas no schema public
            result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
            tables = [row[0] for row in result]
            if tables:
                print(f"Removendo {len(tables)} tabelas com CASCADE...")
                conn.execute(text(f"DROP TABLE IF EXISTS {', '.join(tables)} CASCADE"))
                conn.commit()
    else:
        BaseModel.metadata.drop_all(bind=engine)
    
    print("Criando novas tabelas...")
    BaseModel.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        # 1. Configurações de Sistema
        print("Configurando Sistema...")
        settings = [
            SystemSettingsModel(key="reset_link_base_url", value="http://localhost:5173", description="Base URL para links de convite e senha"),
            SystemSettingsModel(key="company_name", value="Antigravity CRM", description="Nome da plataforma")
        ]
        db.add_all(settings)
        
        # 2. Criar Workspace Padrão
        print("Criando workspace padrão...")
        workspace = WorkspaceModel(
            name="Minha Empresa",
            primary_color="#0091ae",
            accent_color="#ff7a59",
            invitation_expiry_days=7,
            invitation_message="Bem-vindo ao nosso CRM!"
        )
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
        
        # 3. Criar Time Padrão
        print("Criando time padrão...")
        team = TeamModel(
            name="Geral",
            workspace_id=workspace.id
        )
        db.add(team)
        db.commit()
        db.refresh(team)
        
        # 4. Criar Super Admin
        print("Criando Super Admin...")
        admin = UserModel(
            name="Super Admin",
            email="admin@crm.com",
            password=SecurityUtils.hash_password("admin123"),
            last_active_workspace_id=workspace.id,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        # 5. Criar Membership
        print("Vinculando Admin ao Workspace...")
        membership = MembershipModel(
            user_id=admin.id,
            workspace_id=workspace.id,
            team_id=team.id,
            role="superadmin"
        )
        db.add(membership)
        
        db.commit()
        
        print("\n" + "="*40)
        print("RESET CONCLUÍDO COM SUCESSO!")
        print("="*40)
        print(f"Workspace: {workspace.name} (ID: {workspace.id})")
        print(f"Usuário: {admin.name} ({admin.email})")
        print(f"Senha: admin123")
        print("="*40)
        
    except Exception as e:
        print(f"ERRO CRÍTICO: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
