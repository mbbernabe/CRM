from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ContactReadDTO(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContactCreateDTO(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    status: str = "active"

class ContactUpdateDTO(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
