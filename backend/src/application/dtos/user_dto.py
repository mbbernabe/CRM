from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserReadDTO(BaseModel):
    id: int
    name: str
    email: EmailStr
    workspace_id: Optional[int] = None
    workspace_name: Optional[str] = None
    team_id: Optional[int] = None
    role: str = "user"
    is_active: bool = True
    deactivated_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserCreateDTO(BaseModel):
    name: str
    email: EmailStr
    password: str
    workspace_name: Optional[str] = None # Nome da Empresa/Área de Trabalho
    team_name: Optional[str] = None      # Depreciado: mantido por compatibilidade
    invite_code: Optional[str] = None    # Código do convite se houver

class LoginRequestDTO(BaseModel):
    email: EmailStr
    password: str

from src.application.dtos.workspace_dto import WorkspaceReadDTO

class AuthResponseDTO(BaseModel):
    user: UserReadDTO
    workspace: WorkspaceReadDTO
