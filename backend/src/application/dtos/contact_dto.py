from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class ContactReadDTO(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    status: str
    workspace_id: int
    team_id: Optional[int] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    companies: list = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContactCreateDTO(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    status: str = "active"
    properties: Dict[str, Any] = Field(default_factory=dict)
    company_ids: List[int] = Field(default_factory=list)

class ContactUpdateDTO(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
