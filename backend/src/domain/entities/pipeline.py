from dataclasses import dataclass, field
from typing import Optional, List

@dataclass
class PipelineStage:
    id: Optional[int] = None
    pipeline_id: int = 0
    name: str = ""
    order: int = 0
    color: str = "#CBD5E0" # Default gray
    is_final: bool = False
    metadata: Optional[str] = None # JSON string for extra config

@dataclass
class Pipeline:
    id: Optional[int] = None
    name: str = ""
    entity_type: str = "contact" # contact, company, deal, etc.
    team_id: int = 0
    workspace_id: Optional[int] = None
    stages: List[PipelineStage] = field(default_factory=list)
