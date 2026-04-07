import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from src.domain.entities.invitation import WorkspaceInvitation
from src.infrastructure.repositories.invitation_repository import InvitationRepository
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository
from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
from src.infrastructure.repositories.sqlalchemy_settings_repository import SqlAlchemySettingsRepository
from src.infrastructure.services.email_service import EmailService
from src.infrastructure.security.auth_utils import SecurityUtils
from src.domain.entities.user import User


class SendInvitationUseCase:
    def __init__(
        self,
        invitation_repo: InvitationRepository,
        user_repo: SqlAlchemyUserRepository,
        workspace_repo: SqlAlchemyWorkspaceRepository,
        settings_repo: SqlAlchemySettingsRepository,
    ):
        self.invitation_repo = invitation_repo
        self.user_repo = user_repo
        self.workspace_repo = workspace_repo
        self.settings_repo = settings_repo

    def execute(
        self,
        workspace_id: int,
        invited_by: int,
        email: str,
        role: str = "user",
        team_id: Optional[int] = None,
    ) -> WorkspaceInvitation:
        # 1. Check if user already a member
        existing = self.user_repo.get_by_email(email)
        if existing and existing.workspace_id == workspace_id:
            raise ValueError(f"O e-mail '{email}' já é membro desta área de trabalho.")

        # 2. Get workspace to determine expiry
        workspace = self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise ValueError("Área de trabalho não encontrada.")

        expiry_days = getattr(workspace, "invitation_expiry_days", 7) or 7
        expires_at = datetime.utcnow() + timedelta(days=expiry_days)

        # 3. Create invitation token
        token = str(uuid.uuid4())

        invitation = WorkspaceInvitation(
            email=email,
            token=token,
            workspace_id=workspace_id,
            role=role,
            team_id=team_id,
            invited_by=invited_by,
            expires_at=expires_at,
        )
        saved = self.invitation_repo.create(invitation)

        # 4. Get inviter name
        inviter = self.user_repo.get_by_id(invited_by)
        inviter_name = inviter.name if inviter else "Administrador"

        # 5. Build link and send email
        settings = self.settings_repo.get_all_as_dict()
        base_url = settings.get("reset_link_base_url", "http://localhost:5173")
        invite_link = f"{base_url}/accept-invite?token={token}"

        email_service = EmailService(settings)
        email_service.send_invitation_email(
            to_email=email,
            invite_link=invite_link,
            workspace_name=workspace.name,
            inviter_name=inviter_name,
        )

        return saved


class ValidateInvitationUseCase:
    def __init__(self, invitation_repo: InvitationRepository):
        self.invitation_repo = invitation_repo

    def execute(self, token: str) -> WorkspaceInvitation:
        invitation = self.invitation_repo.get_by_token(token)
        if not invitation:
            raise ValueError("Convite não encontrado ou inválido.")
        if invitation.is_accepted:
            raise ValueError("Este convite já foi aceito.")
        if invitation.is_expired:
            raise ValueError("Este convite expirou. Solicite um novo convite.")
        return invitation


class AcceptInvitationUseCase:
    def __init__(
        self,
        invitation_repo: InvitationRepository,
        user_repo: SqlAlchemyUserRepository,
    ):
        self.invitation_repo = invitation_repo
        self.user_repo = user_repo

    def execute(self, token: str, name: str, password: str) -> User:
        # 1. Validate invitation
        invitation = self.invitation_repo.get_by_token(token)
        if not invitation:
            raise ValueError("Convite não encontrado ou inválido.")
        if invitation.is_accepted:
            raise ValueError("Este convite já foi aceito.")
        if invitation.is_expired:
            raise ValueError("Este convite expirou. Solicite um novo convite.")

        # 2. Check if email already registered
        existing = self.user_repo.get_by_email(invitation.email)
        if existing:
            raise ValueError("Este e-mail já possui uma conta cadastrada. Faça login diretamente.")

        # 3. Create user
        user = User(
            name=name,
            email=invitation.email,
            password=SecurityUtils.hash_password(password),
            workspace_id=invitation.workspace_id,
            team_id=invitation.team_id,
            role=invitation.role,
        )
        saved_user = self.user_repo.save(user)

        # 4. Mark invitation as accepted
        self.invitation_repo.mark_accepted(token)

        return saved_user
