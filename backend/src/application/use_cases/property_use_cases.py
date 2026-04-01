from typing import List, Optional
from src.domain.entities.property import PropertyDefinition, PropertyGroup

class PropertyRepository:
    def list_all(self, entity_type: str = "contact") -> List[PropertyDefinition]: pass
    def list_all_ordered(self, entity_type: str = "contact") -> List[PropertyDefinition]: pass
    def save(self, prop: PropertyDefinition) -> PropertyDefinition: pass
    def get_by_name(self, name: str) -> Optional[PropertyDefinition]: pass
    def get_by_id(self, prop_id: int) -> Optional[PropertyDefinition]: pass
    def update(self, prop: PropertyDefinition) -> PropertyDefinition: pass
    def delete(self, prop_id: int) -> bool: pass
    def update_orders(self, orders: List[dict]): pass
    
    # Group methods
    def list_groups(self) -> List[PropertyGroup]: pass
    def save_group(self, group: PropertyGroup) -> PropertyGroup: pass
    def get_group_by_name(self, name: str) -> Optional[PropertyGroup]: pass
    def update_group_orders(self, orders: List[dict]): pass

class ListPropertiesUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, entity_type: str = "contact") -> List[PropertyDefinition]:
        return self.repository.list_all_ordered(entity_type=entity_type)

class CreatePropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, name: str, label: str, type: str = "text", group: str = "Outros", group_id: Optional[int] = None, entity_type: str = "contact", options: Optional[str] = None) -> PropertyDefinition:
        existing = self.repository.get_by_name(name)
        if existing:
            raise ValueError(f"Propriedade com nome '{name}' já existe")
            
        new_prop = PropertyDefinition(name=name, label=label, type=type, group=group, group_id=group_id, entity_type=entity_type, options=options)
        return self.repository.save(new_prop)

class UpdatePropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, prop_id: int, label: str, type: str, group: str, group_id: Optional[int] = None, entity_type: str = "contact", options: Optional[str] = None) -> PropertyDefinition:
        prop = self.repository.get_by_id(prop_id)
        if not prop:
            raise ValueError("Propriedade não encontrada")
        
        prop.label = label
        prop.type = type
        prop.group = group
        prop.group_id = group_id
        prop.entity_type = entity_type
        prop.options = options
        
        return self.repository.update(prop)

class DeletePropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, prop_id: int) -> bool:
        prop = self.repository.get_by_id(prop_id)
        if not prop:
            return False
            
        if prop.is_system:
            raise ValueError("Propriedades de sistema não podem ser excluídas")
            
        return self.repository.delete(prop_id)

class ReorderPropertiesUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, orders: List[dict]):
        # orders: [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
        self.repository.update_orders(orders)

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
        if existing:
            return existing
        new_group = PropertyGroup(name=name, order=999) # Default high order
        return self.repository.save_group(new_group)

class ReorderGroupsUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, orders: List[dict]):
        self.repository.update_group_orders(orders)
