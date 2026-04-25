from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository
from src.application.use_cases.workspace_use_cases import GetWorkspaceUseCase, UpdateWorkspaceUseCase, DeleteWorkspaceUseCase
from src.application.dtos.workspace_dto import WorkspaceReadDTO, WorkspaceUpdateDTO
from src.domain.entities.workspace import Workspace
from src.infrastructure.api.dependencies import get_workspace_id, get_user_id_optional
from src.domain.exceptions.base_exceptions import DomainException
from src.infrastructure.utils.logger import get_logger, log_exception

logger = get_logger(__name__)
router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("/{workspace_id}/users")
def list_workspace_users(workspace_id: int, db: Session = Depends(get_db)):
    from src.infrastructure.database.models import UserModel, MembershipModel, TeamModel
    # Query users that have a membership in this workspace
    results = db.query(UserModel, MembershipModel).join(
        MembershipModel, UserModel.id == MembershipModel.user_id
    ).outerjoin(
        TeamModel, MembershipModel.team_id == TeamModel.id
    ).filter(
        MembershipModel.workspace_id == workspace_id
    ).all()
    
    return [
        {
            "id": u.id, 
            "name": u.name, 
            "email": u.email, 
            "role": m.role, 
            "team_id": m.team_id,
            "team_name": m.team.name if m.team else None
        } for u, m in results
    ]

@router.post("/", response_model=WorkspaceReadDTO, status_code=status.HTTP_201_CREATED)
def create_workspace(
    data: WorkspaceUpdateDTO, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id_optional)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuário não autenticado.")
        
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
    from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository
    from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
    from src.domain.entities.team import Team
    from src.domain.entities.user import Membership
    
    team_repo = SqlAlchemyTeamRepository(db)
    membership_repo = SqlAlchemyMembershipRepository(db)
    user_repo = SqlAlchemyUserRepository(db)

    try:
        # 1. Create Workspace
        new_workspace = Workspace(name=data.name or "Minha Nova Empresa")
        new_workspace = workspace_repo.save(new_workspace)
        
        # 2. Create Default Team
        new_team = Team(name="Geral", workspace_id=new_workspace.id)
        new_team = team_repo.save(new_team)
        
        # 3. Create Membership for the user
        membership = Membership(
            user_id=user_id,
            workspace_id=new_workspace.id,
            team_id=new_team.id,
            role="admin"
        )
        membership_repo.create(membership)
        
        # 4. Update user's last_active_workspace_id
        user = user_repo.get_by_id(user_id)
        if user:
            user.last_active_workspace_id = new_workspace.id
            user_repo.save(user)
            
        return new_workspace
    except Exception as e:
        log_exception(logger, e, "create_workspace")
        raise HTTPException(status_code=500, detail="Erro ao criar nova área de trabalho.")

@router.get("/{workspace_id}", response_model=WorkspaceReadDTO)
def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    try:
        return GetWorkspaceUseCase(workspace_repo).execute(workspace_id)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "get_workspace")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao carregar workspace.")

@router.patch("/{workspace_id}", response_model=WorkspaceReadDTO)
def update_workspace(workspace_id: int, data: WorkspaceUpdateDTO, db: Session = Depends(get_db)):
    # No futuro: verificar se o usuário é admin do workspace via JWT
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    try:
        return UpdateWorkspaceUseCase(workspace_repo).execute(workspace_id, data)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "update_workspace")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao atualizar workspace.")

@router.delete("/{workspace_id}", status_code=status.HTTP_200_OK)
def delete_workspace(
    workspace_id: int, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id_optional)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuário não autenticado.")
        
    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    from src.infrastructure.repositories.sqlalchemy_membership_repository import SqlAlchemyMembershipRepository
    membership_repo = SqlAlchemyMembershipRepository(db)
    
    try:
        next_workspace_id = DeleteWorkspaceUseCase(workspace_repo, membership_repo).execute(user_id, workspace_id)
        return {"message": "Área de trabalho excluída com sucesso", "next_workspace_id": next_workspace_id}
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "delete_workspace")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao excluir workspace.")
