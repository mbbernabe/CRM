from typing import Optional
from src.domain.repositories.user_repository import IUserRepository
from src.application.dtos.user_dto import UserUpdateDTO, ChangePasswordDTO, UserReadDTO
from src.infrastructure.security.auth_utils import SecurityUtils
from src.domain.exceptions.base_exceptions import DomainException

class UpdateProfileUseCase:
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def execute(self, user_id: int, data: UserUpdateDTO) -> UserReadDTO:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise DomainException("Usuário não encontrado")

        if data.name is not None:
            user.name = data.name
        if data.phone is not None:
            user.phone = data.phone
        if data.position is not None:
            user.position = data.position
        if data.avatar_url is not None:
            user.avatar_url = data.avatar_url

        updated_user = self.user_repo.save(user)
        return UserReadDTO.model_validate(updated_user)

class ChangePasswordUseCase:
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def execute(self, user_id: int, data: ChangePasswordDTO) -> bool:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise DomainException("Usuário não encontrado")

        # Verifica senha atual
        if not SecurityUtils.verify_password(data.current_password, user.password):
            raise DomainException("Senha atual incorreta")

        # Atualiza para nova senha
        user.password = SecurityUtils.hash_password(data.new_password)
        self.user_repo.save(user)
        return True
