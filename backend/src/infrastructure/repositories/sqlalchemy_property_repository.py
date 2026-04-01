from typing import List, Optional
from sqlalchemy.orm import Session
from src.domain.entities.property import PropertyDefinition, PropertyGroup
from src.infrastructure.database.models import PropertyDefinitionModel, PropertyGroupModel

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
                group_id=p.group_id,
                options=p.options,
                order=p.order,
                is_system=p.is_system,
                is_required=p.is_required
            )
            for p in db_props
        ]

    def list_all_ordered(self) -> List[PropertyDefinition]:
        db_props = self.db.query(PropertyDefinitionModel).order_by(PropertyDefinitionModel.order).all()
        return [
            PropertyDefinition(
                id=p.id,
                name=p.name,
                label=p.label,
                type=p.type,
                group=p.group,
                group_id=p.group_id,
                options=p.options,
                order=p.order,
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
            group_id=p.group_id,
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
            group_id=p.group_id,
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
            group_id=prop.group_id,
            options=prop.options,
            order=prop.order,
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
        db_prop.group_id = prop.group_id
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

    def update_orders(self, orders: List[dict]):
        for item in orders:
            self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.id == item["id"]).update({"order": item["order"]})
        self.db.commit()

    # Group methods
    def list_groups(self) -> List[PropertyGroup]:
        db_groups = self.db.query(PropertyGroupModel).order_by(PropertyGroupModel.order).all()
        return [PropertyGroup(id=g.id, name=g.name, order=g.order) for g in db_groups]

    def save_group(self, group: PropertyGroup) -> PropertyGroup:
        db_group = PropertyGroupModel(name=group.name, order=group.order)
        self.db.add(db_group)
        self.db.commit()
        self.db.refresh(db_group)
        group.id = db_group.id
        return group

    def update_group_orders(self, orders: List[dict]):
        for item in orders:
            self.db.query(PropertyGroupModel).filter(PropertyGroupModel.id == item["id"]).update({"order": item["order"]})
        self.db.commit()

    def get_group_by_name(self, name: str) -> Optional[PropertyGroup]:
        g = self.db.query(PropertyGroupModel).filter(PropertyGroupModel.name == name).first()
        if not g: return None
        return PropertyGroup(id=g.id, name=g.name, order=g.order)
