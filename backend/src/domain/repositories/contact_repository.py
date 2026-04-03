from typing import List, Optional, Protocol
from src.domain.entities.contact import Contact

class IContactRepository(Protocol):
    def list_all(self) -> List[Contact]:
        """Recupera todos os contatos do CRM."""
        ...
    
    def get_by_id(self, contact_id: int) -> Optional[Contact]:
        """Recupera um contato pelo ID."""
        ...
    
    def save(self, contact: Contact, company_ids: Optional[List[int]] = None) -> Contact:
        """Salva um novo contato no repositório."""
        ...

    def update(self, contact: Contact) -> Contact:
        """Atualiza um contato existente."""
        ...

    def delete(self, contact_id: int) -> bool:
        """Remove um contato pelo ID."""
        ...
        
    def link_company(self, contact_id: int, company_id: int) -> bool:
        """Vincula um contato a uma empresa."""
        ...
        
    def unlink_company(self, contact_id: int, company_id: int) -> bool:
        """Desvincula um contato de uma empresa."""
        ...
