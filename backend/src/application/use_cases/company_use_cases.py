from typing import List, Dict, Any, Optional
from src.domain.entities.company import Company
from src.infrastructure.repositories.sqlalchemy_company_repository import SqlAlchemyCompanyRepository
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository

class ListCompaniesUseCase:
    def __init__(self, repository: SqlAlchemyCompanyRepository):
        self.repository = repository
        
    def execute(self, workspace_id: int) -> List[Company]:
        return self.repository.list_all(workspace_id)

class GetCompanyUseCase:
    def __init__(self, repository: SqlAlchemyCompanyRepository):
        self.repository = repository
        
    def execute(self, company_id: int, workspace_id: int) -> Optional[Company]:
        return self.repository.get_by_id(company_id, workspace_id)

class CreateCompanyUseCase:
    def __init__(self, company_repo: SqlAlchemyCompanyRepository, property_repo: SqlAlchemyPropertyRepository):
        self.company_repo = company_repo
        self.property_repo = property_repo
        
    def execute(self, name: str, workspace_id: int, domain: Optional[str] = None, properties: Dict[str, Any] = None, team_id: Optional[int] = None) -> Company:
        # Validate required properties
        links = self.property_repo.list_entity_links(entity_type="company", workspace_id=workspace_id)
        required_props = [ln.property_def.name for ln in links if ln.is_required]
        
        props_dict = properties or {}
        for rp in required_props:
            if rp not in props_dict or not props_dict[rp]:
                raise ValueError(f"Propriedade obrigatória não preenchida: {rp}")
                
        company = Company(
            name=name,
            domain=domain,
            properties=props_dict,
            workspace_id=workspace_id,
            team_id=team_id
        )
        return self.company_repo.save(company, workspace_id)

class UpdateCompanyUseCase:
    def __init__(self, company_repo: SqlAlchemyCompanyRepository, property_repo: SqlAlchemyPropertyRepository):
        self.company_repo = company_repo
        self.property_repo = property_repo
        
    def execute(self, company_id: int, workspace_id: int, name: str, domain: Optional[str] = None, properties: Dict[str, Any] = None, team_id: Optional[int] = None) -> Company:
        existing = self.company_repo.get_by_id(company_id, workspace_id)
        if not existing:
            raise ValueError("Empresa não encontrada ou você não tem permissão.")
            
        # Validate required properties
        links = self.property_repo.list_entity_links(entity_type="company", workspace_id=workspace_id)
        required_props = [ln.property_def.name for ln in links if ln.is_required]
        
        props_dict = properties or {}
        for rp in required_props:
            if rp not in props_dict or not props_dict[rp]:
                raise ValueError(f"Propriedade obrigatória não preenchida: {rp}")

        existing.name = name
        existing.domain = domain
        existing.properties = props_dict
        existing.team_id = team_id
        
        return self.company_repo.update(existing, workspace_id)

class DeleteCompanyUseCase:
    def __init__(self, repository: SqlAlchemyCompanyRepository):
        self.repository = repository
        
    def execute(self, company_id: int, workspace_id: int) -> bool:
        return self.repository.delete(company_id, workspace_id)
