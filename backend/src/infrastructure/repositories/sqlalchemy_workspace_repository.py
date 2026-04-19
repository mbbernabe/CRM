from typing import Optional, List
from sqlalchemy.orm import Session
from src.domain.entities.workspace import Workspace
from src.infrastructure.database.models import WorkspaceModel
from src.domain.repositories.workspace_repository import IWorkspaceRepository

class SqlAlchemyWorkspaceRepository(IWorkspaceRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, workspace_id: int) -> Optional[Workspace]:
        model = self.db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
        if not model:
            return None
        return Workspace(
            id=model.id, 
            name=model.name, 
            description=model.description,
            logo_url=model.logo_url,
            primary_color=model.primary_color,
            accent_color=model.accent_color,
            invitation_expiry_days=model.invitation_expiry_days or 7,
            invitation_message=model.invitation_message,
            smtp_host=model.smtp_host,
            smtp_port=model.smtp_port,
            smtp_user=model.smtp_user,
            smtp_password=model.smtp_password,
            smtp_sender_email=model.smtp_sender_email,
            smtp_sender_name=model.smtp_sender_name,
            smtp_security=model.smtp_security or "STARTTLS",
            lead_api_key=model.lead_api_key,
            lead_pipeline_id=model.lead_pipeline_id,
            lead_stage_id=model.lead_stage_id,
            lead_type_id=model.lead_type_id,
            created_at=model.created_at
        )

    def save(self, workspace: Workspace) -> Workspace:
        if workspace.id:
            model = self.db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace.id).first()
            if model:
                model.name = workspace.name
                model.description = workspace.description
                model.logo_url = workspace.logo_url
                model.primary_color = workspace.primary_color
                model.accent_color = workspace.accent_color
                model.invitation_expiry_days = workspace.invitation_expiry_days
                model.invitation_message = workspace.invitation_message
                model.smtp_host = workspace.smtp_host
                model.smtp_port = workspace.smtp_port
                model.smtp_user = workspace.smtp_user
                model.smtp_password = workspace.smtp_password
                model.smtp_sender_email = workspace.smtp_sender_email
                model.smtp_sender_name = workspace.smtp_sender_name
                model.smtp_security = workspace.smtp_security
                model.lead_api_key = workspace.lead_api_key
                model.lead_pipeline_id = workspace.lead_pipeline_id
                model.lead_stage_id = workspace.lead_stage_id
                model.lead_type_id = workspace.lead_type_id
        else:
            model = WorkspaceModel(
                name=workspace.name,
                description=workspace.description,
                logo_url=workspace.logo_url,
                primary_color=workspace.primary_color,
                accent_color=workspace.accent_color,
                invitation_message=workspace.invitation_message,
                smtp_host=workspace.smtp_host,
                smtp_port=workspace.smtp_port,
                smtp_user=workspace.smtp_user,
                smtp_password=workspace.smtp_password,
                smtp_sender_email=workspace.smtp_sender_email,
                smtp_sender_name=workspace.smtp_sender_name,
                smtp_security=workspace.smtp_security,
                lead_api_key=workspace.lead_api_key,
                lead_pipeline_id=workspace.lead_pipeline_id,
                lead_stage_id=workspace.lead_stage_id,
                lead_type_id=workspace.lead_type_id
            )
            self.db.add(model)
        
        self.db.commit()
        self.db.refresh(model)
        workspace.id = model.id
        workspace.created_at = model.created_at
        return workspace

    def list_all(self) -> List[Workspace]:
        models = self.db.query(WorkspaceModel).all()
        return [Workspace(
            id=m.id, 
            name=m.name, 
            description=m.description,
            logo_url=m.logo_url,
            primary_color=m.primary_color,
            accent_color=m.accent_color,
            invitation_expiry_days=m.invitation_expiry_days or 7,
            invitation_message=m.invitation_message,
            smtp_host=m.smtp_host,
            smtp_port=m.smtp_port,
            smtp_user=m.smtp_user,
            smtp_password=m.smtp_password,
            smtp_sender_email=m.smtp_sender_email,
            smtp_sender_name=m.smtp_sender_name,
            smtp_security=m.smtp_security or "STARTTLS",
            lead_api_key=m.lead_api_key,
            lead_pipeline_id=m.lead_pipeline_id,
            lead_stage_id=m.lead_stage_id,
            lead_type_id=m.lead_type_id,
            created_at=m.created_at
        ) for m in models]
        
    def get_by_api_key(self, api_key: str) -> Optional[Workspace]:
        model = self.db.query(WorkspaceModel).filter(WorkspaceModel.lead_api_key == api_key).first()
        if not model:
            return None
        return Workspace(
            id=model.id, 
            name=model.name, 
            description=model.description,
            logo_url=model.logo_url,
            primary_color=model.primary_color,
            accent_color=model.accent_color,
            invitation_expiry_days=model.invitation_expiry_days or 7,
            invitation_message=model.invitation_message,
            smtp_host=model.smtp_host,
            smtp_port=model.smtp_port,
            smtp_user=model.smtp_user,
            smtp_password=model.smtp_password,
            smtp_sender_email=model.smtp_sender_email,
            smtp_sender_name=model.smtp_sender_name,
            smtp_security=model.smtp_security or "STARTTLS",
            lead_api_key=model.lead_api_key,
            lead_pipeline_id=model.lead_pipeline_id,
            lead_stage_id=model.lead_stage_id,
            lead_type_id=model.lead_type_id,
            created_at=model.created_at
        )
