from typing import Optional, List, Protocol
from src.domain.entities.team import Team

class ITeamRepository(Protocol):
    def get_by_id(self, team_id: int) -> Optional[Team]:
        ...
        
    def save(self, team: Team) -> Team:
        ...

    def list_by_workspace(self, workspace_id: int) -> List[Team]:
        ...
        
    def get_by_invite_code(self, code: str) -> Optional[Team]:
        ...

    def delete(self, team_id: int) -> bool:
        ...
