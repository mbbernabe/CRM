from typing import List, Optional
from src.domain.entities.property import PropertyDefinition

class PropertyRepository:
    def list_all(self) -> List[PropertyDefinition]: pass
    def save(self, prop: PropertyDefinition) -> PropertyDefinition: pass
    def get_by_name(self, name: str) -> Optional[PropertyDefinition]: pass
    def get_by_id(self, prop_id: int) -> Optional[PropertyDefinition]: pass
    def update(self, prop: PropertyDefinition) -> PropertyDefinition: pass
    def delete(self, prop_id: int) -> bool: pass

class ListPropertiesUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self) -> List[PropertyDefinition]:
        return self.repository.list_all()

class CreatePropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, name: str, label: str, type: str = "text", group: str = "Outros", options: Optional[str] = None) -> PropertyDefinition:
        existing = self.repository.get_by_name(name)
        if existing:
            raise ValueError(f"Propriedade com nome '{name}' já existe")
            
        new_prop = PropertyDefinition(name=name, label=label, type=type, group=group, options=options)
        return self.repository.save(new_prop)

class UpdatePropertyUseCase:
    def __init__(self, repository: PropertyRepository):
        self.repository = repository
        
    def execute(self, prop_id: int, label: str, type: str, group: str, options: Optional[str] = None) -> PropertyDefinition:
        prop = self.repository.get_by_id(prop_id)
        if not prop:
            raise ValueError("Propriedade não encontrada")
        
        prop.label = label
        prop.type = type
        prop.group = group
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
