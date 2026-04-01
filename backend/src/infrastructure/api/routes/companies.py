from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

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
    
    class Config:
        orm_mode = True

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("/", response_model=List[CompanyResponse])
def list_companies(db: Session = Depends(get_db)):
    company_repo = SqlAlchemyCompanyRepository(db)
    use_case = ListCompaniesUseCase(company_repo)
    return use_case.execute()

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company_repo = SqlAlchemyCompanyRepository(db)
    use_case = GetCompanyUseCase(company_repo)
    company = use_case.execute(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return company

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    company_repo = SqlAlchemyCompanyRepository(db)
    property_repo = SqlAlchemyPropertyRepository(db)
    use_case = CreateCompanyUseCase(company_repo, property_repo)
    try:
        return use_case.execute(company.name, company.domain, company.properties)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
             raise HTTPException(status_code=400, detail="O domínio da empresa já está em uso")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, company: CompanyUpdate, db: Session = Depends(get_db)):
    company_repo = SqlAlchemyCompanyRepository(db)
    property_repo = SqlAlchemyPropertyRepository(db)
    use_case = UpdateCompanyUseCase(company_repo, property_repo)
    try:
        return use_case.execute(company_id, company.name, company.domain, company.properties)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
             raise HTTPException(status_code=400, detail="O domínio da empresa já está em uso")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company_repo = SqlAlchemyCompanyRepository(db)
    use_case = DeleteCompanyUseCase(company_repo)
    success = use_case.execute(company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return {"message": "Empresa excluída com sucesso"}
