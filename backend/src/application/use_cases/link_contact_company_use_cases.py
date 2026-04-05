from src.domain.repositories.contact_repository import IContactRepository

class LinkContactCompanyUseCase:
    def __init__(self, contact_repository: IContactRepository):
        self.contact_repository = contact_repository

    def execute(self, contact_id: int, company_id: int, workspace_id: int) -> bool:
        success = self.contact_repository.link_company(contact_id, company_id, workspace_id)
        if not success:
            raise ValueError("Contato ou Empresa não encontrados ou pertencem a áreas de trabalho diferentes.")
        return True

class UnlinkContactCompanyUseCase:
    def __init__(self, contact_repository: IContactRepository):
        self.contact_repository = contact_repository

    def execute(self, contact_id: int, company_id: int, workspace_id: int) -> bool:
        return self.contact_repository.unlink_company(contact_id, company_id, workspace_id)
