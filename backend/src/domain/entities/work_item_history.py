from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class WorkItemHistory:
    id: Optional[int] = None
    workitem_id: int = 0
    from_stage_id: Optional[int] = None
    to_stage_id: int = 0
    changed_at: datetime = field(default_factory=datetime.utcnow)
    changed_by: Optional[int] = None # User ID who moved the item
    workspace_id: Optional[int] = None
    notes: Optional[str] = None # Optional notes about the move
    changed_by_name: Optional[str] = None
    from_stage_name: Optional[str] = None
    to_stage_name: Optional[str] = None

class IWorkItemHistoryRepository:
    def create(self, history: WorkItemHistory) -> WorkItemHistory:
        raise NotImplementedError

    def list_by_workitem(self, workitem_id: int, workspace_id: int) -> list[WorkItemHistory]:
        raise NotImplementedError
