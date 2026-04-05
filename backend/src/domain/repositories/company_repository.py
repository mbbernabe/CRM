from typing import List, Optional, Protocol
from src.domain.entities.company import Company

class ICompanyRepository(Protocol):
    def list_all(self, workspace_id: int) -> List[Company]:
        ...
    
    def get_by_id(self, company_id: int, workspace_id: int) -> Optional[Company]:
        ...
    
    def save(self, company: Company, workspace_id: int, contact_ids: Optional[List[int]] = None) -> Company:
        ...

    def update(self, company: Company, workspace_id: int) -> Company:
        ...

    def delete(self, company_id: int, workspace_id: int) -> bool:
        ...

    def link_contact(self, company_id: int, contact_id: int, workspace_id: int) -> bool:
        ...

    def unlink_contact(self, company_id: int, contact_id: int, workspace_id: int) -> bool:
        ...
