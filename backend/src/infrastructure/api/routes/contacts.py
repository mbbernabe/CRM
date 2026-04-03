from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_contact_repository import SqlAlchemyContactRepository
from src.application.use_cases.list_contacts_use_case import ListContactsUseCase
from src.application.use_cases.get_contact_use_case import GetContactUseCase
from src.application.use_cases.create_contact_use_case import CreateContactUseCase
from src.application.use_cases.update_contact_use_case import UpdateContactUseCase
from src.application.use_cases.delete_contact_use_case import DeleteContactUseCase
from src.application.use_cases.link_contact_company_use_cases import LinkContactCompanyUseCase, UnlinkContactCompanyUseCase
from src.application.dtos.contact_dto import ContactReadDTO, ContactCreateDTO, ContactUpdateDTO
from typing import List

from src.infrastructure.api.dependencies import get_team_id

router = APIRouter(prefix="/contacts", tags=["Contacts"])

@router.get("/", response_model=List[ContactReadDTO])
def list_contacts(db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyContactRepository(db)
    use_case = ListContactsUseCase(repository)
    return use_case.execute(team_id)

@router.get("/{contact_id}", response_model=ContactReadDTO)
def get_contact(contact_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyContactRepository(db)
    use_case = GetContactUseCase(repository)
    contact = use_case.execute(contact_id, team_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contato não encontrado")
    return contact

@router.post("/", response_model=ContactReadDTO, status_code=status.HTTP_201_CREATED)
def create_contact(contact_dto: ContactCreateDTO, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyContactRepository(db)
    use_case = CreateContactUseCase(repository)
    return use_case.execute(contact_dto, team_id)

@router.put("/{contact_id}", response_model=ContactReadDTO)
def update_contact(contact_id: int, contact_dto: ContactUpdateDTO, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyContactRepository(db)
    use_case = UpdateContactUseCase(repository)
    updated_contact = use_case.execute(contact_id, contact_dto, team_id)
    if not updated_contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contato não encontrado")
    return updated_contact

@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyContactRepository(db)
    use_case = DeleteContactUseCase(repository)
    success = use_case.execute(contact_id, team_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contato não encontrado")
    return None

@router.post("/{contact_id}/companies/{company_id}")
def link_company(contact_id: int, company_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyContactRepository(db)
    use_case = LinkContactCompanyUseCase(repository)
    try:
        use_case.execute(contact_id, company_id, team_id)
        return {"message": "Empresa vinculada com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{contact_id}/companies/{company_id}")
def unlink_company(contact_id: int, company_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repository = SqlAlchemyContactRepository(db)
    use_case = UnlinkContactCompanyUseCase(repository)
    success = use_case.execute(contact_id, company_id, team_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    return {"message": "Empresa desvinculada com sucesso"}
