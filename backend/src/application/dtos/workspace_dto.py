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
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class WorkspaceUpdateDTO(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
