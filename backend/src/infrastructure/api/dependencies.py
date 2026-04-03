from fastapi import Header, HTTPException, status

def get_team_id(x_team_id: int = Header(..., alias="X-Team-ID")) -> int:
    if not x_team_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header X-Team-ID é obrigatório para esta operação."
        )
    return x_team_id
