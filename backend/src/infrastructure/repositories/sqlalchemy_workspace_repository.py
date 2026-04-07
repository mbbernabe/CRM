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
        else:
            model = WorkspaceModel(
                name=workspace.name,
                description=workspace.description,
                logo_url=workspace.logo_url,
                primary_color=workspace.primary_color,
                accent_color=workspace.accent_color
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
            created_at=m.created_at
        ) for m in models]
