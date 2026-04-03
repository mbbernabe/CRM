from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.domain.entities.contact import Contact
from src.domain.repositories.contact_repository import IContactRepository
from src.infrastructure.database.models import ContactModel, CompanyModel, PropertyDefinitionModel, ContactPropertyValueModel

class SqlAlchemyContactRepository(IContactRepository):
    def __init__(self, db: Session):
        self.db = db

    def _map_to_domain(self, db_contact: ContactModel) -> Contact:
        # Converte a lista de modelos de valor para um dicionário {nome_prop: valor}
        properties = {}
        for pv in db_contact.property_values:
            properties[pv.property_def.name] = pv.value
            
        companies = [{"id": c.id, "name": c.name} for c in db_contact.companies]
            
        return Contact(
            id=db_contact.id,
            name=db_contact.name,
            email=db_contact.email,
            phone=db_contact.phone,
            status=db_contact.status,
            properties=properties,
            companies=companies,
            created_at=db_contact.created_at
        )

    def list_all(self) -> List[Contact]:
        db_contacts = self.db.query(ContactModel).options(
            joinedload(ContactModel.property_values).joinedload(ContactPropertyValueModel.property_def)
        ).all()
        return [self._map_to_domain(c) for c in db_contacts]

    def get_by_id(self, contact_id: int) -> Optional[Contact]:
        db_contact = self.db.query(ContactModel).options(
            joinedload(ContactModel.property_values).joinedload(ContactPropertyValueModel.property_def),
            joinedload(ContactModel.companies)
        ).filter(ContactModel.id == contact_id).first()
        
        if not db_contact:
            return None
        return self._map_to_domain(db_contact)

    def save(self, contact: Contact, company_ids: Optional[List[int]] = None) -> Contact:
        db_contact = ContactModel(
            name=contact.name,
            email=contact.email,
            phone=contact.phone,
            status=contact.status,
            created_at=contact.created_at
        )
        self.db.add(db_contact)
        self.db.flush() # Para pegar o ID ante do commit
        
        # Salva as propriedades dinâmicas
        if contact.properties:
            for name, value in contact.properties.items():
                prop_def = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.name == name).first()
                if prop_def:
                    pv = ContactPropertyValueModel(
                        contact_id=db_contact.id,
                        property_id=prop_def.id,
                        value=str(value) if value is not None else None
                    )
                    self.db.add(pv)
        
        # Vincula empresas se fornecido
        if company_ids:
            for c_id in company_ids:
                db_company = self.db.query(CompanyModel).filter(CompanyModel.id == c_id).first()
                if db_company:
                    db_contact.companies.append(db_company)
        
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
            
            # Atualiza propriedades (Simplificado: Remove e recria as que mudaram/existem)
            if contact.properties:
                # Remove valores antigos
                self.db.query(ContactPropertyValueModel).filter(ContactPropertyValueModel.contact_id == contact.id).delete()
                
                # Adiciona novos
                for name, value in contact.properties.items():
                    prop_def = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.name == name).first()
                    if prop_def:
                        pv = ContactPropertyValueModel(
                            contact_id=db_contact.id,
                            property_id=prop_def.id,
                            value=str(value) if value is not None else None
                        )
                        self.db.add(pv)
            
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

    def link_company(self, contact_id: int, company_id: int) -> bool:
        db_contact = self.db.query(ContactModel).filter(ContactModel.id == contact_id).first()
        db_company = self.db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
        if not db_contact or not db_company:
            return False
            
        if db_company not in db_contact.companies:
            db_contact.companies.append(db_company)
            self.db.commit()
        return True

    def unlink_company(self, contact_id: int, company_id: int) -> bool:
        db_contact = self.db.query(ContactModel).filter(ContactModel.id == contact_id).first()
        if not db_contact:
            return False
            
        db_company = next((c for c in db_contact.companies if c.id == company_id), None)
        if db_company:
            db_contact.companies.remove(db_company)
            self.db.commit()
            return True
        return False
