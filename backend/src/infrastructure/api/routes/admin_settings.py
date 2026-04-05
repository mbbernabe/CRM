from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_settings_repository import SqlAlchemySettingsRepository
from src.application.use_cases.settings_use_cases import GetSystemSettingsUseCase, UpdateSystemSettingsUseCase
from pydantic import BaseModel

from src.infrastructure.api.routes.admin import require_superadmin

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])

class SettingUpdateDTO(BaseModel):
    settings: Dict[str, str]

@router.get("")
def get_settings(db: Session = Depends(get_db), superadmin_role: str = Depends(require_superadmin)):
    repo = SqlAlchemySettingsRepository(db)
    settings = GetSystemSettingsUseCase(repo).execute()
    return settings

@router.post("")
def update_settings(dto: SettingUpdateDTO, db: Session = Depends(get_db), superadmin_role: str = Depends(require_superadmin)):
    try:
        repo = SqlAlchemySettingsRepository(db)
        UpdateSystemSettingsUseCase(repo).execute(dto.settings)
        return {"message": "Configurações atualizadas com sucesso!"}
    except Exception as e:
        print(f"Erro ao atualizar configurações: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Falha ao persistir configurações: {str(e)}"
        )
