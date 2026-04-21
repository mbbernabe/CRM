from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
from src.application.use_cases.auth_use_cases import RegisterUserUseCase, LoginUseCase
from src.application.dtos.user_dto import UserCreateDTO, LoginRequestDTO, AuthResponseDTO, UserReadDTO
from pydantic import BaseModel, EmailStr
from src.application.use_cases.password_reset_use_case import RequestPasswordResetUseCase, ResetPasswordUseCase
from src.infrastructure.repositories.sqlalchemy_settings_repository import SqlAlchemySettingsRepository
from src.infrastructure.utils.logger import get_logger, log_exception
from src.domain.exceptions.base_exceptions import DomainException, AuthenticationException

logger = get_logger(__name__)

from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=AuthResponseDTO, status_code=status.HTTP_201_CREATED)
def register(dto: UserCreateDTO, db: Session = Depends(get_db)):
    user_repo = SqlAlchemyUserRepository(db)
    team_repo = SqlAlchemyTeamRepository(db)
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository
    membership_repo = SqlAlchemyMembershipRepository(db)
    try:
        user, workspace = RegisterUserUseCase(user_repo, team_repo, workspace_repo, membership_repo).execute(dto)
        return AuthResponseDTO(
            user=UserReadDTO.model_validate(user),
            workspace=workspace
        )
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "register")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Não foi possível concluir seu cadastro no momento. Nossa equipe técnica foi notificada. Por favor, tente novamente em alguns minutos."
        )

@router.post("/login", response_model=AuthResponseDTO)
def login(dto: LoginRequestDTO, db: Session = Depends(get_db)):
    user_repo = SqlAlchemyUserRepository(db)
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    try:
        user, workspace = LoginUseCase(user_repo, workspace_repo).execute(dto)
        return AuthResponseDTO(
            user=UserReadDTO.model_validate(user),
            workspace=workspace
        )
    except AuthenticationException as e:
        detail = {"message": e.message}
        if e.data:
            detail.update(e.data)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
    except Exception as e:
        log_exception(logger, e, "login")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Ocorreu um erro ao tentar entrar no sistema. Por favor, tente novamente mais tarde."
        )

class ForgotPasswordDTO(BaseModel):
    email: EmailStr

class ResetPasswordDTO(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(dto: ForgotPasswordDTO, db: Session = Depends(get_db)):
    user_repo = SqlAlchemyUserRepository(db)
    settings_repo = SqlAlchemySettingsRepository(db)
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    try:
        success = RequestPasswordResetUseCase(user_repo, settings_repo, workspace_repo).execute(dto.email)
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
    except DomainException as e:
        logger.warning(f"Tentativa inválida de reset de senha: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "reset_password")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Não foi possível redefinir sua senha agora. Por favor, entre em contato com o suporte se o problema persistir."
        )

from src.infrastructure.api.dependencies import get_user_id_optional

@router.get("/me", response_model=UserReadDTO)
def get_me(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id_optional)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    user_repo = SqlAlchemyUserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.post("/switch-context/{context_id}")
def switch_context(
    context_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id_optional)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    user_repo = SqlAlchemyUserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Tentar encontrar a membership pelo ID (context_id)
    membership = next((m for m in user.memberships if m.id == context_id), None)
    
    if not membership:
        # Fallback: Se o ID for um workspace_id, pegar a primeira membership dele
        membership = next((m for m in user.memberships if m.workspace_id == context_id), None)
        
    if not membership:
        raise HTTPException(status_code=403, detail="Acesso negado a este contexto")
        
    user.last_active_workspace_id = membership.workspace_id
    user.last_active_membership_id = membership.id
    user_repo.save(user)
    return {"status": "ok", "workspace_id": membership.workspace_id, "membership_id": membership.id}
