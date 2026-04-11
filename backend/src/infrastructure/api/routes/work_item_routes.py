from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.api.dependencies import get_workspace_id, get_user_id_optional
from src.infrastructure.repositories.work_item_repository import WorkItemRepository
from src.infrastructure.repositories.work_item_history_repository import WorkItemHistoryRepository
from src.infrastructure.repositories.sqlalchemy_pipeline_repository import SqlAlchemyPipelineRepository as PipelineRepository
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository as UserRepository
from src.application.use_cases.work_item.create_work_item import CreateWorkItemUseCase
from src.application.use_cases.work_item.move_work_item import MoveWorkItemUseCase
from src.application.use_cases.work_item.get_pipeline_board import GetPipelineBoardUseCase
from src.application.use_cases.work_item.manage_item_types import ManageItemTypesUseCase
from src.application.use_cases.work_item.update_work_item import UpdateWorkItemUseCase
from src.application.use_cases.work_item.delete_work_item import DeleteWorkItemUseCase
from src.application.use_cases.work_item.manage_work_item_history import ManageWorkItemHistoryUseCase
from src.application.dtos.work_item_dto import WorkItemTypeReadDTO, WorkItemTypeCreateDTO, WorkItemTypeUpdateDTO, WorkItemHistoryReadDTO, WorkItemNoteCreateDTO, CustomFieldDefinitionDTO
from typing import Dict, Any, Optional, List

router = APIRouter(prefix="/workitems", tags=["WorkItems"])

# Dependency Injection Helper for Use Cases
def get_history_use_case(db: Session = Depends(get_db)):
    return ManageWorkItemHistoryUseCase(WorkItemHistoryRepository(db), WorkItemRepository(db))

def get_create_use_case(db: Session = Depends(get_db)):
    return CreateWorkItemUseCase(WorkItemRepository(db), WorkItemHistoryRepository(db))

def get_move_use_case(db: Session = Depends(get_db)):
    return MoveWorkItemUseCase(WorkItemRepository(db), WorkItemHistoryRepository(db), PipelineRepository(db))

def get_board_use_case(db: Session = Depends(get_db)):
    return GetPipelineBoardUseCase(WorkItemRepository(db), PipelineRepository(db))

def get_update_use_case(db: Session = Depends(get_db)):
    return UpdateWorkItemUseCase(WorkItemRepository(db), WorkItemHistoryRepository(db), UserRepository(db))

def get_delete_use_case(db: Session = Depends(get_db)):
    return DeleteWorkItemUseCase(WorkItemRepository(db), WorkItemHistoryRepository(db))

