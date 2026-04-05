from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository
from src.application.use_cases.auth_use_cases import RegisterUserUseCase, LoginUseCase
from src.application.dtos.user_dto import UserCreateDTO, LoginRequestDTO, AuthResponseDTO, UserReadDTO
from pydantic import BaseModel, EmailStr
from src.application.use_cases.password_reset_use_case import RequestPasswordResetUseCase, ResetPasswordUseCase
from src.infrastructure.repositories.sqlalchemy_settings_repository import SqlAlchemySettingsRepository
from src.infrastructure.utils.logger import get_logger, log_exception

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=AuthResponseDTO, status_code=status.HTTP_201_CREATED)
def register(dto: UserCreateDTO, db: Session = Depends(get_db)):
    user_repo = SqlAlchemyUserRepository(db)
    team_repo = SqlAlchemyTeamRepository(db)
    prop_repo = SqlAlchemyPropertyRepository(db)
    try:
        user = RegisterUserUseCase(user_repo, team_repo, prop_repo).execute(dto)
        return AuthResponseDTO(user=UserReadDTO.model_validate(user))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=AuthResponseDTO)
def login(dto: LoginRequestDTO, db: Session = Depends(get_db)):
    user_repo = SqlAlchemyUserRepository(db)
    try:
        user = LoginUseCase(user_repo).execute(dto)
        return AuthResponseDTO(user=UserReadDTO.model_validate(user))
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

class ForgotPasswordDTO(BaseModel):
    email: EmailStr

class ResetPasswordDTO(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(dto: ForgotPasswordDTO, db: Session = Depends(get_db)):
    user_repo = SqlAlchemyUserRepository(db)
    settings_repo = SqlAlchemySettingsRepository(db)
    try:
        success = RequestPasswordResetUseCase(user_repo, settings_repo).execute(dto.email)
        if not success:
            # Identificamos falha técnica (SMTP), logamos e mostramos mensagem amigável
            logger.error(f"Falha técnica no envio de e-mail para {dto.email}. Verifique as configurações de SMTP.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Não foi possível enviar o e-mail de recuperação. Por favor, entre em contato com o suporte técnico."
            )
        return {"message": "Daremos seguimento se o e-mail estiver em nossa base."}
    except HTTPException:
        raise
    except Exception as e:
        log_exception(logger, e, "forgot_password")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Ocorreu um erro interno. Nossa equipe técnica foi notificada. Por favor, entre em contato se o problema persistir."
        )

@router.post("/reset-password")
def reset_password(dto: ResetPasswordDTO, db: Session = Depends(get_db)):
    user_repo = SqlAlchemyUserRepository(db)
    try:
        ResetPasswordUseCase(user_repo).execute(dto.token, dto.new_password)
        return {"message": "Senha atualizada com sucesso!"}
    except ValueError as e:
        logger.warning(f"Tentativa inválida de reset de senha: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link de redefinição inválido ou expirado. Por favor, solicite um novo link.")
    except Exception as e:
        log_exception(logger, e, "reset_password")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Falha ao redefinir senha. Entre em contato com a equipe técnica.")
