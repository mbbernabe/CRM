from typing import List, Optional
from sqlalchemy.orm import Session
from src.domain.entities.property import PropertyDefinition
from src.infrastructure.database.models import PropertyDefinitionModel

class SqlAlchemyPropertyRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> List[PropertyDefinition]:
        db_props = self.db.query(PropertyDefinitionModel).all()
        return [
            PropertyDefinition(
                id=p.id,
                name=p.name,
                label=p.label,
                type=p.type,
                group=p.group,
                options=p.options,
                is_system=p.is_system,
                is_required=p.is_required
            )
            for p in db_props
        ]

    def get_by_name(self, name: str) -> Optional[PropertyDefinition]:
        p = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.name == name).first()
        if not p:
            return None
        return PropertyDefinition(
            id=p.id,
            name=p.name,
            label=p.label,
            type=p.type,
            group=p.group,
            options=p.options,
            is_system=p.is_system,
            is_required=p.is_required
        )

    def get_by_id(self, prop_id: int) -> Optional[PropertyDefinition]:
        p = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.id == prop_id).first()
        if not p:
            return None
        return PropertyDefinition(
            id=p.id,
            name=p.name,
            label=p.label,
            type=p.type,
            group=p.group,
            options=p.options,
            is_system=p.is_system,
            is_required=p.is_required
        )

    def save(self, prop: PropertyDefinition) -> PropertyDefinition:
        db_prop = PropertyDefinitionModel(
            name=prop.name,
            label=prop.label,
            type=prop.type,
            group=prop.group,
            options=prop.options,
            is_system=prop.is_system,
            is_required=prop.is_required
        )
        self.db.add(db_prop)
        self.db.commit()
        self.db.refresh(db_prop)
        prop.id = db_prop.id
        return prop

    def update(self, prop: PropertyDefinition) -> PropertyDefinition:
        db_prop = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.id == prop.id).first()
        if not db_prop:
            raise ValueError("Propriedade não encontrada")
        
        db_prop.label = prop.label
        db_prop.group = prop.group
        db_prop.type = prop.type
        db_prop.options = prop.options
        db_prop.is_required = prop.is_required
        
        self.db.commit()
        return prop

    def delete(self, prop_id: int) -> bool:
        db_prop = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.id == prop_id).first()
        if not db_prop:
            return False
        
        self.db.delete(db_prop)
        self.db.commit()
        return True
