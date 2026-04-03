from typing import Optional
from src.domain.entities.contact import Contact
from src.domain.repositories.contact_repository import IContactRepository
from src.application.dtos.contact_dto import ContactUpdateDTO, ContactReadDTO

class UpdateContactUseCase:
    def __init__(self, contact_repository: IContactRepository):
        self.contact_repository = contact_repository

    def execute(self, contact_id: int, contact_dto: ContactUpdateDTO, team_id: int) -> Optional[ContactReadDTO]:
        existing_contact = self.contact_repository.get_by_id(contact_id, team_id)
        if not existing_contact:
            return None
        
        # Atualiza apenas os campos fornecidos
        if contact_dto.name is not None: existing_contact.name = contact_dto.name
        if contact_dto.email is not None: existing_contact.email = contact_dto.email
        if contact_dto.phone is not None: existing_contact.phone = contact_dto.phone
        if contact_dto.status is not None: existing_contact.status = contact_dto.status
        if contact_dto.properties:
             existing_contact.properties.update(contact_dto.properties)

        updated_contact = self.contact_repository.update(existing_contact, team_id)
        return ContactReadDTO.model_validate(updated_contact)
