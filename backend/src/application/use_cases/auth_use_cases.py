from typing import Optional
from src.domain.entities.user import User
from src.domain.entities.team import Team
from src.domain.repositories.user_repository import IUserRepository
from src.domain.repositories.team_repository import ITeamRepository
from src.domain.repositories.property_repository import IPropertyRepository
from src.application.use_cases.initialize_team_properties_use_case import InitializeTeamPropertiesUseCase
from src.application.dtos.user_dto import UserCreateDTO, LoginRequestDTO
from src.infrastructure.security.auth_utils import SecurityUtils

class RegisterUserUseCase:
    def __init__(self, user_repo: IUserRepository, team_repo: ITeamRepository, property_repo: IPropertyRepository):
        self.user_repo = user_repo
        self.team_repo = team_repo
        self.property_repo = property_repo

    def execute(self, dto: UserCreateDTO) -> User:
        # 1. Verificar se usuário já existe
        if self.user_repo.get_by_email(dto.email):
            raise ValueError("E-mail já cadastrado")

        team_id = None
        
        # 2. Lógica de Time (conforme especificado pelo Usuário)
        if dto.invite_code:
            # Join existing team
            team = self.team_repo.get_by_invite_code(dto.invite_code)
            if not team:
                raise ValueError("Código de convite inválido")
            team_id = team.id
        elif dto.team_name:
            # Create new team
            new_team = Team(name=dto.team_name)
            new_team = self.team_repo.save(new_team)
            team_id = new_team.id
            
            # Inicializar propriedades padrão para o novo time
            InitializeTeamPropertiesUseCase(self.property_repo).execute(team_id)
        else:
            raise ValueError("Nome do time ou convite é necessário para o cadastro")

        # 3. Criar Usuário (Promover primeiro a Admin se sistema vazio)
        is_first_user = self.user_repo.count() == 0
        role = "admin" if is_first_user else "user"

        user = User(
            name=dto.name,
            email=dto.email,
            password=SecurityUtils.hash_password(dto.password),
            team_id=team_id,
            role=role
        )
        return self.user_repo.save(user)

class LoginUseCase:
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def execute(self, dto: LoginRequestDTO) -> User:
        user = self.user_repo.get_by_email(dto.email)
        if not user or not SecurityUtils.verify_password(dto.password, user.password):
            raise ValueError("Credenciais inválidas")
        return user
