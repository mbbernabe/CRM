from typing import List, Optional
from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink

class PropertyRepository:
    # Global Props
    def list_all_global(self) -> List[PropertyDefinition]: pass
    def get_global_by_name(self, name: str) -> Optional[PropertyDefinition]: pass
    def get_global_by_id(self, prop_id: int) -> Optional[PropertyDefinition]: pass
    def save_global(self, prop: PropertyDefinition) -> PropertyDefinition: pass
    def update_global(self, prop: PropertyDefinition) -> PropertyDefinition: pass
    def delete_global(self, prop_id: int) -> bool: pass
    
    # Linked Props
    def list_linked_properties(self, entity_type: str) -> List[EntityPropertyLink]: pass
    def get_link_by_id(self, link_id: int) -> Optional[EntityPropertyLink]: pass
    def get_link_by_entity_and_property(self, entity_type: str, property_id: int) -> Optional[EntityPropertyLink]: pass
    def link_property(self, link: EntityPropertyLink) -> EntityPropertyLink: pass
    def update_link(self, link: EntityPropertyLink) -> EntityPropertyLink: pass
    def unlink_property(self, link_id: int) -> bool: pass
    def update_linked_orders(self, orders: List[dict]): pass
    
    # Groups
    def list_groups(self) -> List[PropertyGroup]: pass
    def save_group(self, group: PropertyGroup) -> PropertyGroup: pass
    def update_group_orders(self, orders: List[dict]): pass
    def get_group_by_name(self, name: str) -> Optional[PropertyGroup]: pass
    def update_group_name(self, group_id: int, new_name: str) -> Optional[PropertyGroup]: pass


# --- Global Property Use Cases ---
class ListGlobalPropertiesUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
    def execute(self) -> List[PropertyDefinition]:
        return self.repository.list_all_global()

class CreateGlobalPropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, name: str, label: str, type: str = "text", options: Optional[str] = None) -> PropertyDefinition:
        existing = self.repository.get_global_by_name(name)
        if existing:
            raise ValueError(f"Propriedade com nome '{name}' já existe")
        new_prop = PropertyDefinition(name=name, label=label, type=type, options=options)
        return self.repository.save_global(new_prop)

class UpdateGlobalPropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, prop_id: int, label: str, type: str, options: Optional[str] = None) -> PropertyDefinition:
        prop = self.repository.get_global_by_id(prop_id)
        if not prop: raise ValueError("Propriedade não encontrada")
        prop.label = label
        prop.type = type
        prop.options = options
        return self.repository.update_global(prop)

class DeleteGlobalPropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, prop_id: int) -> bool:
        prop = self.repository.get_global_by_id(prop_id)
        if not prop: return False
        if prop.is_system: raise ValueError("Propriedades de sistema não podem ser excluídas")
        return self.repository.delete_global(prop_id)


# --- Linked Property Use Cases ---
class ListLinkedPropertiesUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
    def execute(self, entity_type: str) -> List[EntityPropertyLink]:
        return self.repository.list_linked_properties(entity_type)

class LinkPropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, entity_type: str, property_id: int, group_id: Optional[int], order: int = 0) -> EntityPropertyLink:
        existing = self.repository.get_link_by_entity_and_property(entity_type, property_id)
        if existing:
            raise ValueError(f"Propriedade já está vinculada neste módulo")
        link = EntityPropertyLink(entity_type=entity_type, property_id=property_id, group_id=group_id, order=order)
        return self.repository.link_property(link)

class UpdatePropertyLinkUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, link_id: int, group_id: Optional[int], is_required: bool) -> EntityPropertyLink:
        link = self.repository.get_link_by_id(link_id)
        if not link: raise ValueError("Vínculo não encontrado")
        link.group_id = group_id
        link.is_required = is_required
        return self.repository.update_link(link)

class UnlinkPropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, link_id: int) -> bool:
        return self.repository.unlink_property(link_id)

class ReorderLinkedPropertiesUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, orders: List[dict]):
        self.repository.update_linked_orders(orders)


# --- Group Use Cases ---
class ListGroupsUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
    def execute(self) -> List[PropertyGroup]:
        return self.repository.list_groups()

class CreateGroupUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
    def execute(self, name: str) -> PropertyGroup:
        existing = self.repository.get_group_by_name(name)
        if existing: return existing
        return self.repository.save_group(PropertyGroup(name=name, order=999))

class ReorderGroupsUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
    def execute(self, orders: List[dict]):
        self.repository.update_group_orders(orders)

class RenameGroupUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
    def execute(self, group_id: int, new_name: str) -> PropertyGroup:
        existing = self.repository.get_group_by_name(new_name)
        if existing and existing.id != group_id:
            raise ValueError(f"Grupo '{new_name}' já existe")
        updated = self.repository.update_group_name(group_id, new_name)
        if not updated: raise ValueError("Grupo não encontrado")
        return updated
