from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_company_repository import SqlAlchemyCompanyRepository
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository
from src.application.use_cases.company_use_cases import (
    ListCompaniesUseCase,
    GetCompanyUseCase,
    CreateCompanyUseCase,
    UpdateCompanyUseCase,
    DeleteCompanyUseCase
)
from src.application.use_cases.link_contact_company_use_cases import LinkContactCompanyUseCase, UnlinkContactCompanyUseCase
from src.infrastructure.repositories.sqlalchemy_contact_repository import SqlAlchemyContactRepository
from src.domain.entities.company import Company

class CompanyCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    properties: dict = Field(default_factory=dict)

class CompanyUpdate(BaseModel):
    name: str
    domain: Optional[str] = None
    properties: dict = Field(default_factory=dict)

class CompanyResponse(BaseModel):
    id: int
    name: str
    domain: Optional[str]
    status: str
    properties: dict
    contacts: list = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)

from src.infrastructure.api.dependencies import get_workspace_id, get_team_id_optional

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("/", response_model=List[CompanyResponse])
def list_companies(db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    company_repo = SqlAlchemyCompanyRepository(db)
    use_case = ListCompaniesUseCase(company_repo)
    return use_case.execute(workspace_id)

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    company_repo = SqlAlchemyCompanyRepository(db)
    use_case = GetCompanyUseCase(company_repo)
    company = use_case.execute(company_id, workspace_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return company

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company: CompanyCreate, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id), team_id: Optional[int] = Depends(get_team_id_optional)):
    company_repo = SqlAlchemyCompanyRepository(db)
    property_repo = SqlAlchemyPropertyRepository(db)
    use_case = CreateCompanyUseCase(company_repo, property_repo)
    try:
        return use_case.execute(company.name, workspace_id, company.domain, company.properties, team_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
             raise HTTPException(status_code=400, detail="O domínio da empresa já está em uso")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, company: CompanyUpdate, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id), team_id: Optional[int] = Depends(get_team_id_optional)):
    company_repo = SqlAlchemyCompanyRepository(db)
    property_repo = SqlAlchemyPropertyRepository(db)
    use_case = UpdateCompanyUseCase(company_repo, property_repo)
    try:
        return use_case.execute(company_id, workspace_id, company.name, company.domain, company.properties, team_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
             raise HTTPException(status_code=400, detail="O domínio da empresa já está em uso")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    company_repo = SqlAlchemyCompanyRepository(db)
    use_case = DeleteCompanyUseCase(company_repo)
    success = use_case.execute(company_id, workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return {"message": "Empresa excluída com sucesso"}

@router.post("/{company_id}/contacts/{contact_id}")
def link_contact(company_id: int, contact_id: int, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    contact_repo = SqlAlchemyContactRepository(db)
    use_case = LinkContactCompanyUseCase(contact_repo)
    try:
        use_case.execute(contact_id, company_id, workspace_id)
        return {"message": "Contato vinculado com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{company_id}/contacts/{contact_id}")
def unlink_contact(company_id: int, contact_id: int, db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)):
    contact_repo = SqlAlchemyContactRepository(db)
    use_case = UnlinkContactCompanyUseCase(contact_repo)
    success = use_case.execute(contact_id, company_id, workspace_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    return {"message": "Contato desvinculado com sucesso"}
