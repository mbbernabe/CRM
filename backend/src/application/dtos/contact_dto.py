from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ContactReadDTO(BaseModel):
    id: Optional[int]
    name: str
    email: str
    phone: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
