from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TeamReadDTO(BaseModel):
    id: int
    name: str
    workspace_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class TeamCreateDTO(BaseModel):
    name: str
