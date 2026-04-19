from src.domain.entities.work_item import WorkItem, IWorkItemRepository
from src.domain.entities.work_item_history import WorkItemHistory, IWorkItemHistoryRepository
from src.domain.repositories.user_repository import IUserRepository
from typing import Dict, Any, Optional

class UpdateWorkItemUseCase:
    def __init__(
        self, 
        work_item_repo: IWorkItemRepository,
        history_repo: IWorkItemHistoryRepository,
        user_repo: Optional[IUserRepository] = None
    ):
        self.work_item_repo = work_item_repo
        self.history_repo = history_repo
        self.user_repo = user_repo

    def execute(
        self, 
        work_item_id: int, 
        workspace_id: int,
        title: Optional[str] = None, 
        description: Optional[str] = None,
        type_id: Optional[int] = None,
        custom_fields: Optional[Dict[str, Any]] = None,
        owner_id: Optional[int] = None,
        user_id: Optional[int] = None,
        user_role: str = "admin",
        user_team_id: Optional[int] = None
    ) -> WorkItem:
        team_filter = user_team_id if user_role not in ["admin", "super_admin"] else None
        work_item = self.work_item_repo.get_by_id(work_item_id, workspace_id, team_id=team_filter)
        if not work_item:
            raise ValueError("Work item não encontrado ou você não tem permissão para editá-lo.")
            
        # Modificar as propriedades apenas se passadas
        changes = []
        if title is not None and title != work_item.title:
            changes.append(f"Título alterado de '{work_item.title}' para '{title}'")
            work_item.title = title
            
        if description is not None and description != work_item.description:
            changes.append("Descrição alterada")
            work_item.description = description
            
        if type_id is not None and type_id != work_item.type_id:
            changes.append("Tipo do item alterado")
            work_item.type_id = type_id

        if custom_fields is not None:
            work_item.custom_fields = custom_fields
            
        # Normalize owner_id (convert empty 0 or string to None)
        normalized_owner = owner_id
        if normalized_owner == "" or normalized_owner == 0:
            normalized_owner = None
            
        if normalized_owner != work_item.owner_id:
            if normalized_owner is None:
                changes.append("Dono removido (Sem Dono)")
            else:
                owner_name = f"ID {normalized_owner}"
                if self.user_repo:
                    u = self.user_repo.get_by_id(normalized_owner)
                    if u:
                        owner_name = str(u.name) if hasattr(u, "name") else str(u.email)
                changes.append(f"Atribuído para {owner_name}")
            
            work_item.owner_id = normalized_owner
            
        updated_item = self.work_item_repo.update(work_item)
        
        # Só cria registro se houver notas explicativas de mudança
        if changes:
            notes = "Edições realizadas: " + ", ".join(changes)
            history = WorkItemHistory(
                workitem_id=updated_item.id,
                from_stage_id=updated_item.stage_id,
                to_stage_id=updated_item.stage_id,  # Permanece no mesmo estágio num edit padrão
                changed_by=user_id,
                workspace_id=workspace_id,
                notes=notes
            )
            self.history_repo.create(history)
            
        return updated_item
