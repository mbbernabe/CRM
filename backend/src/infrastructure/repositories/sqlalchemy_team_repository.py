from typing import Optional, List
from sqlalchemy.orm import Session
from src.domain.entities.team import Team
from src.infrastructure.database.models import TeamModel
from src.domain.repositories.team_repository import ITeamRepository

class SqlAlchemyTeamRepository(ITeamRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, team_id: int) -> Optional[Team]:
        model = self.db.query(TeamModel).filter(TeamModel.id == team_id).first()
        if not model:
            return None
        return Team(id=model.id, name=model.name, created_at=model.created_at)

    def save(self, team: Team) -> Team:
        if team.id:
            model = self.db.query(TeamModel).filter(TeamModel.id == team.id).first()
            if model:
                model.name = team.name
        else:
            model = TeamModel(name=team.name)
            self.db.add(model)
        
        self.db.commit()
        self.db.refresh(model)
        team.id = model.id
        team.created_at = model.created_at
        return team

    def get_by_invite_code(self, code: str) -> Optional[Team]:
        # Para simplificar, assumimos que o código é o ID do time por enquanto
        try:
            team_id = int(code)
            return self.get_by_id(team_id)
        except ValueError:
            return None
