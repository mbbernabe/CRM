from typing import Optional
from datetime import datetime
from src.domain.entities.user import User, Membership
from src.domain.entities.workspace import Workspace
from src.domain.entities.team import Team
from src.domain.repositories.user_repository import IUserRepository
from src.domain.repositories.team_repository import ITeamRepository
from src.domain.repositories.workspace_repository import IWorkspaceRepository
from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository
from src.application.dtos.user_dto import UserCreateDTO, LoginRequestDTO
from src.infrastructure.security.auth_utils import SecurityUtils
from src.domain.exceptions.base_exceptions import AuthenticationException

class RegisterUserUseCase:
    def __init__(
        self, 
        user_repo: IUserRepository, 
        team_repo: ITeamRepository, 
        workspace_repo: IWorkspaceRepository,
        membership_repo: SqlAlchemyMembershipRepository
    ):
        self.user_repo = user_repo
        self.team_repo = team_repo
        self.workspace_repo = workspace_repo
        self.membership_repo = membership_repo

    def execute(self, dto: UserCreateDTO) -> User:
        # 1. Verificar se usuário já existe
        if self.user_repo.get_by_email(dto.email):
            raise AuthenticationException("Este e-mail já está em uso. Tente fazer login ou use outro e-mail.")

        workspace_id = None
        team_id = None
        
        # 2. Lógica de Workspace e Time
        if dto.invite_code:
            team = self.team_repo.get_by_invite_code(dto.invite_code)
            if not team:
                raise AuthenticationException("O código de convite informado não é válido.")
            team_id = team.id
            workspace_id = team.workspace_id
        elif dto.workspace_name or dto.team_name:
            name = dto.workspace_name or dto.team_name
            new_workspace = Workspace(name=name)
            new_workspace = self.workspace_repo.save(new_workspace)
            workspace_id = new_workspace.id
            
            new_team = Team(name="Geral", workspace_id=workspace_id)
            new_team = self.team_repo.save(new_team)
            team_id = new_team.id
        else:
            raise AuthenticationException("Informe o nome da sua empresa.")

        # 3. Determinar Role
        total_users_count = self.user_repo.count()
        if total_users_count == 0:
            role = "superadmin"
        else:
            role = "admin"

        # 4. Criar Usuário Identity
        user = User(
            name=dto.name,
            email=dto.email,
            password=SecurityUtils.hash_password(dto.password),
            last_active_workspace_id=workspace_id
        )
        user = self.user_repo.save(user)

        # 5. Criar Membership
        membership = Membership(
            user_id=user.id,
            workspace_id=workspace_id,
            team_id=team_id,
            role=role
        )
        self.membership_repo.create(membership)
        
        # Reload user with memberships
        return self.user_repo.get_by_id(user.id), self.workspace_repo.get_by_id(workspace_id)

class LoginUseCase:
    def __init__(self, user_repo: IUserRepository, workspace_repo: IWorkspaceRepository):
        self.user_repo = user_repo
        self.workspace_repo = workspace_repo

    def execute(self, dto: LoginRequestDTO) -> (User, Workspace):
        user = self.user_repo.get_by_email(dto.email)
        if not user or not SecurityUtils.verify_password(dto.password, user.password):
            raise AuthenticationException("E-mail ou senha incorretos.")
            
        if not user.is_active:
            raise AuthenticationException(
                "Sua conta está desativada. Entre em contato com o administrador.",
                data={"deactivated_at": user.deactivated_at.isoformat() if user.deactivated_at else None}
            )

        user.last_activity = datetime.utcnow()
        self.user_repo.save(user)
        
        # Determinar qual workspace retornar (preferencialmente a última ativa)
        active_workspace_id = user.last_active_workspace_id
        if not active_workspace_id and user.memberships:
            active_workspace_id = user.memberships[0].workspace_id
            user.last_active_workspace_id = active_workspace_id
            self.user_repo.save(user)
            
        workspace = self.workspace_repo.get_by_id(active_workspace_id) if active_workspace_id else None
        return user, workspace
