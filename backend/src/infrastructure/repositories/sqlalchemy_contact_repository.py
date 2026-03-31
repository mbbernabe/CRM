from typing import List
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
