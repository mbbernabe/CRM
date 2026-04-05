from typing import List, Optional, Protocol
from src.domain.entities.contact import Contact

class IContactRepository(Protocol):
    def list_all(self, workspace_id: int) -> List[Contact]:
        """Recupera todos os contatos de um workspace específico."""
        ...
    
    def get_by_id(self, contact_id: int, workspace_id: int) -> Optional[Contact]:
        """Recupera um contato pelo ID dentro de um workspace."""
        ...
    
    def save(self, contact: Contact, workspace_id: int, company_ids: Optional[List[int]] = None) -> Contact:
        """Salva um novo contato para um workspace."""
        ...

    def update(self, contact: Contact, workspace_id: int) -> Contact:
        """Atualiza um contato existente garantindo o vínculo com o workspace."""
        ...

    def delete(self, contact_id: int, workspace_id: int) -> bool:
        """Remove um contato pelo ID dentro de um workspace."""
        ...
        
    def link_company(self, contact_id: int, company_id: int, workspace_id: int) -> bool:
        """Vincula um contato a uma empresa dentro de um workspace."""
        ...
        
    def unlink_company(self, contact_id: int, company_id: int, workspace_id: int) -> bool:
        """Desvincula um contato de uma empresa dentro de um workspace."""
        ...
