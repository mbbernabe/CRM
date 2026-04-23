from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.api.dependencies import get_workspace_id, get_user_id_optional, get_current_user
from src.infrastructure.repositories.work_item_repository import WorkItemRepository
from src.infrastructure.repositories.work_item_history_repository import WorkItemHistoryRepository
from src.infrastructure.repositories.work_item_link_repository import SQLAlchemyWorkItemLinkRepository as WorkItemLinkRepository
from src.infrastructure.repositories.sqlalchemy_pipeline_repository import SqlAlchemyPipelineRepository as PipelineRepository
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository as UserRepository
from src.application.use_cases.work_item.create_work_item import CreateWorkItemUseCase
from src.application.use_cases.work_item.move_work_item import MoveWorkItemUseCase
from src.application.use_cases.work_item.get_pipeline_board import GetPipelineBoardUseCase
from src.application.use_cases.work_item.manage_item_types import ManageItemTypesUseCase
from src.application.use_cases.work_item.update_work_item import UpdateWorkItemUseCase
from src.application.use_cases.work_item.delete_work_item import DeleteWorkItemUseCase
from src.application.use_cases.work_item.manage_work_item_history import ManageWorkItemHistoryUseCase
from src.application.use_cases.work_item.manage_work_item_links import ManageWorkItemLinksUseCase
from src.application.use_cases.work_item.task_center_use_case import GetMyTasksUseCase
from src.application.dtos.work_item_dto import (
    WorkItemTypeReadDTO, WorkItemTypeCreateDTO, WorkItemTypeUpdateDTO, 
    WorkItemHistoryReadDTO, WorkItemNoteCreateDTO, CustomFieldDefinitionDTO,
    WorkItemLinkReadDTO, WorkItemLinkCreateDTO
)
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

def get_links_use_case(db: Session = Depends(get_db)):
    return ManageWorkItemLinksUseCase(
        WorkItemLinkRepository(db), 
        WorkItemRepository(db), 
        WorkItemHistoryRepository(db)
    )

def get_my_tasks_use_case(db: Session = Depends(get_db)):
    return GetMyTasksUseCase(WorkItemRepository(db))

