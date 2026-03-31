from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class Contact:
    id: Optional[int] = None
    name: str = ""
    email: str = ""
    phone: Optional[str] = None
    status: str = "active"
    created_at: datetime = field(default_factory=datetime.utcnow)
