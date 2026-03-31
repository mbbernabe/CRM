from typing import Optional
from src.domain.repositories.contact_repository import IContactRepository
from src.application.dtos.contact_dto import ContactUpdateDTO, ContactReadDTO

class UpdateContactUseCase:
    def __init__(self, repository: IContactRepository):
        self.repository = repository

    def execute(self, contact_id: int, contact_dto: ContactUpdateDTO) -> Optional[ContactReadDTO]:
        contact = self.repository.get_by_id(contact_id)
        if not contact:
            return None
        
        # Atualiza apenas os campos fornecidos
        if contact_dto.name is not None:
            contact.name = contact_dto.name
        if contact_dto.email is not None:
            contact.email = contact_dto.email
        if contact_dto.phone is not None:
            contact.phone = contact_dto.phone
        if contact_dto.status is not None:
            contact.status = contact_dto.status

        updated_contact = self.repository.update(contact)
        return ContactReadDTO.model_validate(updated_contact)
