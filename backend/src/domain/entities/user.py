from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Team:
    id: Optional[int] = None
    name: str = ""
    workspace_id: Optional[int] = None
    created_at: datetime = datetime.utcnow()

@dataclass
class User:
    id: Optional[int] = None
    name: str = ""
    email: str = ""
    password: str = ""
    team_id: Optional[int] = None
    workspace_id: Optional[int] = None
    role: str = "user"
    workspace_name: Optional[str] = None
    reset_password_token: Optional[str] = None
    reset_password_expires: Optional[datetime] = None
    created_at: datetime = datetime.utcnow()
    
    # Relacionamento carreado (opcional)
    team: Optional[Team] = None
