from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any

@dataclass
class Company:
    id: Optional[int] = None
    name: str = ""
    domain: Optional[str] = None
    status: str = "active"
    properties: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
