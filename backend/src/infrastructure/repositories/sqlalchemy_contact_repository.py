from typing import List, Optional
from sqlalchemy.orm import Session
from src.domain.entities.contact import Contact
from src.domain.repositories.contact_repository import IContactRepository
from src.infrastructure.database.models import ContactModel

class SqlAlchemyContactRepository(IContactRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> List[Contact]:
        db_contacts = self.db.query(ContactModel).all()
        return [
            Contact(
                id=c.id,
                name=c.name,
                email=c.email,
                phone=c.phone,
                status=c.status,
                created_at=c.created_at
            )
            for c in db_contacts
        ]

    def get_by_id(self, contact_id: int) -> Optional[Contact]:
        db_contact = self.db.query(ContactModel).filter(ContactModel.id == contact_id).first()
        if not db_contact:
            return None
        return Contact(
            id=db_contact.id,
            name=db_contact.name,
            email=db_contact.email,
            phone=db_contact.phone,
            status=db_contact.status,
            created_at=db_contact.created_at
        )

    def save(self, contact: Contact) -> Contact:
        db_contact = ContactModel(
            name=contact.name,
            email=contact.email,
            phone=contact.phone,
            status=contact.status,
            created_at=contact.created_at
        )
        self.db.add(db_contact)
        self.db.commit()
        self.db.refresh(db_contact)
        contact.id = db_contact.id
        return contact

    def update(self, contact: Contact) -> Contact:
        db_contact = self.db.query(ContactModel).filter(ContactModel.id == contact.id).first()
        if db_contact:
            db_contact.name = contact.name
            db_contact.email = contact.email
            db_contact.phone = contact.phone
            db_contact.status = contact.status
            self.db.commit()
            self.db.refresh(db_contact)
        return contact

    def delete(self, contact_id: int) -> bool:
        db_contact = self.db.query(ContactModel).filter(ContactModel.id == contact_id).first()
        if db_contact:
            self.db.delete(db_contact)
            self.db.commit()
            return True
        return False
