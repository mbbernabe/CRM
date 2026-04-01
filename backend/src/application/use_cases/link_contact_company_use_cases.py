from src.domain.repositories.contact_repository import IContactRepository

class LinkContactCompanyUseCase:
    def __init__(self, contact_repo: IContactRepository):
        self.contact_repo = contact_repo
        
    def execute(self, contact_id: int, company_id: int) -> bool:
        success = self.contact_repo.link_company(contact_id, company_id)
        if not success:
            raise ValueError("Contato ou Empresa não encontrados")
        return True

class UnlinkContactCompanyUseCase:
    def __init__(self, contact_repo: IContactRepository):
        self.contact_repo = contact_repo
        
    def execute(self, contact_id: int, company_id: int) -> bool:
        return self.contact_repo.unlink_company(contact_id, company_id)
