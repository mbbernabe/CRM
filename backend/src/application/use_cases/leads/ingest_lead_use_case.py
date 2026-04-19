from typing import Dict, Any, Optional
from src.domain.repositories.workspace_repository import IWorkspaceRepository
from src.domain.entities.work_item import IWorkItemRepository, WorkItem
from src.domain.entities.work_item_history import IWorkItemHistoryRepository, WorkItemHistory
from src.domain.exceptions.base_exceptions import DomainException

class IngestLeadUseCase:
    def __init__(
        self,
        workspace_repo: IWorkspaceRepository,
        work_item_repo: IWorkItemRepository,
        history_repo: IWorkItemHistoryRepository
    ):
        self.workspace_repo = workspace_repo
        self.work_item_repo = work_item_repo
        self.history_repo = history_repo

    def execute(self, api_key: str, lead_data: Dict[str, Any]) -> WorkItem:
        # 1. Validate API Key
        workspace = self.workspace_repo.get_by_api_key(api_key)
        if not workspace:
            raise DomainException("API Key inválida.")

        # 2. Ensure lead configuration is set
        if not workspace.lead_pipeline_id or not workspace.lead_stage_id or not workspace.lead_type_id:
            raise DomainException("Configuração de destino de leads não definida para este workspace.")

        # 3. Extract Title
        # Priority: 'title', 'name', 'email'
        title = lead_data.get('title') or lead_data.get('name') or lead_data.get('email')
        if not title:
            title = f"Novo Lead - {workspace.name}"

        # 4. Map Custom Fields
        # We'll put everything in custom_fields for now
        custom_fields = lead_data.copy()
        
        # 5. Create WorkItem
        work_item = WorkItem(
            title=title,
            description=lead_data.get('description') or lead_data.get('message') or "Ingestão via API Pública.",
            pipeline_id=workspace.lead_pipeline_id,
            stage_id=workspace.lead_stage_id,
            type_id=workspace.lead_type_id,
            custom_fields=custom_fields,
            workspace_id=workspace.id,
            team_id=None, # Public leads don't have a team initially
            owner_id=None # Unassigned initially
        )

        created_item = self.work_item_repo.create(work_item)

        # 6. Log History
        history = WorkItemHistory(
            workitem_id=created_item.id,
            from_stage_id=None,
            to_stage_id=workspace.lead_stage_id,
            changed_by=None, # System/Public
            workspace_id=workspace.id,
            notes="Lead ingerido via API Pública."
        )
        self.history_repo.create(history)

        return created_item
