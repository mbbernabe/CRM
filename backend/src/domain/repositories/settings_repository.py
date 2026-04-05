from typing import Optional, Protocol, List, Dict
from dataclasses import dataclass
from datetime import datetime

@dataclass
class SystemSetting:
    key: str
    value: Optional[str]
    description: Optional[str] = None
    is_encrypted: bool = False
    updated_at: Optional[datetime] = None

class ISettingsRepository(Protocol):
    def get(self, key: str) -> Optional[SystemSetting]:
        ...
    
    def save(self, setting: SystemSetting) -> SystemSetting:
        ...
    
    def list_all(self) -> List[SystemSetting]:
        ...
    
    def get_all_as_dict(self) -> Dict[str, str]:
        ...
