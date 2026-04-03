from typing import Optional, List
from sqlalchemy.orm import Session
from src.domain.entities.user import User
from src.domain.entities.team import Team
from src.infrastructure.database.models import UserModel
from src.domain.repositories.user_repository import IUserRepository

class SqlAlchemyUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        model = self.db.query(UserModel).filter(UserModel.email == email).first()
        if not model:
            return None
        return User(
            id=model.id,
            name=model.name,
            email=model.email,
            password=model.password,
            team_id=model.team_id,
            role=model.role,
            created_at=model.created_at
        )

    def save(self, user: User) -> User:
        if user.id:
            model = self.db.query(UserModel).filter(UserModel.id == user.id).first()
            if model:
                model.name = user.name
                model.email = user.email
                model.password = user.password
                model.team_id = user.team_id
        else:
            model = UserModel(
                name=user.name,
                email=user.email,
                password=user.password,
                team_id=user.team_id,
                role=user.role
            )
            self.db.add(model)
        
        self.db.commit()
        self.db.refresh(model)
        user.id = model.id
        user.created_at = model.created_at
        return user

    def list_all(self) -> List[User]:
        models = self.db.query(UserModel).all()
        return [
            User(
                id=m.id, name=m.name, email=m.email, 
                password=m.password, team_id=m.team_id, 
                role=m.role, created_at=m.created_at
            ) for m in models
        ]

    def count(self) -> int:
        return self.db.query(UserModel).count()
