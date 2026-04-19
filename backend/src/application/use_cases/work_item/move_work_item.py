from src.domain.entities.work_item import WorkItem, IWorkItemRepository
from src.domain.entities.work_item_history import WorkItemHistory, IWorkItemHistoryRepository
from typing import Optional, Dict, Any
import json

class MoveWorkItemUseCase:
    def __init__(
        self, 
        work_item_repo: IWorkItemRepository,
        history_repo: IWorkItemHistoryRepository,
        pipeline_repo: Any # To check stage existence and metadata
    ):
        self.work_item_repo = work_item_repo
        self.history_repo = history_repo
        self.pipeline_repo = pipeline_repo

    def execute(
        self, 
        workitem_id: int, 
        to_stage_id: int, 
        workspace_id: int,
        user_id: Optional[int] = None,
        notes: Optional[str] = None,
        user_role: str = "admin",
        user_team_id: Optional[int] = None
    ) -> WorkItem:
        # 1. Fetch current item with team filter
        team_filter = user_team_id if user_role not in ["admin", "super_admin"] else None
        item = self.work_item_repo.get_by_id(workitem_id, workspace_id, team_id=team_filter)
        if not item:
            raise ValueError("WorkItem não encontrado ou você não tem permissão para movê-lo.")

        if item.stage_id == to_stage_id:
            return item # No move needed

        # 2. Fetch destination stage for rule validation
        # Normally pipeline_repo returns PipelineStage entity
        target_stage = self.pipeline_repo.get_stage_by_id(to_stage_id, workspace_id)
        if not target_stage:
            raise ValueError("Estágio de destino inválido.")

        # 3. Complex Rule Validation (Metadata-driven)
        if target_stage.metadata:
            try:
                rules = json.loads(target_stage.metadata)
                self._validate_rules(item, rules)
            except json.JSONDecodeError:
                pass # metadata not a valid JSON, skip

        # 4. Perform move
        from_stage_id = item.stage_id
        item.stage_id = to_stage_id
        
        updated_item = self.work_item_repo.update(item)

        # 5. Log History
        history = WorkItemHistory(
            workitem_id=workitem_id,
            from_stage_id=from_stage_id,
            to_stage_id=to_stage_id,
            changed_by=user_id,
            workspace_id=workspace_id,
            notes=notes or "Mudança de estágio manual."
        )
        self.history_repo.create(history)

        return updated_item

    def _validate_rules(self, item: WorkItem, rules: Dict[str, Any]):
        """
        Example rule structure:
        {
            "required_fields": ["deal_value", "close_date"],
            "min_custom_field_count": 2
        }
        """
        # Validate required fields in custom_fields JSON
        required_fields = rules.get("required_fields", [])
        for field_name in required_fields:
            if field_name not in item.custom_fields or not item.custom_fields[field_name]:
                raise ValueError(f"O campo '{field_name}' é obrigatório para este estágio.")
        
        # Add more complex logic as needed (conditional rules, user role checks, etc.)
        pass
