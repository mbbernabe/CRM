import sys
import os

# Adicionar o diretório src ao path para os imports funcionarem
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import UserModel
from src.infrastructure.security.auth_utils import SecurityUtils
from src.application.use_cases.auth_use_cases import LoginUseCase
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository
from src.application.dtos.user_dto import LoginRequestDTO
from src.domain.exceptions.base_exceptions import AuthenticationException

def test_login_inactive_user():
    db = SessionLocal()
    user_repo = SqlAlchemyUserRepository(db)
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    
    email = "inactive@test.com"
    password = "password123"
    
    # Limpar se existir
    existing = db.query(UserModel).filter(UserModel.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()
        
    from src.infrastructure.database.models import WorkspaceModel
    
    # Criar Workspace de teste
    ws = WorkspaceModel(name="Test Workspace")
    db.add(ws)
    db.commit()
    db.refresh(ws)
    
    # Criar usuário inativo
    user_model = UserModel(
        name="Inactive User",
        email=email,
        password=SecurityUtils.hash_password(password),
        is_active=False,
        role="user",
        workspace_id=ws.id
    )
    db.add(user_model)
    db.commit()
    
    use_case = LoginUseCase(user_repo, workspace_repo)
    dto = LoginRequestDTO(email=email, password=password)
    
    print(f"Testando login para usuário inativo: {email}")
    
    try:
        use_case.execute(dto)
        print("ERRO: Login permitido para usuário inativo!")
        return False
    except AuthenticationException as e:
        if "conta está desativada" in str(e):
            print(f"SUCESSO: Login bloqueado com mensagem correta: {str(e)}")
            return True
        else:
            print(f"ERRO: Login bloqueado mas com mensagem inesperada: {str(e)}")
            return False
    except Exception as e:
        print(f"ERRO: Ocorreu uma exceção inesperada: {type(e).__name__}: {str(e)}")
        return False
    finally:
        try:
            db.delete(user_model)
            db.delete(ws)
            db.commit()
        except:
            pass
        db.close()

if __name__ == "__main__":
    success = test_login_inactive_user()
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
