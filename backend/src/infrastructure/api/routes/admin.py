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

def require_admin(role: str = Depends(get_current_user_role)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado: Somente administradores")
    return role

@router.get("/users", response_model=List[UserReadDTO])
def list_users(db: Session = Depends(get_db), admin_role: str = Depends(require_admin)):
    user_repo = SqlAlchemyUserRepository(db)
    return ListAllUsersUseCase(user_repo).execute()