@router.post("")
def create_work_item(
    payload: Dict[str, Any] = Body(...),
    workspace_id: int = Depends(get_workspace_id),
    user_id: Optional[int] = Depends(get_user_id_optional),
    use_case: CreateWorkItemUseCase = Depends(get_create_use_case)
):
    try:
        return use_case.execute(
            title=payload["title"],
            pipeline_id=payload["pipeline_id"],
            stage_id=payload["stage_id"],
            type_id=payload["type_id"],
            workspace_id=workspace_id,
            description=payload.get("description"),
            custom_fields=payload.get("custom_fields"),
            user_id=payload.get("owner_id") or user_id # Use explicit owner or current user
        )
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Campo obrigatório ausente: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/board/{pipeline_id}")
def get_board(
    pipeline_id: int,
    workspace_id: int = Depends(get_workspace_id),
    use_case: GetPipelineBoardUseCase = Depends(get_board_use_case)
):
    try:
        return use_case.execute(pipeline_id, workspace_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{item_id}/move")
def move_item(
    item_id: int,
    payload: Dict[str, Any] = Body(...),
    workspace_id: int = Depends(get_workspace_id),
    user_id: Optional[int] = Depends(get_user_id_optional),
    use_case: MoveWorkItemUseCase = Depends(get_move_use_case)
):
    try:
        return use_case.execute(
            workitem_id=item_id,
            to_stage_id=payload["to_stage_id"],
            workspace_id=workspace_id,
            user_id=user_id,
            notes=payload.get("notes")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{item_id}")
def update_item(
    item_id: int,
    payload: Dict[str, Any] = Body(...),
    workspace_id: int = Depends(get_workspace_id),
    user_id: Optional[int] = Depends(get_user_id_optional),
    use_case: UpdateWorkItemUseCase = Depends(get_update_use_case)
):
    try:
        # Normalização de atribuição: 
        # "" -> Mandar o ID de quem está logado (Atribuir a mim)
        # 0 ou "0" -> Mandar None (Sem dono)
        raw_owner = payload.get("owner_id")
        final_owner = raw_owner
        
        if raw_owner == "":
            final_owner = user_id
        elif raw_owner == 0 or raw_owner == "0":
            final_owner = None
        elif isinstance(raw_owner, str) and raw_owner.isdigit():
            final_owner = int(raw_owner)

        return use_case.execute(
            work_item_id=item_id,
            workspace_id=workspace_id,
            title=payload.get("title"),
            description=payload.get("description"),
            type_id=payload.get("type_id"),
            custom_fields=payload.get("custom_fields"),
            owner_id=final_owner,
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    workspace_id: int = Depends(get_workspace_id),
    user_id: Optional[int] = Depends(get_user_id_optional),
    use_case: DeleteWorkItemUseCase = Depends(get_delete_use_case)
):
    try:
        success = use_case.execute(item_id, workspace_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Item não encontrado")
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/types/{type_id}/items", response_model=List[Dict[str, Any]])
def list_items_by_type(
    type_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    repo = WorkItemRepository(db)
    items = repo.list_by_type(type_id, workspace_id)
    return [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "type_id": item.type_id,
            "custom_fields": item.custom_fields,
            "pipeline_id": item.pipeline_id,
            "stage_id": item.stage_id,
            "workspace_id": item.workspace_id,
            "owner_id": item.owner_id
        } for item in items
    ]
@router.get("/types", response_model=List[WorkItemTypeReadDTO])
def list_types(
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    return use_case.list_types(workspace_id)

@router.post("/types", response_model=WorkItemTypeReadDTO)
def create_type(
    dto: WorkItemTypeCreateDTO,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    try:
        return use_case.create_type(dto, workspace_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/types/{type_id}", response_model=WorkItemTypeReadDTO)
def update_type(
    type_id: int,
    dto: WorkItemTypeUpdateDTO,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    updated = use_case.update_type(type_id, dto, workspace_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Tipo de objeto não encontrado")
    return updated

@router.delete("/types/{type_id}", status_code=204)
def delete_type(
    type_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    try:
        success = use_case.delete_type(type_id, workspace_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tipo de objeto não encontrado")
        return None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{item_id}/history", response_model=List[WorkItemHistoryReadDTO])
def get_workitem_history(
    item_id: int,
    workspace_id: int = Depends(get_workspace_id),
    use_case: ManageWorkItemHistoryUseCase = Depends(get_history_use_case)
):
    try:
        return use_case.get_history(item_id, workspace_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{item_id}/notes", response_model=WorkItemHistoryReadDTO)
def add_workitem_note(
    item_id: int,
    dto: WorkItemNoteCreateDTO,
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    use_case: ManageWorkItemHistoryUseCase = Depends(get_history_use_case)
):
    try:
        return use_case.add_note(item_id, workspace_id, user_id, dto.notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/templates", response_model=List[WorkItemTypeReadDTO])
def list_templates(
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    """Lista todos os modelos de tipos de objetos globais disponíveis na biblioteca."""
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    return use_case.list_templates(workspace_id)

@router.post("/import-template/{template_id}", response_model=WorkItemTypeReadDTO)
def import_template(
    template_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    """Importa (clona) um modelo global para o workspace atual."""
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    try:
        return use_case.import_template(template_id, workspace_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/types/{type_id}/suggested-fields", response_model=List[CustomFieldDefinitionDTO])
def list_suggested_fields(
    type_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    """Lista campos da biblioteca global que podem ser adicionados a este tipo de objeto."""
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    return use_case.list_suggested_fields(type_id, workspace_id)

@router.post("/types/{type_id}/import-field/{global_field_id}", response_model=CustomFieldDefinitionDTO)
def import_global_field(
    type_id: int,
    global_field_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    """Importa um campo específico do modelo global para o tipo local."""
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    try:
        return use_case.import_global_field(global_field_id, type_id, workspace_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/types/{type_id}/updates")
def check_for_updates(
    type_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    """Verifica se há atualizações disponíveis no modelo global original."""
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    return use_case.check_for_updates(type_id, workspace_id)

@router.post("/types/{type_id}/sync")
def sync_from_global(
    type_id: int,
    payload: Dict[str, Any] = Body(...),
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    """Aplica manualmente as atualizações selecionadas do modelo global."""
    use_case = ManageItemTypesUseCase(WorkItemRepository(db))
    source_field_ids = payload.get("source_field_ids", [])
    if not source_field_ids:
        raise HTTPException(status_code=400, detail="Nenhum campo selecionado para sincronização")
    
    success = use_case.sync_from_global(type_id, source_field_ids, workspace_id)
    if not success:
        raise HTTPException(status_code=400, detail="Falha ao sincronizar com o modelo global")
        
    return {"message": "Sincronização concluída com sucesso"}
