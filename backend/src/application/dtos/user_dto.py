from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserReadDTO(BaseModel):
    id: int
    name: str
    email: EmailStr
    team_id: Optional[int] = None
    role: str = "user"
    
    model_config = ConfigDict(from_attributes=True)

class UserCreateDTO(BaseModel):
    name: str
    email: EmailStr
    password: str
    team_name: Optional[str] = None  # Nome do novo time se não houver convite
    invite_code: Optional[str] = None # Código do convite se houver

class LoginRequestDTO(BaseModel):
    email: EmailStr
    password: str

class AuthResponseDTO(BaseModel):
    user: UserReadDTO
    # Futuramente: token: str
