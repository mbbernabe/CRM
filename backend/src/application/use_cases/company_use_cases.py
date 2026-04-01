from typing import List, Dict, Any, Optional
from src.domain.entities.company import Company
from src.infrastructure.repositories.sqlalchemy_company_repository import SqlAlchemyCompanyRepository
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository

class ListCompaniesUseCase:
    def __init__(self, repository: SqlAlchemyCompanyRepository):
        self.repository = repository
        
    def execute(self) -> List[Company]:
        return self.repository.list_all()

class GetCompanyUseCase:
    def __init__(self, repository: SqlAlchemyCompanyRepository):
        self.repository = repository
        
    def execute(self, company_id: int) -> Optional[Company]:
        return self.repository.get_by_id(company_id)

class CreateCompanyUseCase:
    def __init__(self, company_repo: SqlAlchemyCompanyRepository, property_repo: SqlAlchemyPropertyRepository):
        self.company_repo = company_repo
        self.property_repo = property_repo
        
    def execute(self, name: str, domain: Optional[str] = None, properties: Dict[str, Any] = None) -> Company:
        # Validate required properties
        all_props = self.property_repo.list_all_ordered(entity_type="company")
        required_props = [p.name for p in all_props if p.is_required]
        
        props_dict = properties or {}
        for rp in required_props:
            if rp not in props_dict or not props_dict[rp]:
                raise ValueError(f"Propriedade obrigatória não preenchida: {rp}")
                
        company = Company(
            name=name,
            domain=domain,
            properties=props_dict
        )
        return self.company_repo.save(company)

class UpdateCompanyUseCase:
    def __init__(self, company_repo: SqlAlchemyCompanyRepository, property_repo: SqlAlchemyPropertyRepository):
        self.company_repo = company_repo
        self.property_repo = property_repo
        
    def execute(self, company_id: int, name: str, domain: Optional[str] = None, properties: Dict[str, Any] = None) -> Company:
        existing = self.company_repo.get_by_id(company_id)
        if not existing:
            raise ValueError("Empresa não encontrada")
            
        # Validate required properties
        all_props = self.property_repo.list_all_ordered(entity_type="company")
        required_props = [p.name for p in all_props if p.is_required]
        
        props_dict = properties or {}
        for rp in required_props:
            if rp not in props_dict or not props_dict[rp]:
                raise ValueError(f"Propriedade obrigatória não preenchida: {rp}")

        existing.name = name
        existing.domain = domain
        existing.properties = props_dict
        
        return self.company_repo.update(existing)

class DeleteCompanyUseCase:
    def __init__(self, repository: SqlAlchemyCompanyRepository):
        self.repository = repository
        
    def execute(self, company_id: int) -> bool:
        return self.repository.delete(company_id)
