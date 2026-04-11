from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Union

class WorkItemFieldGroupDTO(BaseModel):
    id: Optional[int] = None
    name: str
    order: int = 0
    type_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class CustomFieldDefinitionDTO(BaseModel):
    id: Optional[int] = None
    group_id: Optional[Union[int, str]] = None
    name: str # slug: "expected_revenue"
    label: str # display: "Receita Esperada"
    field_type: str = "text"
    options: Optional[List[str]] = None
    required: bool = False
    is_default: bool = True
    order: int = 0
    source_field_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class WorkItemTypeReadDTO(BaseModel):
    id: int
    name: str
    label: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system: bool = False
    is_installed: bool = False
    source_type_id: Optional[int] = None
    field_definitions: List[CustomFieldDefinitionDTO] = Field(default_factory=list)
    field_groups: List[WorkItemFieldGroupDTO] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class WorkItemTypeCreateDTO(BaseModel):
    name: str
    label: str
    icon: Optional[str] = None
    color: Optional[str] = None
    field_definitions: List[CustomFieldDefinitionDTO] = Field(default_factory=list)
    field_groups: List[WorkItemFieldGroupDTO] = Field(default_factory=list)

class WorkItemTypeUpdateDTO(BaseModel):
    label: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    field_definitions: Optional[List[CustomFieldDefinitionDTO]] = None
    field_groups: Optional[List[WorkItemFieldGroupDTO]] = None

from datetime import datetime

class WorkItemHistoryReadDTO(BaseModel):
    id: int
    workitem_id: int
    from_stage_id: Optional[int] = None
    from_stage_name: Optional[str] = None
    to_stage_id: int
    to_stage_name: Optional[str] = None
    changed_at: datetime
    changed_by: Optional[int] = None
    changed_by_name: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class WorkItemNoteCreateDTO(BaseModel):
    notes: str
