from typing import List, Optional
from src.domain.entities.team import Team
from src.domain.repositories.team_repository import ITeamRepository
from src.application.dtos.team_dto import TeamCreateDTO
from src.domain.exceptions.base_exceptions import DomainException

class ListTeamsUseCase:
    def __init__(self, team_repo: ITeamRepository):
        self.team_repo = team_repo

    def execute(self, workspace_id: int) -> List[Team]:
        return self.team_repo.list_by_workspace(workspace_id)

class CreateTeamUseCase:
    def __init__(self, team_repo: ITeamRepository):
        self.team_repo = team_repo

    def execute(self, workspace_id: int, dto: TeamCreateDTO) -> Team:
        # 1. Verificar se ja existe time com mesmo nome no workspace
        existing = self.team_repo.list_by_workspace(workspace_id)
        if any(t.name.lower() == dto.name.lower() for t in existing):
            raise DomainException(f"Já existe um time chamado '{dto.name}' nesta área de trabalho.")

        # 2. Criar novo time
        new_team = Team(name=dto.name, workspace_id=workspace_id)
        return self.team_repo.save(new_team)

class DeleteTeamUseCase:
    def __init__(self, team_repo: ITeamRepository):
        self.team_repo = team_repo

    def execute(self, workspace_id: int, team_id: int) -> bool:
        team = self.team_repo.get_by_id(team_id)
        if not team or team.workspace_id != workspace_id:
            raise DomainException("Time não encontrado.")
        
        # Opcional: verificar se há usuários no time 
        # (Para este mvp, vamos delegar a integridade ao BD ou permitir deleção)
        return self.team_repo.delete(team_id)
