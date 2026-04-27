from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db

def get_user_id_optional(x_user_id: Optional[int] = Header(None, alias="X-User-ID")) -> Optional[int]:
    return int(x_user_id) if x_user_id else None

def get_workspace_id(
    x_workspace_id: int = Header(..., alias="X-Workspace-ID"),
    user_id: Optional[int] = Depends(get_user_id_optional),
    db: Session = Depends(get_db)
) -> int:
    if not x_workspace_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header X-Workspace-ID é obrigatório para esta operação."
        )
    
    # SECURITY: Se o usuário estiver autenticado, validar se ele pertence ao workspace solicitado.
    # Se não houver user_id (rota pública), permitimos (ex: convites, leads se configurado).
    if user_id:
        from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
        repo = SqlAlchemyUserRepository(db)
        if not repo.is_member_of_workspace(user_id, x_workspace_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: você não pertence a este workspace."
            )
            
    return int(x_workspace_id)

def get_workspace_id_optional(x_workspace_id: Optional[int] = Header(None, alias="X-Workspace-ID")) -> Optional[int]:
    return int(x_workspace_id) if x_workspace_id else None

def get_team_id_optional(x_team_id: Optional[int] = Header(None, alias="X-Team-ID")) -> Optional[int]:
    return int(x_team_id) if x_team_id else None

def get_current_user(
    user_id: Optional[int] = Depends(get_user_id_optional),
    db: Session = Depends(get_db)
):
    from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
    if not user_id:
        return None
    repo = SqlAlchemyUserRepository(db)
    return repo.get_by_id(user_id)
