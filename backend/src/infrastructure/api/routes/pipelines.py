from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_pipeline_repository import SqlAlchemyPipelineRepository
from src.application.use_cases.pipeline_use_cases import PipelineUseCases
from src.application.dtos.pipeline_dto import PipelineReadDTO, PipelineCreateDTO, PipelineUpdateDTO, EntityMoveDTO
from src.infrastructure.api.dependencies import get_workspace_id, get_team_id_optional
from typing import List, Optional

router = APIRouter(prefix="/pipelines", tags=["Pipelines"])

@router.get("/", response_model=List[PipelineReadDTO])
def list_pipelines(db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.list_pipelines(workspace_id)

@router.get("/{pipeline_id}", response_model=PipelineReadDTO)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    pipeline = use_case.get_pipeline(pipeline_id, workspace_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return pipeline

@router.post("/", response_model=PipelineReadDTO, status_code=status.HTTP_201_CREATED)
def create_pipeline(dto: PipelineCreateDTO, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id), team_id: Optional[int] = Depends(get_team_id_optional)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.create_pipeline(dto, workspace_id, team_id)

@router.put("/{pipeline_id}")
def update_pipeline(pipeline_id: int, dto: PipelineUpdateDTO, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.update_pipeline(pipeline_id, dto, workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return {"message": "Pipeline atualizada com sucesso"}

@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline(pipeline_id: int, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.delete_pipeline(pipeline_id, workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return None

@router.post("/move")
def move_entity(dto: EntityMoveDTO, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.move_entity(dto.entity_type, dto.entity_id, dto.stage_id, workspace_id)
    if not success:
        raise HTTPException(status_code=400, detail="Erro ao mover entidade. Verifique se o estágio e a entidade existem e pertencem à sua Área de Trabalho.")
    return {"message": "Entidade movida com sucesso"}
