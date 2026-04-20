from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_pipeline_repository import SqlAlchemyPipelineRepository
from src.application.use_cases.pipeline_use_cases import PipelineUseCases
from src.application.dtos.pipeline_dto import PipelineReadDTO, PipelineCreateDTO, PipelineUpdateDTO, EntityMoveDTO, PipelineImportDTO
from src.infrastructure.api.dependencies import get_workspace_id, get_workspace_id_optional, get_team_id_optional
from src.infrastructure.api.routes.admin import require_superadmin, get_current_user_role
from typing import List, Optional

router = APIRouter(prefix="/pipelines", tags=["Pipelines"])

@router.get("/", response_model=List[PipelineReadDTO])
def list_pipelines(db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.list_pipelines(workspace_id)

# IMPORTANTE: Esta rota deve vir ANTES de /{pipeline_id} para evitar conflito de path params
@router.get("/templates", response_model=List[PipelineReadDTO])
def list_pipeline_templates(source_type_id: int, db: Session = Depends(get_db)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.list_templates(source_type_id)

@router.get("/{pipeline_id}", response_model=PipelineReadDTO)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    pipeline = use_case.get_pipeline(pipeline_id, workspace_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return pipeline

@router.post("/import", response_model=PipelineReadDTO)
def import_pipeline(dto: PipelineImportDTO, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.import_from_template(dto.template_id, workspace_id, dto.target_type_id)

@router.post("/", response_model=PipelineReadDTO, status_code=status.HTTP_201_CREATED)
def create_pipeline(
    dto: PipelineCreateDTO, 
    db: Session = Depends(get_db), 
    workspace_id_header: Optional[int] = Depends(get_workspace_id_optional), 
    team_id: Optional[int] = Depends(get_team_id_optional),
    role: str = Depends(get_current_user_role)
):
    # Prioriza o workspace_id do DTO se ele for explicitamente enviado (mesmo que seja None)
    # No entanto, como o Pydantic default é None, precisamos saber se o usuário enviou None ou se é o default.
    # Para simplificar: se o usuário estiver na tela de Admin e enviar workspace_id: null, o DTO terá None.
    # Se ele estiver em um workspace normal, o header terá o valor.
    
    # Lógica: se o header existe e o DTO não enviou nada (ou enviou o mesmo), usamos o header.
    # Se o DTO enviou None explicitamente (ou o campo existe no body), e o usuário é superadmin, permitimos.
    
    final_workspace_id = workspace_id_header
    
    # Se o DTO tem um workspace_id (incluindo None se enviado)
    # Aqui vamos simplificar: se for superadmin e o DTO não tiver workspace_id ou for None, tratamos como global.
    # Mas queremos permitir que superadmins criem pipelines locais também.
    
    if role == "superadmin":
        # Se superadmin, ele manda no workspace_id do DTO
        final_workspace_id = dto.workspace_id
    else:
        # Se não for superadmin, ele OBRIGATORIAMENTE usa o workspace_id do header
        if workspace_id_header is None:
            raise HTTPException(status_code=401, detail="Header X-Workspace-ID é obrigatório")
        final_workspace_id = workspace_id_header

    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    return use_case.create_pipeline(dto, final_workspace_id, team_id)

@router.put("/{pipeline_id}")
def update_pipeline(
    pipeline_id: int, 
    dto: PipelineUpdateDTO, 
    db: Session = Depends(get_db), 
    workspace_id_header: Optional[int] = Depends(get_workspace_id_optional),
    role: str = Depends(get_current_user_role)
):
    from src.infrastructure.database.models import PipelineModel
    pipeline_record = db.query(PipelineModel).filter(PipelineModel.id == pipeline_id).first()
    if not pipeline_record:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
        
    final_workspace_id = workspace_id_header
    if pipeline_record.workspace_id is None:
        if role != "superadmin":
            raise HTTPException(status_code=403, detail="Sem permissão")
        final_workspace_id = None

    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.update_pipeline(pipeline_id, dto, final_workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return {"message": "Pipeline atualizada com sucesso"}

@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline(
    pipeline_id: int, 
    db: Session = Depends(get_db), 
    workspace_id_header: Optional[int] = Depends(get_workspace_id_optional),
    role: str = Depends(get_current_user_role)
):
    from src.infrastructure.database.models import PipelineModel
    pipeline_record = db.query(PipelineModel).filter(PipelineModel.id == pipeline_id).first()
    if not pipeline_record:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")

    final_workspace_id = workspace_id_header
    if pipeline_record.workspace_id is None:
        if role != "superadmin":
            raise HTTPException(status_code=403, detail="Sem permissão")
        final_workspace_id = None

    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.delete_pipeline(pipeline_id, final_workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")
    return None

@router.post("/move")
def move_entity(dto: EntityMoveDTO, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    repository = SqlAlchemyPipelineRepository(db)
    use_case = PipelineUseCases(repository)
    success = use_case.move_entity(dto.type_id, dto.entity_id, dto.stage_id, workspace_id)
    if not success:
        raise HTTPException(status_code=400, detail="Erro ao mover entidade. Verifique se o estágio e a entidade existem e pertencem à sua Área de Trabalho.")
    return {"message": "Entidade movida com sucesso"}
