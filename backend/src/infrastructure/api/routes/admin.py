from fastapi import APIRouter, Depends, HTTPException, status, Header, Body
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

from src.infrastructure.repositories.work_item_repository import WorkItemRepository
from src.application.use_cases.work_item.manage_item_types import ManageItemTypesUseCase
from src.application.dtos.work_item_dto import (
    WorkItemTypeReadDTO, WorkItemTypeCreateDTO, WorkItemTypeUpdateDTO
)
from src.domain.entities.work_item import WorkItemType

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

# --- Template Management (Global Library) ---

@router.get("/templates", response_model=List[WorkItemTypeReadDTO])
def list_global_templates(
    db: Session = Depends(get_db),
    admin: str = Depends(require_superadmin)
):
    """Lista todos os modelos globais para gestão do superadmin."""
    repo = WorkItemRepository(db)
    # Passamos 0 ou similar apenas para satisfazer o contrato se necessário, 
    # mas list_system_templates no repo já filtra por workspace_id is NULL.
    # No caso de gestão, queremos todos os NULLs.
    return repo.list_system_templates(workspace_id=0)

@router.post("/templates", response_model=WorkItemTypeReadDTO)
def create_global_template(
    data: WorkItemTypeCreateDTO,
    db: Session = Depends(get_db),
    admin: str = Depends(require_superadmin)
):
    """Cria um novo modelo global (workspace_id = NULL)."""
    repo = WorkItemRepository(db)
    use_case = ManageItemTypesUseCase(repo)
    
    try:
        # Usamos o use case para garantir que campos e grupos sejam salvos atomicamente
        created = use_case.create_type(data, None)
        return created
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/templates/{template_id}", response_model=WorkItemTypeReadDTO)
def update_global_template(
    template_id: int,
    data: WorkItemTypeUpdateDTO,
    db: Session = Depends(get_db),
    admin: str = Depends(require_superadmin)
):
    """Atualiza um modelo global."""
    repo = WorkItemRepository(db)
    # workspace_id=None indica que estamos editando um template global
    updated = repo.update_type(
        type_id=template_id,
        workspace_id=None,
        label=data.label,
        icon=data.icon,
        color=data.color,
        field_definitions=data.field_definitions,
        field_groups=data.field_groups
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    return updated

@router.delete("/templates/{template_id}")
def delete_global_template(
    template_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(require_superadmin)
):
    """Remove um modelo global."""
    repo = WorkItemRepository(db)
    try:
        # Passamos None para deletar especificamente o global
        success = repo.delete_type(template_id, None)
        if not success:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        return {"message": "Template removido com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/templates/{template_id}/import-massive")
def import_massive_fields(
    template_id: int,
    payload: List[dict] = Body(...),
    db: Session = Depends(get_db),
    admin: str = Depends(require_superadmin)
):
    """Permite ao SuperAdmin importar dezenas de campos de uma vez para um modelo global."""
    repo = WorkItemRepository(db)
    use_case = ManageItemTypesUseCase(repo)
    # workspace_id=None para templates globais
    count = use_case.import_massive_fields(template_id, payload, None)
    return {"message": f"{count} campos importados com sucesso", "count": count}
