from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List

@dataclass
class Company:
    id: Optional[int] = None
    name: str = ""
    domain: Optional[str] = None
    status: str = "active"
    stage_id: Optional[int] = None
    team_id: Optional[int] = None
    workspace_id: Optional[int] = None
    properties: Dict[str, Any] = field(default_factory=dict)
    contacts: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
