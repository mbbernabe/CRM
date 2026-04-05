from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_pipeline_repository import SqlAlchemyPipelineRepository
from src.application.use_cases.pipeline_use_cases import PipelineUseCases
from src.application.dtos.pipeline_dto import PipelineReadDTO, PipelineCreateDTO, PipelineUpdateDTO, EntityMoveDTO
from src.infrastructure.api.dependencies import get_team_id
from typing import List

router = APIRouter(prefix="/pipelines", tags=["Pipelines"])

@router.get("/", response_model=List[PipelineReadDTO])
def list_pipelines(db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.list_pipelines(team_id)

@router.get("/{pipeline_id}", response_model=PipelineReadDTO)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    pipeline = use_case.get_pipeline(pipeline_id, team_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return pipeline

@router.post("/", response_model=PipelineReadDTO, status_code=status.HTTP_201_CREATED)
def create_pipeline(dto: PipelineCreateDTO, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.create_pipeline(dto, team_id)

@router.put("/{pipeline_id}")
def update_pipeline(pipeline_id: int, dto: PipelineUpdateDTO, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.update_pipeline(pipeline_id, dto, team_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return {"message": "Pipeline atualizada com sucesso"}

@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline(pipeline_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.delete_pipeline(pipeline_id, team_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return None

@router.post("/move")
def move_entity(dto: EntityMoveDTO, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.move_entity(dto.entity_type, dto.entity_id, dto.stage_id, team_id)
    if not success:
        raise HTTPException(status_code=400, detail="Erro ao mover entidade. Verifique se o estágio e a entidade existem e pertencem ao seu time.")
    return {"message": "Entidade movida com sucesso"}
