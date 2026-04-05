from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.application.use_cases.admin_use_cases import ListAllUsersUseCase
from src.application.dtos.user_dto import UserReadDTO

router = APIRouter(prefix="/admin", tags=["Admin"])

# Dependência simples para verificar se o ID do usuário no Header é um admin
# No futuro, isso será substituído por JWT e Roles reais (RBAC)
def get_current_user_role(x_user_role: str = Header(None)):
    if not x_user_role:
        raise HTTPException(status_code=401, detail="Role não informada")
    return x_user_role

def require_superadmin(role: str = Depends(get_current_user_role)):
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="Acesso negado: Somente Super-Administradores globais")
    return role

from src.infrastructure.utils.logger import get_logger, log_exception
from src.domain.exceptions.base_exceptions import DomainException

logger = get_logger(__name__)

@router.get("/users", response_model=List[UserReadDTO])
def list_users(db: Session = Depends(get_db), superadmin_role: str = Depends(require_superadmin)):
    user_repo = SqlAlchemyUserRepository(db)
    try:
        return ListAllUsersUseCase(user_repo).execute()
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "list_all_users")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Não foi possível carregar a lista de usuários. Por favor, tente novamente mais tarde."
        )
