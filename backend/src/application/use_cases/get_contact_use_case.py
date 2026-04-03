from typing import Optional
from src.domain.repositories.contact_repository import IContactRepository
from src.application.dtos.contact_dto import ContactReadDTO

class GetContactUseCase:
    def __init__(self, contact_repository: IContactRepository):
        self.contact_repository = contact_repository

    def execute(self, contact_id: int, team_id: int) -> Optional[ContactReadDTO]:
        contact = self.contact_repository.get_by_id(contact_id, team_id)
        if not contact:
            return None
        return ContactReadDTO.model_validate(contact)
