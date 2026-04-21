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
    last_active_workspace_id: Optional[int] = None
    last_active_membership_id: Optional[int] = None
    preferences: Optional[dict] = None
    is_active: bool = True
    deactivated_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    created_at: datetime = datetime.utcnow()
    
    # Relacionamentos
    memberships: Optional[list] = None

@dataclass
class Membership:
    id: Optional[int] = None
    user_id: int = 0
    workspace_id: int = 0
    team_id: Optional[int] = None
    role: str = "user"
    is_active: bool = True
    joined_at: datetime = datetime.utcnow()
    
    # Carregados via eager loading
    workspace_name: Optional[str] = None
    team_name: Optional[str] = None
    primary_color: Optional[str] = None
