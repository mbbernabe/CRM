from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

@dataclass
class WorkItemLink:
    id: Optional[int] = None
    workspace_id: int = 0
    source_item_id: int = 0
    target_item_id: int = 0
    created_at: datetime = datetime.utcnow

class IWorkItemLinkRepository:
    def add_link(self, source_id: int, target_id: int, workspace_id: int) -> bool:
        raise NotImplementedError

    def remove_link(self, source_id: int, target_id: int, workspace_id: int) -> bool:
        raise NotImplementedError

    def list_links(self, work_item_id: int, workspace_id: int) -> List[WorkItemLink]:
        raise NotImplementedError

    def get_linked_items(self, work_item_id: int, workspace_id: int, team_id: Optional[int] = None) -> List[dict]:
        """Returns detailed information about linked items for UI (titles, types, etc.)"""
        raise NotImplementedError
