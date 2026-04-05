from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Workspace:
    id: Optional[int] = None
    name: str = ""
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#0091ae"
    accent_color: str = "#ff7a59"
    created_at: datetime = datetime.utcnow()
