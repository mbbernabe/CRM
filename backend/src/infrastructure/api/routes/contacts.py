from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_contact_repository import SqlAlchemyContactRepository
from src.application.use_cases.list_contacts_use_case import ListContactsUseCase
from src.application.dtos.contact_dto import ContactReadDTO
from typing import List

router = APIRouter(prefix="/contacts", tags=["Contacts"])

@router.get("/", response_model=List[ContactReadDTO])
def list_contacts(db: Session = Depends(get_db)):
    repository = SqlAlchemyContactRepository(db)
    use_case = ListContactsUseCase(repository)
    return use_case.execute()
