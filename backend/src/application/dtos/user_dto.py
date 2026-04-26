from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class MembershipReadDTO(BaseModel):
    id: int
    user_id: int
    workspace_id: int
    team_id: Optional[int]
    role: str
    is_active: bool
    workspace_name: Optional[str]
    team_name: Optional[str]
    primary_color: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

class UserReadDTO(BaseModel):
    id: int
    name: str
    email: EmailStr
    last_active_workspace_id: Optional[int] = None
    last_active_membership_id: Optional[int] = None
    is_active: bool = True
    deactivated_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    memberships: Optional[List[MembershipReadDTO]] = []
    role: Optional[str] = None
    team_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    preferences: Optional[dict] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserCreateDTO(BaseModel):
    name: str
    email: EmailStr
    password: str
    workspace_name: Optional[str] = None # Nome da Empresa/Área de Trabalho
    team_name: Optional[str] = None
    invite_code: Optional[str] = None

class LoginRequestDTO(BaseModel):
    email: EmailStr
    password: str

from src.application.dtos.workspace_dto import WorkspaceReadDTO

class AuthResponseDTO(BaseModel):
    user: UserReadDTO
    workspace: Optional[WorkspaceReadDTO] = None

class UserUpdateDTO(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None

class ChangePasswordDTO(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
