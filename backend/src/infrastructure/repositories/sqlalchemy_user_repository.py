from typing import Optional, List
from sqlalchemy.orm import Session, joinedload, selectinload
from src.domain.entities.user import User, Membership
from src.infrastructure.database.models import UserModel, MembershipModel, WorkspaceModel, TeamModel
from src.domain.repositories.user_repository import IUserRepository

class SqlAlchemyUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def _map_to_domain(self, model: UserModel) -> User:
        user = User(
            id=model.id,
            name=model.name,
            email=model.email,
            password=model.password,
            last_active_workspace_id=model.last_active_workspace_id,
            last_active_membership_id=model.last_active_membership_id,
            preferences=model.preferences,
            is_active=model.is_active,
            deactivated_at=model.deactivated_at,
            last_activity=model.last_activity,
            created_at=model.created_at
        )
        
        if hasattr(model, 'memberships') and model.memberships:
            user.memberships = [
                Membership(
                    id=m.id,
                    user_id=m.user_id,
                    workspace_id=m.workspace_id,
                    team_id=m.team_id,
                    role=m.role,
                    is_active=m.is_active,
                    joined_at=m.joined_at,
                    workspace_name=m.workspace.name if m.workspace else None,
                    team_name=m.team.name if m.team else None,
                    primary_color=m.workspace.primary_color if m.workspace else None
                ) for m in model.memberships
            ]
        return user

    def get_by_email(self, email: str) -> Optional[User]:
        model = self.db.query(UserModel).options(
            selectinload(UserModel.memberships).joinedload(MembershipModel.workspace),
            selectinload(UserModel.memberships).joinedload(MembershipModel.team)
        ).filter(UserModel.email == email).first()
        if not model:
            return None
        return self._map_to_domain(model)

    def get_by_id(self, user_id: int) -> Optional[User]:
        model = self.db.query(UserModel).options(
            selectinload(UserModel.memberships).joinedload(MembershipModel.workspace),
            selectinload(UserModel.memberships).joinedload(MembershipModel.team)
        ).filter(UserModel.id == user_id).first()
        if not model:
            return None
        return self._map_to_domain(model)

    def save(self, user: User) -> User:
        if user.id:
            model = self.db.query(UserModel).filter(UserModel.id == user.id).first()
            if model:
                model.name = user.name
                model.email = user.email
                model.password = user.password
                model.last_active_workspace_id = user.last_active_workspace_id
                model.last_active_membership_id = user.last_active_membership_id
                model.preferences = user.preferences
                model.is_active = user.is_active
                model.deactivated_at = user.deactivated_at
                model.last_activity = user.last_activity
        else:
            model = UserModel(
                name=user.name,
                email=user.email,
                password=user.password,
                last_active_workspace_id=user.last_active_workspace_id,
                last_active_membership_id=user.last_active_membership_id,
                preferences=user.preferences,
                is_active=user.is_active,
                deactivated_at=user.deactivated_at,
                last_activity=user.last_activity
            )
            self.db.add(model)
        
        self.db.commit()
        self.db.refresh(model)
        user.id = model.id
        user.created_at = model.created_at
        return user

    def list_all(self, workspace_id: Optional[int] = None) -> List[User]:
        if workspace_id is not None:
            # List users that have membership in this workspace
            models = self.db.query(UserModel).join(MembershipModel).filter(
                MembershipModel.workspace_id == workspace_id
            ).options(
                selectinload(UserModel.memberships).joinedload(MembershipModel.workspace),
                selectinload(UserModel.memberships).joinedload(MembershipModel.team)
            ).all()
        else:
            models = self.db.query(UserModel).options(
                selectinload(UserModel.memberships).joinedload(MembershipModel.workspace),
                selectinload(UserModel.memberships).joinedload(MembershipModel.team)
            ).all()
        return [self._map_to_domain(m) for m in models]

    def count(self, workspace_id: Optional[int] = None) -> int:
        query = self.db.query(UserModel)
        if workspace_id is not None:
            query = query.join(MembershipModel).filter(MembershipModel.workspace_id == workspace_id)
        return query.count()
