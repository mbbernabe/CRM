from typing import Optional, Protocol, List
from src.domain.entities.user import User

class IUserRepository(Protocol):
    def get_by_email(self, email: str) -> Optional[User]:
        ...
    
    def save(self, user: User) -> User:
        ...
        
    def get_by_id(self, user_id: int) -> Optional[User]:
        ...

    def list_all(self, workspace_id: Optional[int] = None) -> List[User]:
        ...
    def count(self, workspace_id: Optional[int] = None) -> int:
        ...
