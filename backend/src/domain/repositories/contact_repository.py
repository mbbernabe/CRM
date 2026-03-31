from typing import List, Optional, Protocol
from src.domain.entities.contact import Contact

class IContactRepository(Protocol):
    def list_all(self) -> List[Contact]:
        """Recupera todos os contatos do CRM."""
        ...
    
    def get_by_id(self, contact_id: int) -> Optional[Contact]:
        """Recupera um contato pelo ID."""
        ...
    
    def save(self, contact: Contact) -> Contact:
        """Salva um novo contato no repositório."""
        ...

    def update(self, contact: Contact) -> Contact:
        """Atualiza um contato existente."""
        ...

    def delete(self, contact_id: int) -> bool:
        """Remove um contato pelo ID."""
        ...
