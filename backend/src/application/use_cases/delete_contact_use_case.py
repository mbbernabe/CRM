from src.domain.repositories.contact_repository import IContactRepository

class DeleteContactUseCase:
    def __init__(self, repository: IContactRepository):
        self.repository = repository

    def execute(self, contact_id: int) -> bool:
        return self.repository.delete(contact_id)
