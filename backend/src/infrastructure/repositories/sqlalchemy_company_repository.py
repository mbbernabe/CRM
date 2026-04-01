from typing import List, Optional
from sqlalchemy.orm import Session
from src.domain.entities.company import Company
from src.infrastructure.database.models import CompanyModel, ContactModel, CompanyPropertyValueModel, PropertyDefinitionModel

class SqlAlchemyCompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> List[Company]:
        db_companies = self.db.query(CompanyModel).all()
        return [self._map_to_entity(c) for c in db_companies]

    def get_by_id(self, company_id: int) -> Optional[Company]:
        from sqlalchemy.orm import joinedload
        db_company = self.db.query(CompanyModel).options(
            joinedload(CompanyModel.property_values).joinedload(CompanyPropertyValueModel.property_def),
            joinedload(CompanyModel.contacts)
        ).filter(CompanyModel.id == company_id).first()
        if not db_company:
            return None
        return self._map_to_entity(db_company)

    def save(self, company: Company) -> Company:
        db_company = CompanyModel(
            name=company.name,
            domain=company.domain,
            status=company.status
        )
        self.db.add(db_company)
        self.db.commit()
        self.db.refresh(db_company)

        # Save properties
        for prop_name, prop_value in company.properties.items():
            prop_def = self.db.query(PropertyDefinitionModel).filter(
                PropertyDefinitionModel.name == prop_name,
                PropertyDefinitionModel.entity_type == "company"
            ).first()
            if prop_def:
                db_prop_val = CompanyPropertyValueModel(
                    company_id=db_company.id,
                    property_id=prop_def.id,
                    value=prop_value
                )
                self.db.add(db_prop_val)
        
        self.db.commit()
        return self.get_by_id(db_company.id)

    def update(self, company: Company) -> Company:
        db_company = self.db.query(CompanyModel).filter(CompanyModel.id == company.id).first()
        if not db_company:
            raise ValueError("Empresa não encontrada")
        
        db_company.name = company.name
        db_company.domain = company.domain
        db_company.status = company.status

        # Clear existing property values
        self.db.query(CompanyPropertyValueModel).filter(CompanyPropertyValueModel.company_id == company.id).delete()
        
        # Insert updated property values
        for prop_name, prop_value in company.properties.items():
            prop_def = self.db.query(PropertyDefinitionModel).filter(
                PropertyDefinitionModel.name == prop_name,
                PropertyDefinitionModel.entity_type == "company"
            ).first()
            if prop_def:
                db_prop_val = CompanyPropertyValueModel(
                    company_id=db_company.id,
                    property_id=prop_def.id,
                    value=prop_value
                )
                self.db.add(db_prop_val)
                
        self.db.commit()
        return self.get_by_id(db_company.id)

    def delete(self, company_id: int) -> bool:
        db_company = self.db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
        if not db_company:
            return False
        
        self.db.delete(db_company)
        self.db.commit()
        return True

    def link_contact(self, company_id: int, contact_id: int) -> bool:
        db_company = self.db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
        db_contact = self.db.query(ContactModel).filter(ContactModel.id == contact_id).first()
        if not db_company or not db_contact: return False
        
        if db_contact not in db_company.contacts:
            db_company.contacts.append(db_contact)
            self.db.commit()
        return True

    def unlink_contact(self, company_id: int, contact_id: int) -> bool:
        db_company = self.db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
        if not db_company: return False
        
        db_contact = next((c for c in db_company.contacts if c.id == contact_id), None)
        if db_contact:
            db_company.contacts.remove(db_contact)
            self.db.commit()
            return True
        return False

    def _map_to_entity(self, db_company: CompanyModel) -> Company:
        props = {}
        for pv in db_company.property_values:
            if pv.property_def:
                props[pv.property_def.name] = pv.value

        contacts = [{"id": c.id, "name": c.name} for c in db_company.contacts]

        return Company(
            id=db_company.id,
            name=db_company.name,
            domain=db_company.domain,
            status=db_company.status,
            properties=props,
            contacts=contacts,
            created_at=db_company.created_at
        )
