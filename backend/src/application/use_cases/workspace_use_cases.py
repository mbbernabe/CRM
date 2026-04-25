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
        if data.invitation_message is not None:
            workspace.invitation_message = data.invitation_message
        if data.smtp_host is not None:
            workspace.smtp_host = data.smtp_host
        if data.smtp_port is not None:
            workspace.smtp_port = data.smtp_port
        if data.smtp_user is not None:
            workspace.smtp_user = data.smtp_user
        if data.smtp_password is not None:
            workspace.smtp_password = data.smtp_password
        if data.smtp_sender_email is not None:
            workspace.smtp_sender_email = data.smtp_sender_email
        if data.smtp_sender_name is not None:
            workspace.smtp_sender_name = data.smtp_sender_name
        if data.smtp_security is not None:
            workspace.smtp_security = data.smtp_security
        if data.lead_api_key is not None:
            workspace.lead_api_key = data.lead_api_key
        if data.lead_pipeline_id is not None:
            workspace.lead_pipeline_id = data.lead_pipeline_id
        if data.lead_stage_id is not None:
            workspace.lead_stage_id = data.lead_stage_id
        if data.lead_type_id is not None:
            workspace.lead_type_id = data.lead_type_id
            
        return self.workspace_repo.save(workspace)

class DeleteWorkspaceUseCase:
    def __init__(self, workspace_repo: IWorkspaceRepository, membership_repo):
        self.workspace_repo = workspace_repo
        self.membership_repo = membership_repo

    def execute(self, user_id: int, workspace_id: int):
        # 1. Verificar se a área de trabalho existe
        workspace = self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise DomainException("Área de trabalho não encontrada.")

        # 2. Verificar se o usuário tem mais de uma área de trabalho
        memberships = self.membership_repo.list_by_user(user_id)
        if len(memberships) <= 1:
            raise DomainException("Você não pode excluir sua única área de trabalho.")

        # 3. Encontrar uma área de trabalho alternativa para redirecionamento
        next_membership = next((m for m in memberships if m.workspace_id != workspace_id), None)
        next_workspace_id = next_membership.workspace_id if next_membership else None

        # 4. Executar a exclusão
        self.workspace_repo.delete(workspace_id)
        
        return next_workspace_id
