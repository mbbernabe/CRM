from src.domain.repositories.workspace_repository import IWorkspaceRepository
from src.domain.entities.workspace import Workspace
from src.application.dtos.workspace_dto import WorkspaceUpdateDTO
from src.domain.exceptions.base_exceptions import DomainException

class GetWorkspaceUseCase:
    def __init__(self, workspace_repo: IWorkspaceRepository):
        self.workspace_repo = workspace_repo

    def execute(self, workspace_id: int) -> Workspace:
        workspace = self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise DomainException("Área de trabalho não encontrada.")
        return workspace

class UpdateWorkspaceUseCase:
    def __init__(self, workspace_repo: IWorkspaceRepository):
        self.workspace_repo = workspace_repo

    def execute(self, workspace_id: int, data: WorkspaceUpdateDTO) -> Workspace:
        workspace = self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise DomainException("Área de trabalho não encontrada.")
        
        if data.name is not None:
            workspace.name = data.name
        if data.description is not None:
            workspace.description = data.description
        if data.logo_url is not None:
            workspace.logo_url = data.logo_url
        if data.primary_color is not None:
            workspace.primary_color = data.primary_color
        if data.accent_color is not None:
            workspace.accent_color = data.accent_color
        if data.invitation_expiry_days is not None:
            workspace.invitation_expiry_days = data.invitation_expiry_days
            
        return self.workspace_repo.save(workspace)
