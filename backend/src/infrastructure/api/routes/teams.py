from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.db import get_db
from src.infrastructure.api.dependencies import get_workspace_id
from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
from src.application.use_cases.team_use_cases import ListTeamsUseCase, CreateTeamUseCase, DeleteTeamUseCase
from src.application.dtos.team_dto import TeamReadDTO, TeamCreateDTO
from src.domain.exceptions.base_exceptions import DomainException
from src.infrastructure.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamReadDTO])
def list_teams(
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    team_repo = SqlAlchemyTeamRepository(db)
    return ListTeamsUseCase(team_repo).execute(workspace_id)

@router.post("", response_model=TeamReadDTO, status_code=status.HTTP_201_CREATED)
def create_team(
    dto: TeamCreateDTO,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    team_repo = SqlAlchemyTeamRepository(db)
    try:
        return CreateTeamUseCase(team_repo).execute(workspace_id, dto)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    team_repo = SqlAlchemyTeamRepository(db)
    try:
        if DeleteTeamUseCase(team_repo).execute(workspace_id, team_id):
            return {"message": "Time removido com sucesso."}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time não encontrado.")
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
