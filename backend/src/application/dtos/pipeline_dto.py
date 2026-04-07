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
    entity_type: str
    team_id: Optional[int] = None
    item_label_singular: Optional[str] = "Item"
    item_label_plural: Optional[str] = "Itens"
    stages: List[PipelineStageDTO]

    class Config:
        from_attributes = True

class PipelineCreateDTO(BaseModel):
    name: str
    entity_type: str
    item_label_singular: Optional[str] = "Item"
    item_label_plural: Optional[str] = "Itens"
    stages: List[PipelineStageDTO]

class PipelineUpdateDTO(BaseModel):
    name: Optional[str] = None
    item_label_singular: Optional[str] = None
    item_label_plural: Optional[str] = None
    stages: Optional[List[PipelineStageDTO]] = None

class EntityMoveDTO(BaseModel):
    entity_type: str
    entity_id: int
    stage_id: int
