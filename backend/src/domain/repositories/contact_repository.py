from typing import List, Protocol
from src.domain.entities.contact import Contact

class IContactRepository(Protocol):
    def list_all(self) -> List[Contact]:
        """Recupera todos os contatos do CRM."""
        ...
    
    def save(self, contact: Contact) -> Contact:
        """Salva um contato no repositório."""
        ...
