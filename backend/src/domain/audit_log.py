from dataclasses import dataclass
from datetime import datetime

@dataclass
class AuditLog:
    property_name: str
    old_value: str
    new_value: str
    changed_at: datetime
