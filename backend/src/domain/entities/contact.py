from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List

@dataclass
class Contact:
    id: Optional[int] = None
    name: str = ""
    email: str = ""
    phone: Optional[str] = None
    status: str = "active"
    stage_id: Optional[int] = None
    team_id: Optional[int] = None
    workspace_id: Optional[int] = None
    properties: Dict[str, Any] = field(default_factory=dict)
    companies: List[Dict[str, Any]] = field(default_factory=list) # [{'id': 1, 'name': 'Acme'}]
    created_at: datetime = field(default_factory=datetime.utcnow)
