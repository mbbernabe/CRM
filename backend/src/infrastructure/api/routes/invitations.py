from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from src.infrastructure.database.db import get_db
from src.infrastructure.api.dependencies import get_workspace_id, get_user_id_optional
from src.infrastructure.repositories.invitation_repository import InvitationRepository
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository
from src.infrastructure.repositories.sqlalchemy_settings_repository import SqlAlchemySettingsRepository
from src.application.use_cases.invitation_use_case import (
    SendInvitationUseCase,
    ValidateInvitationUseCase,
    AcceptInvitationUseCase,
)
from src.application.dtos.workspace_dto import InvitationReadDTO
from src.infrastructure.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/invitations", tags=["Invitations"])


class SendInviteDTO(BaseModel):
    email: EmailStr
    role: str = "user"
    team_id: Optional[int] = None


class AcceptInviteDTO(BaseModel):
    token: str
    name: str
    password: str


def _to_dto(inv) -> dict:
    return {
        "id": inv.id,
        "email": inv.email,
        "workspace_id": inv.workspace_id,
        "workspace_name": inv.workspace_name,
        "role": inv.role,
        "team_id": inv.team_id,
        "team_name": inv.team_name,
        "invited_by": inv.invited_by,
        "inviter_name": inv.inviter_name,
        "expires_at": inv.expires_at,
        "accepted_at": inv.accepted_at,
        "created_at": inv.created_at,
        "is_pending": inv.is_pending,
        "is_expired": inv.is_expired,
        "is_accepted": inv.is_accepted,
    }


# ── Send Invitation ──────────────────────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
def send_invitation(
    dto: SendInviteDTO,
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    db: Session = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Autenticação necessária.")
    try:
        from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository
        use_case = SendInvitationUseCase(
            invitation_repo=InvitationRepository(db),
            user_repo=SqlAlchemyUserRepository(db),
            workspace_repo=SqlAlchemyWorkspaceRepository(db),
            settings_repo=SqlAlchemySettingsRepository(db),
        )
        inv = use_case.execute(
            workspace_id=workspace_id,
            invited_by=user_id,
            email=dto.email,
            role=dto.role,
            team_id=dto.team_id,
        )
        return _to_dto(inv)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao enviar convite: {e}")
        raise HTTPException(status_code=500, detail="Não foi possível enviar o convite. Verifique as configurações de SMTP.")


# ── List Invitations for a Workspace ────────────────────────────────────────
@router.get("")
def list_invitations(
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    db: Session = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Autenticação necessária.")
    invitations = InvitationRepository(db).list_by_workspace(workspace_id)
    return [_to_dto(inv) for inv in invitations]


# ── Validate Token (public) ──────────────────────────────────────────────────
@router.get("/validate")
def validate_invitation(token: str, db: Session = Depends(get_db)):
    try:
        inv = ValidateInvitationUseCase(InvitationRepository(db)).execute(token)
        return {
            "email": inv.email,
            "workspace_name": inv.workspace_name,
            "role": inv.role,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Accept Invitation (public) ───────────────────────────────────────────────
@router.post("/accept")
def accept_invitation(dto: AcceptInviteDTO, db: Session = Depends(get_db)):
    try:
        from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository
        use_case = AcceptInvitationUseCase(
            invitation_repo=InvitationRepository(db),
            user_repo=SqlAlchemyUserRepository(db),
            membership_repo=SqlAlchemyMembershipRepository(db)
        )
        user = use_case.execute(token=dto.token, name=dto.name, password=dto.password)
        return {"message": "Convite aceito com sucesso! Você já pode fazer login.", "email": user.email}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao aceitar convite: {e}")
        raise HTTPException(status_code=500, detail="Não foi possível aceitar o convite.")


# ── Delete / Cancel Invitation ───────────────────────────────────────────────
@router.delete("/{invitation_id}")
def delete_invitation(
    invitation_id: int,
    workspace_id: int = Depends(get_workspace_id),
    user_id: int = Depends(get_user_id_optional),
    db: Session = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Autenticação necessária.")
    deleted = InvitationRepository(db).delete(invitation_id, workspace_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Convite não encontrado.")
    return {"message": "Convite cancelado com sucesso."}
