from typing import Optional
from src.domain.entities.contact import Contact
from src.domain.repositories.contact_repository import IContactRepository
from src.application.dtos.contact_dto import ContactCreateDTO, ContactReadDTO

class CreateContactUseCase:
    def __init__(self, contact_repository: IContactRepository):
        self.contact_repository = contact_repository

    def execute(self, contact_dto: ContactCreateDTO, workspace_id: int, team_id: Optional[int] = None) -> ContactReadDTO:
        contact = Contact(
            name=contact_dto.name,
            email=contact_dto.email,
            phone=contact_dto.phone,
            status=contact_dto.status,
            properties=contact_dto.properties,
            workspace_id=workspace_id,
            team_id=team_id
        )
        saved_contact = self.contact_repository.save(contact, workspace_id, contact_dto.company_ids)
        return ContactReadDTO.model_validate(saved_contact)
