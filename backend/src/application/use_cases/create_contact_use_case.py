from src.domain.repositories.contact_repository import IContactRepository
from src.domain.entities.contact import Contact
from src.application.dtos.contact_dto import ContactCreateDTO, ContactReadDTO

class CreateContactUseCase:
    def __init__(self, repository: IContactRepository):
        self.repository = repository

    def execute(self, contact_dto: ContactCreateDTO) -> ContactReadDTO:
        contact = Contact(
            name=contact_dto.name,
            email=contact_dto.email,
            phone=contact_dto.phone,
            status=contact_dto.status
        )
        saved_contact = self.repository.save(contact)
        return ContactReadDTO.model_validate(saved_contact)
