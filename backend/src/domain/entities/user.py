from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Team:
    id: Optional[int] = None
    name: str = ""
    created_at: datetime = datetime.utcnow()

@dataclass
class User:
    id: Optional[int] = None
    name: str = ""
    email: str = ""
    password: str = ""
    team_id: Optional[int] = None
    role: str = "user"
    created_at: datetime = datetime.utcnow()
    
    # Relacionamento carreado (opcional)
    team: Optional[Team] = None
