from typing import Optional
from fastapi import Header, HTTPException, status

def get_workspace_id(x_workspace_id: int = Header(..., alias="X-Workspace-ID")) -> int:
    if not x_workspace_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header X-Workspace-ID é obrigatório para esta operação."
        )
    return int(x_workspace_id)

def get_team_id_optional(x_team_id: Optional[int] = Header(None, alias="X-Team-ID")) -> Optional[int]:
    return int(x_team_id) if x_team_id else None

def get_user_id_optional(x_user_id: Optional[int] = Header(None, alias="X-User-ID")) -> Optional[int]:
    return int(x_user_id) if x_user_id else None