@router.post("")
def create_work_item(
    payload: Dict[str, Any] = Body(...),
    workspace_id: int = Depends(get_workspace_id),
    user_id: Optional[int] = Depends(get_user_id_optional),
    current_user: Any = Depends(get_current_user),
    use_case: CreateWorkItemUseCase = Depends(get_create_use_case)
):
    try:
        # Se o usuário não for admin, o item obrigatoriamente pertence ao seu time.
        # Se for admin, usa o team_id do payload (se houver) ou o do próprio admin.
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        
        # Se admin passar um team_id no payload, usa esse. Caso contrário usa o dele ou None.
        target_team_id = payload.get("team_id", team_id) if role in ["admin", "super_admin"] else team_id

        return use_case.execute(
            title=payload["title"],
            pipeline_id=payload["pipeline_id"],
            stage_id=payload["stage_id"],
            type_id=payload["type_id"],
            workspace_id=workspace_id,
            description=payload.get("description"),
            custom_fields=payload.get("custom_fields"),
            user_id=payload.get("owner_id") or user_id,
            team_id=target_team_id,
            recurrence_config=payload.get("recurrence_config")
        )
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Campo obrigatório ausente: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my-tasks")
def get_my_tasks(
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    use_case: GetMyTasksUseCase = Depends(get_my_tasks_use_case)
):
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="Usuário não autenticado")
        return use_case.execute(user_id, workspace_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/board/{pipeline_id}")
def get_board(
    pipeline_id: int,
    workspace_id: int = Depends(get_workspace_id),
    current_user: Any = Depends(get_current_user),
    use_case: GetPipelineBoardUseCase = Depends(get_board_use_case)
):
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        return use_case.execute(pipeline_id, workspace_id, role, team_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{item_id}/move")
def move_item(
    item_id: int,
    payload: Dict[str, Any] = Body(...),
    workspace_id: int = Depends(get_workspace_id),
    user_id: Optional[int] = Depends(get_user_id_optional),
    current_user: Any = Depends(get_current_user),
    use_case: MoveWorkItemUseCase = Depends(get_move_use_case)
):
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        
        return use_case.execute(
            workitem_id=item_id,
            to_stage_id=payload["to_stage_id"],
            workspace_id=workspace_id,
            user_id=user_id,
            notes=payload.get("notes"),
            user_role=role,
            user_team_id=team_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{item_id}")
def update_item(
    item_id: int,
    payload: Dict[str, Any] = Body(...),
    workspace_id: int = Depends(get_workspace_id),
    user_id: Optional[int] = Depends(get_user_id_optional),
    current_user: Any = Depends(get_current_user),
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

        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None

        return use_case.execute(
            work_item_id=item_id,
            workspace_id=workspace_id,
            title=payload.get("title"),
            description=payload.get("description"),
            type_id=payload.get("type_id"),
            custom_fields=payload.get("custom_fields"),
            owner_id=final_owner,
            user_id=user_id,
            user_role=role,
            user_team_id=team_id,
            recurrence_config=payload.get("recurrence_config")
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
    current_user: Any = Depends(get_current_user),
    use_case: DeleteWorkItemUseCase = Depends(get_delete_use_case)
):
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        
        success = use_case.execute(item_id, workspace_id, user_id, user_role=role, user_team_id=team_id)
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
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = WorkItemRepository(db)
    role = current_user.role if current_user else "user"
    team_id = current_user.team_id if current_user else None
    
    # Aplicar filtro de time se não for admin
    team_filter = team_id if role not in ["admin", "super_admin"] else None
    
    items = repo.list_by_type(type_id, workspace_id, team_id=team_filter)
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
@router.get("/search", response_model=List[Dict[str, Any]])
def search_workitems(
    q: str,
    workspace_id: int = Depends(get_workspace_id),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Busca itens pelo título no workspace, filtrado por time se necessário."""
    repo = WorkItemRepository(db)
    role = current_user.role if current_user else "user"
    team_id = current_user.team_id if current_user else None
    
    team_filter = team_id if role not in ["admin", "super_admin"] else None
    
    items = repo.search(q, workspace_id, team_id=team_filter)
    return [
        {
            "id": item.id,
            "title": item.title,
            "type_label": item.type_label
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
    current_user: Any = Depends(get_current_user),
    use_case: ManageWorkItemHistoryUseCase = Depends(get_history_use_case)
):
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        return use_case.get_history(item_id, workspace_id, role, team_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{item_id}/notes", response_model=WorkItemHistoryReadDTO)
def add_workitem_note(
    item_id: int,
    dto: WorkItemNoteCreateDTO,
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    current_user: Any = Depends(get_current_user),
    use_case: ManageWorkItemHistoryUseCase = Depends(get_history_use_case)
):
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        return use_case.add_note(item_id, workspace_id, user_id, dto.notes, role, team_id)
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

@router.get("/{item_id}/links", response_model=List[WorkItemLinkReadDTO])
def list_item_links(
    item_id: int,
    workspace_id: int = Depends(get_workspace_id),
    current_user: Any = Depends(get_current_user),
    use_case: ManageWorkItemLinksUseCase = Depends(get_links_use_case)
):
    """Lista todos os itens vinculados ao item especificado."""
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        return use_case.list_links(item_id, workspace_id, role, team_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{item_id}/links", status_code=201)
def add_item_link(
    item_id: int,
    dto: WorkItemLinkCreateDTO,
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    current_user: Any = Depends(get_current_user),
    use_case: ManageWorkItemLinksUseCase = Depends(get_links_use_case)
):
    """Cria um vínculo bidirecional entre dois itens."""
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        success = use_case.add_link(item_id, dto.target_item_id, workspace_id, user_id, role, team_id)
        if not success:
            raise HTTPException(status_code=400, detail="Não foi possível criar o vínculo")
        return {"message": "Vínculo criado com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{item_id}/links/{target_id}", status_code=204)
def remove_item_link(
    item_id: int,
    target_id: int,
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    current_user: Any = Depends(get_current_user),
    use_case: ManageWorkItemLinksUseCase = Depends(get_links_use_case)
):
    """Remove um vínculo entre dois itens."""
    try:
        role = current_user.role if current_user else "user"
        team_id = current_user.team_id if current_user else None
        success = use_case.remove_link(item_id, target_id, workspace_id, user_id, role, team_id)
        if not success:
            raise HTTPException(status_code=404, detail="Vínculo não encontrado")
        return None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
