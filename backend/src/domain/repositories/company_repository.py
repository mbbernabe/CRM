from typing import List, Optional, Protocol
from src.domain.entities.company import Company

class ICompanyRepository(Protocol):
    def list_all(self, team_id: int) -> List[Company]:
        ...
    
    def get_by_id(self, company_id: int, team_id: int) -> Optional[Company]:
        ...
    
    def save(self, company: Company, team_id: int, contact_ids: Optional[List[int]] = None) -> Company:
        ...

    def update(self, company: Company, team_id: int) -> Company:
        ...

    def delete(self, company_id: int, team_id: int) -> bool:
        ...
