from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository
from src.application.use_cases.workspace_use_cases import GetWorkspaceUseCase, UpdateWorkspaceUseCase
from src.application.dtos.workspace_dto import WorkspaceReadDTO, WorkspaceUpdateDTO
from src.domain.exceptions.base_exceptions import DomainException
from src.infrastructure.utils.logger import get_logger, log_exception

logger = get_logger(__name__)
router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("/{workspace_id}", response_model=WorkspaceReadDTO)
def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    try:
        return GetWorkspaceUseCase(workspace_repo).execute(workspace_id)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "get_workspace")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao carregar workspace.")

@router.patch("/{workspace_id}", response_model=WorkspaceReadDTO)
def update_workspace(workspace_id: int, data: WorkspaceUpdateDTO, db: Session = Depends(get_db)):
    # No futuro: verificar se o usuário é admin do workspace via JWT
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    try:
        return UpdateWorkspaceUseCase(workspace_repo).execute(workspace_id, data)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "update_workspace")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao atualizar workspace.")
