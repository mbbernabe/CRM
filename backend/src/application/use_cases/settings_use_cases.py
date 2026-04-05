from typing import List, Dict
from src.domain.repositories.settings_repository import ISettingsRepository, SystemSetting

class GetSystemSettingsUseCase:
    def __init__(self, settings_repo: ISettingsRepository):
        self.settings_repo = settings_repo

    def execute(self) -> List[SystemSetting]:
        return self.settings_repo.list_all()

class UpdateSystemSettingsUseCase:
    def __init__(self, settings_repo: ISettingsRepository):
        self.settings_repo = settings_repo

    def execute(self, settings_dict: Dict[str, str]):
        for key, value in settings_dict.items():
            setting = SystemSetting(
                key=key,
                value=value,
                is_encrypted=key.lower().endswith("password") # Simples detecção para criptografia futura
            )
            self.settings_repo.save(setting)
