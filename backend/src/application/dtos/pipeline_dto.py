from pydantic import BaseModel
from typing import List, Optional

class PipelineStageDTO(BaseModel):
    id: Optional[int] = None
    name: str
    order: int = 0
    color: str = "#CBD5E0"
    is_final: bool = False
    metadata: Optional[str] = None

    class Config:
        from_attributes = True

class PipelineReadDTO(BaseModel):
    id: int
    name: str
    type_id: int
    team_id: Optional[int] = None
    stages: List[PipelineStageDTO]

    class Config:
        from_attributes = True

class PipelineCreateDTO(BaseModel):
    name: str
    type_id: int
    workspace_id: Optional[int] = None
    stages: List[PipelineStageDTO]

class PipelineUpdateDTO(BaseModel):
    name: Optional[str] = None
    stages: Optional[List[PipelineStageDTO]] = None

class EntityMoveDTO(BaseModel):
    type_id: int
    entity_id: int
    stage_id: int
class PipelineImportDTO(BaseModel):
    template_id: int
    target_type_id: int
