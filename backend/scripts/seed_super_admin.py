import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.infrastructure.database.db import SessionLocal, init_db
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository
from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository
from src.application.use_cases.auth_use_cases import RegisterUserUseCase
from src.application.dtos.user_dto import UserCreateDTO

def seed_super_admin():
    print("Iniciando seed do Super Admin...")
    db = SessionLocal()
    try:
        user_repo = SqlAlchemyUserRepository(db)
        team_repo = SqlAlchemyTeamRepository(db)
        workspace_repo = SqlAlchemyWorkspaceRepository(db)
        membership_repo = SqlAlchemyMembershipRepository(db)
        
        email = "mbbernabe@gmail.com"
        password = "adm123"
        
        existing_user = user_repo.get_by_email(email)
        if existing_user:
            print(f"Usuário {email} já existe.")
            return

        dto = UserCreateDTO(
            name="Marcelo Bernabe (Super Admin)",
            email=email,
            password=password,
            workspace_name="CRM Principal"
        )
        
        register_use_case = RegisterUserUseCase(
            user_repo, team_repo, workspace_repo, membership_repo
        )
        
        user, workspace = register_use_case.execute(dto)
        print(f"Super Admin criado com sucesso: {user.email}")
        print(f"Workspace criada: {workspace.name}")
        
    except Exception as e:
        print(f"Erro ao criar Super Admin: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_super_admin()
