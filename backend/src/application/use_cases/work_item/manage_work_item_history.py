from typing import List
from src.domain.entities.work_item_history import WorkItemHistory, IWorkItemHistoryRepository
from src.domain.entities.work_item import IWorkItemRepository
from src.application.dtos.work_item_dto import WorkItemHistoryReadDTO

class ManageWorkItemHistoryUseCase:
    def __init__(self, history_repo: IWorkItemHistoryRepository, work_item_repo: IWorkItemRepository):
        self.history_repo = history_repo
        self.work_item_repo = work_item_repo

    def get_history(self, work_item_id: int, workspace_id: int) -> List[WorkItemHistoryReadDTO]:
        # Validate existence and ownership
        item = self.work_item_repo.get_by_id(work_item_id, workspace_id)
        if not item:
            raise ValueError(f"WorkItem {work_item_id} not found in this workspace.")

        history_entities = self.history_repo.list_by_workitem(work_item_id, workspace_id)
        
        # Convert entities to DTOs
        dtos = []
        for h in history_entities:
            dtos.append(WorkItemHistoryReadDTO(
                id=h.id,
                workitem_id=h.workitem_id,
                from_stage_id=h.from_stage_id,
                from_stage_name=h.from_stage_name,
                to_stage_id=h.to_stage_id,
                to_stage_name=h.to_stage_name,
                changed_at=h.changed_at,
                changed_by=h.changed_by,
                changed_by_name=h.changed_by_name,
                notes=h.notes
            ))
        return dtos

    def add_note(self, work_item_id: int, workspace_id: int, user_id: int, notes: str) -> WorkItemHistoryReadDTO:
        item = self.work_item_repo.get_by_id(work_item_id, workspace_id)
        if not item:
            raise ValueError(f"WorkItem {work_item_id} not found in this workspace.")

        if not notes or not notes.strip():
            raise ValueError("Note content cannot be empty.")

        # Create history entry with same stage ID to indicate no movement, just a note
        history = WorkItemHistory(
            workitem_id=work_item_id,
            from_stage_id=item.stage_id,
            to_stage_id=item.stage_id,
            changed_by=user_id,
            workspace_id=workspace_id,
            notes=notes.strip()
        )
        
        saved_entity = self.history_repo.create(history)
        
        # In to_entity we might not have names because we didn't do a join upon creation
        # but the GET endpoint will pull them correctly.
        return WorkItemHistoryReadDTO(
            id=saved_entity.id,
            workitem_id=saved_entity.workitem_id,
            from_stage_id=saved_entity.from_stage_id,
            to_stage_id=saved_entity.to_stage_id,
            changed_at=saved_entity.changed_at,
            changed_by=saved_entity.changed_by,
            notes=saved_entity.notes
        )
