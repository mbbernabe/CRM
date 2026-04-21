from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from src.domain.entities.user import Membership
from src.infrastructure.database.models import MembershipModel

class SqlAlchemyMembershipRepository:
    def __init__(self, db: Session):
        self.db = db

    def _map_to_domain(self, model: MembershipModel) -> Membership:
        return Membership(
            id=model.id,
            user_id=model.user_id,
            workspace_id=model.workspace_id,
            team_id=model.team_id,
            role=model.role,
            is_active=model.is_active,
            joined_at=model.joined_at,
            workspace_name=model.workspace.name if model.workspace else None,
            team_name=model.team.name if model.team else None,
            primary_color=model.workspace.primary_color if model.workspace else None
        )

    def get_by_user_and_workspace(self, user_id: int, workspace_id: int) -> Optional[Membership]:
        model = self.db.query(MembershipModel).filter(
            MembershipModel.user_id == user_id,
            MembershipModel.workspace_id == workspace_id
        ).first()
        if not model:
            return None
        return self._map_to_domain(model)

    def list_by_user(self, user_id: int) -> List[Membership]:
        models = self.db.query(MembershipModel).options(
            joinedload(MembershipModel.workspace),
            joinedload(MembershipModel.team)
        ).filter(MembershipModel.user_id == user_id).all()
        return [self._map_to_domain(m) for m in models]

    def create(self, membership: Membership) -> Membership:
        model = MembershipModel(
            user_id=membership.user_id,
            workspace_id=membership.workspace_id,
            team_id=membership.team_id,
            role=membership.role,
            is_active=membership.is_active,
            joined_at=membership.joined_at
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._map_to_domain(model)

    def update(self, membership: Membership) -> Membership:
        model = self.db.query(MembershipModel).filter(MembershipModel.id == membership.id).first()
        if model:
            model.team_id = membership.team_id
            model.role = membership.role
            model.is_active = membership.is_active
            self.db.commit()
            self.db.refresh(model)
        return self._map_to_domain(model)

    def delete(self, membership_id: int):
        model = self.db.query(MembershipModel).filter(MembershipModel.id == membership_id).first()
        if model:
            self.db.delete(model)
            self.db.commit()
