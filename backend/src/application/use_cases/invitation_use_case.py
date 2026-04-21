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
from src.domain.entities.user import User, Membership
from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository

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
        # 1. Check if user already a member of THIS workspace
        existing = self.user_repo.get_by_email(email)
        if existing and existing.memberships:
            if any(m.workspace_id == workspace_id for m in existing.memberships):
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
        global_settings = self.settings_repo.get_all_as_dict()
        base_url = global_settings.get("reset_link_base_url", "http://localhost:5173")
        invite_link = f"{base_url}/accept-invite?token={token}"

        # Combine workspace settings with global defaults
        email_settings = global_settings.copy()
        if workspace.smtp_host: email_settings["smtp_host"] = workspace.smtp_host
        if workspace.smtp_port: email_settings["smtp_port"] = str(workspace.smtp_port)
        if workspace.smtp_user: email_settings["smtp_user"] = workspace.smtp_user
        if workspace.smtp_password: email_settings["smtp_password"] = workspace.smtp_password
        if workspace.smtp_sender_email: email_settings["smtp_from"] = workspace.smtp_sender_email
        if workspace.smtp_sender_name: email_settings["smtp_sender_name"] = workspace.smtp_sender_name
        if workspace.smtp_security: email_settings["smtp_security"] = workspace.smtp_security

        email_service = EmailService(email_settings)
        email_service.send_invitation_email(
            to_email=email,
            invite_link=invite_link,
            workspace_name=workspace.name,
            inviter_name=inviter_name,
            custom_message=workspace.invitation_message
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
        membership_repo: SqlAlchemyMembershipRepository
    ):
        self.invitation_repo = invitation_repo
        self.user_repo = user_repo
        self.membership_repo = membership_repo

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
            # 2.1 Just add membership to existing user
            membership = Membership(
                user_id=existing.id,
                workspace_id=invitation.workspace_id,
                team_id=invitation.team_id,
                role=invitation.role
            )
            self.membership_repo.create(membership)
            self.invitation_repo.mark_accepted(token)
            return existing

        # 3. Create new user
        user = User(
            name=name,
            email=invitation.email,
            password=SecurityUtils.hash_password(password),
            last_active_workspace_id=invitation.workspace_id
        )
        saved_user = self.user_repo.save(user)

        # 4. Create membership
        membership = Membership(
            user_id=saved_user.id,
            workspace_id=invitation.workspace_id,
            team_id=invitation.team_id,
            role=invitation.role
        )
        self.membership_repo.create(membership)

        # 5. Mark invitation as accepted
        self.invitation_repo.mark_accepted(token)

        return saved_user
