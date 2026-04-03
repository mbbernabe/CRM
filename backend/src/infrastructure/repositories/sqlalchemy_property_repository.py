from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc
from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink
from src.infrastructure.database.models import PropertyDefinitionModel, PropertyGroupModel, EntityPropertyLinkModel

from src.domain.repositories.property_repository import IPropertyRepository

class SqlAlchemyPropertyRepository(IPropertyRepository):
    def __init__(self, db: Session):
        self.db = db

    def list_groups(self, team_id: int) -> List[PropertyGroup]:
        db_groups = self.db.query(PropertyGroupModel)\
            .filter(PropertyGroupModel.team_id == team_id)\
            .order_by(PropertyGroupModel.order.asc()).all()
        return [PropertyGroup(id=g.id, name=g.name, order=g.order, team_id=g.team_id) for g in db_groups]

    def save_group(self, group: PropertyGroup, team_id: int) -> PropertyGroup:
        db_group = PropertyGroupModel(name=group.name, order=group.order, team_id=team_id)
        self.db.add(db_group)
        self.db.commit()
        self.db.refresh(db_group)
        group.id = db_group.id
        group.team_id = db_group.team_id
        return group

    def list_definitions(self, team_id: int) -> List[PropertyDefinition]:
        db_props = self.db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.team_id == team_id).all()
        return [
            PropertyDefinition(
                id=p.id, name=p.name, label=p.label, type=p.type,
                options=p.options, is_system=p.is_system, team_id=p.team_id
            )
            for p in db_props
        ]

    def save_definition(self, prop_def: PropertyDefinition, team_id: int) -> PropertyDefinition:
        db_prop = PropertyDefinitionModel(
            name=prop_def.name,
            label=prop_def.label,
            type=prop_def.type,
            options=prop_def.options,
            is_system=prop_def.is_system,
            team_id=team_id
        )
        self.db.add(db_prop)
        self.db.commit()
        self.db.refresh(db_prop)
        prop_def.id = db_prop.id
        prop_def.team_id = team_id
        return prop_def

    def get_definition_by_name(self, name: str, team_id: int) -> Optional[PropertyDefinition]:
        p = self.db.query(PropertyDefinitionModel).filter(
            PropertyDefinitionModel.name == name,
            PropertyDefinitionModel.team_id == team_id
        ).first()
        if not p: return None
        return PropertyDefinition(
            id=p.id, name=p.name, label=p.label, type=p.type,
            options=p.options, is_system=p.is_system, team_id=p.team_id
        )

    def list_entity_links(self, entity_type: str, team_id: int) -> List[EntityPropertyLink]:
        links = self.db.query(EntityPropertyLinkModel)\
            .filter(EntityPropertyLinkModel.entity_type == entity_type, EntityPropertyLinkModel.team_id == team_id)\
            .order_by(EntityPropertyLinkModel.order.asc())\
            .all()
            
        result = []
        for ln in links:
            prop_def = PropertyDefinition(
                id=ln.property_def.id, name=ln.property_def.name, label=ln.property_def.label, 
                type=ln.property_def.type, options=ln.property_def.options, 
                is_system=ln.property_def.is_system, team_id=ln.property_def.team_id
            )
            group_def = None
            if ln.group:
                group_def = PropertyGroup(id=ln.group.id, name=ln.group.name, order=ln.group.order, team_id=ln.group.team_id)
                
            result.append(EntityPropertyLink(
                id=ln.id,
                entity_type=ln.entity_type,
                property_id=ln.property_id,
                group_id=ln.group_id,
                order=ln.order,
                is_required=ln.is_required,
                team_id=ln.team_id,
                property_def=prop_def,
                group=group_def
            ))
        return result

    def save_entity_link(self, link: EntityPropertyLink, team_id: int) -> EntityPropertyLink:
        db_link = EntityPropertyLinkModel(
            entity_type=link.entity_type,
            property_id=link.property_id,
            group_id=link.group_id,
            order=link.order,
            is_required=link.is_required,
            team_id=team_id
        )
        self.db.add(db_link)
        self.db.commit()
        self.db.refresh(db_link)
        link.id = db_link.id
        link.team_id = team_id
        return link

    def delete_entity_link(self, link_id: int, team_id: int) -> bool:
        db_link = self.db.query(EntityPropertyLinkModel).filter(
            EntityPropertyLinkModel.id == link_id,
            EntityPropertyLinkModel.team_id == team_id
        ).first()
        if not db_link: return False
        self.db.delete(db_link)
        self.db.commit()
        return True

    # -- Métodos Utilitários Adicionais (Não explicitados na interface básica mas úteis) --
    def update_group_orders(self, orders: List[dict], team_id: int):
        for item in orders:
            self.db.query(PropertyGroupModel).filter(
                PropertyGroupModel.id == item["id"],
                PropertyGroupModel.team_id == team_id
            ).update({"order": item["order"]})
        self.db.commit()

    def update_link_orders(self, orders: List[dict], team_id: int):
        for item in orders:
            self.db.query(EntityPropertyLinkModel).filter(
                EntityPropertyLinkModel.id == item["id"],
                EntityPropertyLinkModel.team_id == team_id
            ).update({"order": item["order"]})
        self.db.commit()
