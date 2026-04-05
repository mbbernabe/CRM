from typing import Optional, Protocol, List
from src.domain.entities.workspace import Workspace

class IWorkspaceRepository(Protocol):
    def get_by_id(self, workspace_id: int) -> Optional[Workspace]:
        ...
        
    def save(self, workspace: Workspace) -> Workspace:
        ...
        
    def list_all(self) -> List[Workspace]:
        ...
