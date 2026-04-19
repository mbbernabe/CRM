from src.domain.entities.work_item import WorkItem, IWorkItemRepository
from src.domain.entities.work_item_history import WorkItemHistory, IWorkItemHistoryRepository
from typing import Dict, Any, Optional

class CreateWorkItemUseCase:
    def __init__(
        self, 
        work_item_repo: IWorkItemRepository,
        history_repo: IWorkItemHistoryRepository
    ):
        self.work_item_repo = work_item_repo
        self.history_repo = history_repo

    def execute(
        self, 
        title: str, 
        pipeline_id: int, 
        stage_id: int, 
        type_id: int, 
        workspace_id: int,
        description: Optional[str] = None,
        custom_fields: Dict[str, Any] = None,
        user_id: Optional[int] = None,
        team_id: Optional[int] = None
    ) -> WorkItem:
        # Create the work item
        work_item = WorkItem(
            title=title,
            description=description,
            pipeline_id=pipeline_id,
            stage_id=stage_id,
            type_id=type_id,
            custom_fields=custom_fields or {},
            workspace_id=workspace_id,
            team_id=team_id,
            owner_id=user_id # Default owner is the creator
        )
        
        created_item = self.work_item_repo.create(work_item)
        
        # Log initial history (creation is moving from "None" to the first stage)
        history = WorkItemHistory(
            workitem_id=created_item.id,
            from_stage_id=None,
            to_stage_id=stage_id,
            changed_by=user_id,
            workspace_id=workspace_id,
            notes="Item criado."
        )
        self.history_repo.create(history)
        
        return created_item
