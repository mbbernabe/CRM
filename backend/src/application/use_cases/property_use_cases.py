from typing import List, Optional
from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink
from src.domain.repositories.property_repository import IPropertyRepository

# --- Property Definition Use Cases (Antigas Global) ---
class ListPropertyDefinitionsUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, workspace_id: int) -> List[PropertyDefinition]:
        return self.repository.list_definitions(workspace_id)

class CreatePropertyDefinitionUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
        
    def execute(self, name: str, label: str, workspace_id: int, team_id: Optional[int] = None, type: str = "text", options: Optional[str] = None) -> PropertyDefinition:
        existing = self.repository.get_definition_by_name(name, workspace_id)
        if existing:
            raise ValueError(f"Propriedade com nome '{name}' já existe nesta Área de Trabalho.")
        new_prop = PropertyDefinition(name=name, label=label, type=type, options=options, team_id=team_id, workspace_id=workspace_id)
        return self.repository.save_definition(new_prop, workspace_id)

class UpdatePropertyDefinitionUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, prop_id: int, label: str, workspace_id: int, type: str, options: Optional[str] = None) -> PropertyDefinition:
        # Nota: O repositório precisa suportar get_definition_by_id ou similar
        prop = self.repository.get_definition_by_id(prop_id, workspace_id)
        if not prop: raise ValueError("Propriedade não encontrada")
        prop.label = label
        prop.type = type
        prop.options = options
        return self.repository.save_definition(prop, workspace_id)

class DeletePropertyDefinitionUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, prop_id: int, workspace_id: int) -> bool:
        return self.repository.delete_definition(prop_id, workspace_id)

# --- Linked Property Use Cases ---
class ListEntityLinksUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, entity_type: str, workspace_id: int) -> List[EntityPropertyLink]:
        return self.repository.list_entity_links(entity_type, workspace_id)

class CreateEntityLinkUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
        
    def execute(self, entity_type: str, property_id: int, workspace_id: int, team_id: Optional[int] = None, group_id: Optional[int] = None, order: int = 0) -> EntityPropertyLink:
        links = self.repository.list_entity_links(entity_type, workspace_id)
        if any(ln.property_id == property_id for ln in links):
            raise ValueError(f"Propriedade já está vinculada neste módulo.")
        
        link = EntityPropertyLink(entity_type=entity_type, property_id=property_id, group_id=group_id, order=order, team_id=team_id, workspace_id=workspace_id)
        return self.repository.save_entity_link(link, workspace_id)

class DeleteEntityLinkUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
        
    def execute(self, link_id: int, workspace_id: int) -> bool:
        return self.repository.delete_entity_link(link_id, workspace_id)

# --- Group Use Cases ---
class ListPropertyGroupsUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, workspace_id: int) -> List[PropertyGroup]:
        return self.repository.list_groups(workspace_id)

class CreatePropertyGroupUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, name: str, workspace_id: int, team_id: Optional[int] = None) -> PropertyGroup:
        groups = self.repository.list_groups(workspace_id)
        existing = next((g for g in groups if g.name == name), None)
        if existing: return existing
        return self.repository.save_group(PropertyGroup(name=name, order=999, team_id=team_id, workspace_id=workspace_id), workspace_id)

class ReorderGroupsUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, orders: List[dict], workspace_id: int):
        # Usando método utilitário se disponível no repo (ou iterando)
        if hasattr(self.repository, "update_group_orders"):
            self.repository.update_group_orders(orders, workspace_id)
        self.repository.update_group_orders(orders, workspace_id)

class ReorderLinksUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, orders: List[dict], workspace_id: int):
        if hasattr(self.repository, "update_link_orders"):
            self.repository.update_link_orders(orders, workspace_id)
