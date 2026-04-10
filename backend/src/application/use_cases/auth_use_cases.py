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
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Tentativa de registro com e-mail já existente: {dto.email}")
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
        # (Primeiro usuário do SISTEMA é Superadmin, 
        # Primeiro usuário de um WORKSPACE é Admin)
        total_users_count = self.user_repo.count()
        workspace_users_count = self.user_repo.count(workspace_id)
        
        if total_users_count == 0:
            role = "superadmin"
        elif workspace_users_count == 0:
            role = "admin"
        else:
            role = "user"

        user = User(
            name=dto.name,
            email=dto.email,
            password=SecurityUtils.hash_password(dto.password),
            workspace_id=workspace_id,
            team_id=team_id,
            role=role
        )
        user = self.user_repo.save(user)
        workspace = self.workspace_repo.get_by_id(workspace_id)
        return user, workspace

class LoginUseCase:
    def __init__(self, user_repo: IUserRepository, workspace_repo: IWorkspaceRepository):
        self.user_repo = user_repo
        self.workspace_repo = workspace_repo

    def execute(self, dto: LoginRequestDTO) -> (User, Workspace):
        import logging
        logger = logging.getLogger(__name__)
        
        user = self.user_repo.get_by_email(dto.email)
        if not user:
            logger.warning(f"Tentativa de login: Usuário não encontrado - {dto.email}")
            raise AuthenticationException("E-mail ou senha incorretos. Por favor, tente novamente.")
            
        if not SecurityUtils.verify_password(dto.password, user.password):
            logger.warning(f"Tentativa de login: Senha incorreta para o usuário - {dto.email}")
            raise AuthenticationException("E-mail ou senha incorretos. Por favor, tente novamente.")
        
        logger.info(f"Login bem-sucedido: {dto.email}")
        workspace = self.workspace_repo.get_by_id(user.workspace_id)
        return user, workspace
