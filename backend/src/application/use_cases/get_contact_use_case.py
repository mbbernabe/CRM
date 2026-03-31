from typing import Optional
from src.domain.repositories.contact_repository import IContactRepository
from src.application.dtos.contact_dto import ContactReadDTO

class GetContactUseCase:
    def __init__(self, repository: IContactRepository):
        self.repository = repository

    def execute(self, contact_id: int) -> Optional[ContactReadDTO]:
        contact = self.repository.get_by_id(contact_id)
        if not contact:
            return None
        return ContactReadDTO.model_validate(contact)
