from typing import Optional
from src.domain.entities.user import User
from src.domain.entities.workspace import Workspace
from src.domain.entities.team import Team
from src.domain.repositories.user_repository import IUserRepository
from src.domain.repositories.team_repository import ITeamRepository
from src.domain.repositories.workspace_repository import IWorkspaceRepository
from src.domain.repositories.property_repository import IPropertyRepository
from src.application.use_cases.initialize_workspace_properties_use_case import InitializeWorkspacePropertiesUseCase
from src.application.dtos.user_dto import UserCreateDTO, LoginRequestDTO
from src.infrastructure.security.auth_utils import SecurityUtils
from src.domain.exceptions.base_exceptions import AuthenticationException

class RegisterUserUseCase:
    def __init__(
        self, 
        user_repo: IUserRepository, 
        team_repo: ITeamRepository, 
        workspace_repo: IWorkspaceRepository,
        property_repo: IPropertyRepository
    ):
        self.user_repo = user_repo
        self.team_repo = team_repo
        self.workspace_repo = workspace_repo
        self.property_repo = property_repo

    def execute(self, dto: UserCreateDTO) -> User:
        # 1. Verificar se usuário já existe
        if self.user_repo.get_by_email(dto.email):
            raise AuthenticationException("Este e-mail já está em uso. Tente fazer login ou use outro e-mail.")

        workspace_id = None
        team_id = None
        
        # 2. Lógica de Workspace e Time
        if dto.invite_code:
            # Join existing team and workspace
            team = self.team_repo.get_by_invite_code(dto.invite_code)
            if not team:
                raise AuthenticationException("O código de convite informado não é válido. Verifique se digitou corretamente.")
            team_id = team.id
            workspace_id = team.workspace_id
        elif dto.workspace_name or dto.team_name:
            # 2.1 Criar Workspace
            name = dto.workspace_name or dto.team_name # Fallback para retrocompatibilidade
            new_workspace = Workspace(name=name)
            new_workspace = self.workspace_repo.save(new_workspace)
            workspace_id = new_workspace.id
            
            # 2.2 Criar Time Padrão ("Geral")
            new_team = Team(name="Geral", workspace_id=workspace_id)
            new_team = self.team_repo.save(new_team)
            team_id = new_team.id
            
            # 2.3 Inicializar propriedades padrão para o novo Workspace
            InitializeWorkspacePropertiesUseCase(self.property_repo).execute(workspace_id)
        else:
            raise AuthenticationException("Para criar sua conta, precisamos que você informe o nome da sua empresa ou área de trabalho.")

        # 3. Criar Usuário 
        # (Primeiro usuário do Workspace é Admin)
        workspace_users_count = len(self.user_repo.list_all(workspace_id))
        role = "admin" if workspace_users_count == 0 else "user"

        user = User(
            name=dto.name,
            email=dto.email,
            password=SecurityUtils.hash_password(dto.password),
            workspace_id=workspace_id,
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
            raise AuthenticationException("E-mail ou senha incorretos. Por favor, tente novamente.")
        return user
