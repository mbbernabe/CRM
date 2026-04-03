from typing import List, Optional, Protocol
from src.domain.entities.contact import Contact

class IContactRepository(Protocol):
    def list_all(self, team_id: int) -> List[Contact]:
        """Recupera todos os contatos de um time específico."""
        ...
    
    def get_by_id(self, contact_id: int, team_id: int) -> Optional[Contact]:
        """Recupera um contato pelo ID dentro de um time."""
        ...
    
    def save(self, contact: Contact, team_id: int, company_ids: Optional[List[int]] = None) -> Contact:
        """Salva um novo contato para um time."""
        ...

    def update(self, contact: Contact, team_id: int) -> Contact:
        """Atualiza um contato existente garantindo o vínculo com o time."""
        ...

    def delete(self, contact_id: int, team_id: int) -> bool:
        """Remove um contato pelo ID dentro de um time."""
        ...
        
    def link_company(self, contact_id: int, company_id: int, team_id: int) -> bool:
        """Vincula um contato a uma empresa dentro de um time."""
        ...
        
    def unlink_company(self, contact_id: int, company_id: int, team_id: int) -> bool:
        """Desvincula um contato de uma empresa dentro de um time."""
        ...
