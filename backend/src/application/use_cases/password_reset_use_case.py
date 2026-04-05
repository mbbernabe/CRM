from datetime import datetime, timedelta
from typing import Optional
from src.domain.repositories.user_repository import IUserRepository
from src.domain.repositories.settings_repository import ISettingsRepository
from src.infrastructure.services.email_service import EmailService
from src.infrastructure.security.auth_utils import SecurityUtils

class RequestPasswordResetUseCase:
    def __init__(self, user_repo: IUserRepository, settings_repo: ISettingsRepository):
        self.user_repo = user_repo
        self.settings_repo = settings_repo

    def execute(self, email: str) -> bool:
        # 1. Buscar usuário
        user = self.user_repo.get_by_email(email)
        if not user:
            # Por segurança, não informamos que o e-mail não existe
            return True

        # 2. Gerar Token JWT
        token = SecurityUtils.create_reset_token(email)
        
        # 3. Salvar no banco (opcional para revogação instantânea)
        user.reset_password_token = token
        user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
        self.user_repo.save(user)

        # 4. Preparar Link
        settings = self.settings_repo.get_all_as_dict()
        base_url = settings.get("reset_link_base_url", "http://localhost:5173")
        reset_link = f"{base_url}/reset-password?token={token}"

        # 5. Enviar E-mail
        email_service = EmailService(settings)
        return email_service.send_reset_password_email(email, reset_link)

class ResetPasswordUseCase:
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def execute(self, token: str, new_password: str) -> bool:
        # 1. Validar Token JWT
        email = SecurityUtils.verify_reset_token(token)
        if not email:
            raise ValueError("Link de redefinição inválido ou expirado.")

        # 2. Buscar Usuário
        user = self.user_repo.get_by_email(email)
        if not user or user.reset_password_token != token:
            raise ValueError("Este link já foi utilizado ou é inválido.")

        # 3. Atualizar Senha e Limpar Token
        user.password = SecurityUtils.hash_password(new_password)
        user.reset_password_token = None
        user.reset_password_expires = None
        
        self.user_repo.save(user)
        return True
