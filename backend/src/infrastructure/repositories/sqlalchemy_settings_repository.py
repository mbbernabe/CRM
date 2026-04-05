from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from src.infrastructure.database.models import SystemSettingsModel
from src.domain.repositories.settings_repository import ISettingsRepository, SystemSetting

class SqlAlchemySettingsRepository(ISettingsRepository):
    def __init__(self, db: Session):
        self.db = db

    def get(self, key: str) -> Optional[SystemSetting]:
        model = self.db.query(SystemSettingsModel).filter(SystemSettingsModel.key == key).first()
        if not model:
            return None
        return self._to_domain(model)

    def save(self, setting: SystemSetting) -> SystemSetting:
        model = self.db.query(SystemSettingsModel).filter(SystemSettingsModel.key == setting.key).first()
        if model:
            model.value = setting.value
            model.description = setting.description
            model.is_encrypted = setting.is_encrypted
        else:
            model = SystemSettingsModel(
                key=setting.key,
                value=setting.value,
                description=setting.description,
                is_encrypted=setting.is_encrypted
            )
            self.db.add(model)
        
        self.db.commit()
        self.db.refresh(model)
        return self._to_domain(model)

    def list_all(self) -> List[SystemSetting]:
        models = self.db.query(SystemSettingsModel).all()
        return [self._to_domain(m) for m in models]

    def get_all_as_dict(self) -> Dict[str, str]:
        models = self.db.query(SystemSettingsModel).all()
        return {m.key: m.value for m in models if m.value is not None}

    def _to_domain(self, model: SystemSettingsModel) -> SystemSetting:
        return SystemSetting(
            key=model.key,
            value=model.value,
            description=model.description,
            is_encrypted=model.is_encrypted,
            updated_at=model.updated_at
        )
