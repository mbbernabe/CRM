from typing import List
from src.domain.repositories.contact_repository import IContactRepository
from src.application.dtos.contact_dto import ContactReadDTO

class ListContactsUseCase:
    def __init__(self, contact_repository: IContactRepository):
        self.contact_repository = contact_repository

    def execute(self) -> List[ContactReadDTO]:
        contacts = self.contact_repository.list_all()
        return [ContactReadDTO.model_validate(contact) for contact in contacts]
