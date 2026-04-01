from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc
from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink
from src.infrastructure.database.models import PropertyDefinitionModel, PropertyGroupModel, EntityPropertyLinkModel

class SqlAlchemyPropertyRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Global Properties ---
    def list_all_global(self) -> List[PropertyDefinition]:
        db_props = self.db.query(PropertyDefinitionModel).all()
        return [
            PropertyDefinition(
                id=p.id,
                name=p.name,
                label=p.label,
                type=p.type,
                options=p.options,
                is_system=p.is_system
            )
            for p in db_props
        ]

    def get_global_by_name(self, name: str) -> Optional[PropertyDefinition]:
        p = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.name == name).first()
        if not p: return None
        return PropertyDefinition(
            id=p.id, name=p.name, label=p.label, type=p.type,
            options=p.options, is_system=p.is_system
        )

    def get_global_by_id(self, prop_id: int) -> Optional[PropertyDefinition]:
        p = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.id == prop_id).first()
        if not p: return None
        return PropertyDefinition(
            id=p.id, name=p.name, label=p.label, type=p.type,
            options=p.options, is_system=p.is_system
        )

    def save_global(self, prop: PropertyDefinition) -> PropertyDefinition:
        db_prop = PropertyDefinitionModel(
            name=prop.name,
            label=prop.label,
            type=prop.type,
            options=prop.options,
            is_system=prop.is_system
        )
        self.db.add(db_prop)
        self.db.commit()
        self.db.refresh(db_prop)
        prop.id = db_prop.id
        return prop

    def update_global(self, prop: PropertyDefinition) -> PropertyDefinition:
        db_prop = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.id == prop.id).first()
        if not db_prop: raise ValueError("Propriedade não encontrada")
        db_prop.label = prop.label
        db_prop.type = prop.type
        db_prop.options = prop.options
        self.db.commit()
        return prop

    def delete_global(self, prop_id: int) -> bool:
        db_prop = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.id == prop_id).first()
        if not db_prop: return False
        self.db.delete(db_prop)
        self.db.commit()
        return True

    # --- Linked Properties (Entity Type) ---
    def list_linked_properties(self, entity_type: str) -> List[EntityPropertyLink]:
        links = self.db.query(EntityPropertyLinkModel)\
            .filter(EntityPropertyLinkModel.entity_type == entity_type)\
            .order_by(EntityPropertyLinkModel.order.asc())\
            .all()
            
        result = []
        for ln in links:
            prop_def = PropertyDefinition(
                id=ln.property_def.id, name=ln.property_def.name, label=ln.property_def.label, 
                type=ln.property_def.type, options=ln.property_def.options, is_system=ln.property_def.is_system
            )
            group_def = None
            if ln.group:
                group_def = PropertyGroup(id=ln.group.id, name=ln.group.name, order=ln.group.order)
                
            result.append(EntityPropertyLink(
                id=ln.id,
                entity_type=ln.entity_type,
                property_id=ln.property_id,
                group_id=ln.group_id,
                order=ln.order,
                is_required=ln.is_required,
                property_def=prop_def,
                group=group_def
            ))
        return result

    def get_link_by_id(self, link_id: int) -> Optional[EntityPropertyLink]:
        ln = self.db.query(EntityPropertyLinkModel).filter(EntityPropertyLinkModel.id == link_id).first()
        if not ln: return None
        return EntityPropertyLink(id=ln.id, entity_type=ln.entity_type, property_id=ln.property_id, 
                                 group_id=ln.group_id, order=ln.order, is_required=ln.is_required)

    def get_link_by_entity_and_property(self, entity_type: str, property_id: int) -> Optional[EntityPropertyLink]:
        ln = self.db.query(EntityPropertyLinkModel)\
            .filter(EntityPropertyLinkModel.entity_type == entity_type, EntityPropertyLinkModel.property_id == property_id).first()
        if not ln: return None
        return EntityPropertyLink(id=ln.id, entity_type=ln.entity_type, property_id=ln.property_id, 
                                 group_id=ln.group_id, order=ln.order, is_required=ln.is_required)

    def link_property(self, link: EntityPropertyLink) -> EntityPropertyLink:
        db_link = EntityPropertyLinkModel(
            entity_type=link.entity_type,
            property_id=link.property_id,
            group_id=link.group_id,
            order=link.order,
            is_required=link.is_required
        )
        self.db.add(db_link)
        self.db.commit()
        self.db.refresh(db_link)
        link.id = db_link.id
        return link

    def update_link(self, link: EntityPropertyLink) -> EntityPropertyLink:
        db_link = self.db.query(EntityPropertyLinkModel).filter(EntityPropertyLinkModel.id == link.id).first()
        if not db_link: raise ValueError("Vínculo não encontrado")
        db_link.group_id = link.group_id
        db_link.is_required = link.is_required
        self.db.commit()
        return link

    def unlink_property(self, link_id: int) -> bool:
        db_link = self.db.query(EntityPropertyLinkModel).filter(EntityPropertyLinkModel.id == link_id).first()
        if not db_link: return False
        self.db.delete(db_link)
        self.db.commit()
        return True

    def update_linked_orders(self, orders: List[dict]):
        for item in orders:
            self.db.query(EntityPropertyLinkModel).filter(EntityPropertyLinkModel.id == item["id"]).update({"order": item["order"]})
        self.db.commit()

    # --- Property Groups ---
    def list_groups(self) -> List[PropertyGroup]:
        db_groups = self.db.query(PropertyGroupModel).order_by(PropertyGroupModel.order.asc()).all()
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

    def update_group_name(self, group_id: int, new_name: str) -> Optional[PropertyGroup]:
        db_group = self.db.query(PropertyGroupModel).filter(PropertyGroupModel.id == group_id).first()
        if not db_group: return None
        db_group.name = new_name
        self.db.commit()
        return PropertyGroup(id=db_group.id, name=db_group.name, order=db_group.order)
