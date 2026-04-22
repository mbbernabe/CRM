from typing import Optional
from datetime import datetime
from src.domain.entities.user import User, Membership
from src.domain.entities.workspace import Workspace
from src.domain.entities.team import Team
from src.domain.repositories.user_repository import IUserRepository
from src.domain.repositories.team_repository import ITeamRepository
from src.domain.repositories.workspace_repository import IWorkspaceRepository
from src.domain.repositories.pipeline_repository import IPipelineRepository
from src.domain.entities.work_item import IWorkItemRepository
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
        membership_repo: SqlAlchemyMembershipRepository,
        work_item_repo: IWorkItemRepository,
        pipeline_repo: IPipelineRepository
    ):
        self.user_repo = user_repo
        self.team_repo = team_repo
        self.workspace_repo = workspace_repo
        self.membership_repo = membership_repo
        self.work_item_repo = work_item_repo
        self.pipeline_repo = pipeline_repo

    def execute(self, dto: UserCreateDTO) -> (User, Workspace):
        # 1. Verificar se usuário já existe
        if self.user_repo.get_by_email(dto.email):
            raise AuthenticationException("Este e-mail já está em uso. Tente fazer login ou use outro e-mail.")

        # 2. Lógica de Convite de TIME (Opcional)
        invited_ws_id = None
        invited_team_id = None
        if dto.invite_code:
            team = self.team_repo.get_by_invite_code(dto.invite_code)
            if not team:
                raise AuthenticationException("O código de convite informado não é válido.")
            invited_team_id = team.id
            invited_ws_id = team.workspace_id

        # 3. SEMPRE Criar Área Própria/Principal
        ws_name = dto.workspace_name or f"Área de {dto.name.split(' ')[0]}"
        personal_ws = Workspace(name=ws_name)
        personal_ws = self.workspace_repo.save(personal_ws)
        
        personal_team = Team(name="Geral", workspace_id=personal_ws.id)
        personal_team = self.team_repo.save(personal_team)

        # 4. Determinar Role Global e no Workspace
        total_users_count = self.user_repo.count()
        is_first_user = (total_users_count == 0)
        
        # A área de trabalho ativa será a do convite (se houver), senão a pessoal
        active_ws_id = invited_ws_id or personal_ws.id

        # 5. Criar Usuário Identity
        user = User(
            name=dto.name,
            email=dto.email,
            password=SecurityUtils.hash_password(dto.password),
            last_active_workspace_id=active_ws_id
        )
        user = self.user_repo.save(user)

        # 6. Criar Membership na Área Pessoal (Sempre admin ou superadmin)
        personal_role = "superadmin" if is_first_user else "admin"
        personal_membership = Membership(
            user_id=user.id,
            workspace_id=personal_ws.id,
            team_id=personal_team.id,
            role=personal_role
        )
        self.membership_repo.create(personal_membership)
        
        # 7. Criar Membership do Convite (se houver)
        if invited_ws_id:
            invited_membership = Membership(
                user_id=user.id,
                workspace_id=invited_ws_id,
                team_id=invited_team_id,
                role="user"
            )
            self.membership_repo.create(invited_membership)
            user.last_active_membership_id = invited_membership.id
            self.user_repo.save(user)
        else:
            user.last_active_membership_id = personal_membership.id
            self.user_repo.save(user)

        # 8. RF026: Provisionamento Mandatório de Tarefas
        try:
            self._provision_default_tasks(personal_ws.id)
        except Exception as e:
            # Não falha o registro se o provisionamento falhar, mas loga
            print(f"AVISO: Falha ao provisionar tarefas para workspace {personal_ws.id}: {str(e)}")

        return self.user_repo.get_by_id(user.id), self.workspace_repo.get_by_id(active_ws_id)

    def _provision_default_tasks(self, workspace_id: int):
        # 1. Localizar template de Tarefa
        templates = self.work_item_repo.list_system_templates(workspace_id)
        task_template = next((t for t in templates if t.name == "task_template"), None)
        
        if not task_template:
            return

        # 2. Clonar template para o Workspace
        # Nota: clone_type já clonará automaticamente as pipelines globais vinculadas a este template
        self.work_item_repo.clone_type(task_template.id, workspace_id)

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
