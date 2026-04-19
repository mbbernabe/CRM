from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.infrastructure.database.models import WorkspaceInvitationModel, WorkspaceModel, UserModel, TeamModel
from src.domain.entities.invitation import WorkspaceInvitation


class InvitationRepository:
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: WorkspaceInvitationModel) -> WorkspaceInvitation:
        invitation = WorkspaceInvitation(
            id=model.id,
            email=model.email,
            token=model.token,
            workspace_id=model.workspace_id,
            role=model.role,
            team_id=model.team_id,
            invited_by=model.invited_by,
            expires_at=model.expires_at,
            accepted_at=model.accepted_at,
            created_at=model.created_at,
        )
        if model.workspace:
            invitation.workspace_name = model.workspace.name
        if model.inviter:
            invitation.inviter_name = model.inviter.name
        if model.team:
            invitation.team_name = model.team.name
        return invitation

    def create(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        model = WorkspaceInvitationModel(
            email=invitation.email,
            token=invitation.token,
            workspace_id=invitation.workspace_id,
            role=invitation.role,
            team_id=invitation.team_id,
            invited_by=invitation.invited_by,
            expires_at=invitation.expires_at,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._to_entity(model)

    def get_by_token(self, token: str) -> Optional[WorkspaceInvitation]:
        model = (
            self.db.query(WorkspaceInvitationModel)
            .options(
                joinedload(WorkspaceInvitationModel.workspace),
                joinedload(WorkspaceInvitationModel.inviter),
                joinedload(WorkspaceInvitationModel.team),
            )
            .filter(WorkspaceInvitationModel.token == token)
            .first()
        )
        return self._to_entity(model) if model else None

    def list_by_workspace(self, workspace_id: int) -> List[WorkspaceInvitation]:
        models = (
            self.db.query(WorkspaceInvitationModel)
            .options(
                joinedload(WorkspaceInvitationModel.workspace),
                joinedload(WorkspaceInvitationModel.inviter),
                joinedload(WorkspaceInvitationModel.team),
            )
            .filter(WorkspaceInvitationModel.workspace_id == workspace_id)
            .order_by(WorkspaceInvitationModel.created_at.desc())
            .all()
        )
        return [self._to_entity(m) for m in models]

    def mark_accepted(self, token: str) -> bool:
        model = (
            self.db.query(WorkspaceInvitationModel)
            .filter(WorkspaceInvitationModel.token == token)
            .first()
        )
        if model:
            model.accepted_at = datetime.utcnow()
            self.db.commit()
            return True
        return False

    def delete(self, invitation_id: int, workspace_id: int) -> bool:
        model = (
            self.db.query(WorkspaceInvitationModel)
            .filter(
                WorkspaceInvitationModel.id == invitation_id,
                WorkspaceInvitationModel.workspace_id == workspace_id,
            )
            .first()
        )
        if model:
            self.db.delete(model)
            self.db.commit()
            return True
        return False
