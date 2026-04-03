from src.domain.repositories.contact_repository import IContactRepository

class DeleteContactUseCase:
    def __init__(self, contact_repository: IContactRepository):
        self.contact_repository = contact_repository

    def execute(self, contact_id: int, team_id: int) -> bool:
        return self.contact_repository.delete(contact_id, team_id)
