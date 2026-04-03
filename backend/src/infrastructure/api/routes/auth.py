from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.infrastructure.repositories.sqlalchemy_team_repository import SqlAlchemyTeamRepository
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository
from src.application.use_cases.auth_use_cases import RegisterUserUseCase, LoginUseCase
from src.application.dtos.user_dto import UserCreateDTO, LoginRequestDTO, AuthResponseDTO, UserReadDTO

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
