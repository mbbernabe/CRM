from typing import List
from src.domain.entities.user import User
from src.domain.repositories.user_repository import IUserRepository

class ListAllUsersUseCase:
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def execute(self) -> List[User]:
        return self.user_repo.list_all()
