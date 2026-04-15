from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class WorkspaceReadDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#0091ae"
    accent_color: str = "#ff7a59"
    invitation_expiry_days: int = 7
    invitation_message: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class WorkspaceUpdateDTO(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    invitation_expiry_days: Optional[int] = None
    invitation_message: Optional[str] = None


class InvitationReadDTO(BaseModel):
    id: int
    email: str
    workspace_id: int
    workspace_name: Optional[str] = None
    role: str
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    invited_by: Optional[int] = None
    inviter_name: Optional[str] = None
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
