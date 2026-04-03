from typing import List, Optional
from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink
from src.domain.repositories.property_repository import IPropertyRepository

# --- Property Definition Use Cases (Antigas Global) ---
class ListPropertyDefinitionsUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, team_id: int) -> List[PropertyDefinition]:
        return self.repository.list_definitions(team_id)

class CreatePropertyDefinitionUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
        
    def execute(self, name: str, label: str, team_id: int, type: str = "text", options: Optional[str] = None) -> PropertyDefinition:
        existing = self.repository.get_definition_by_name(name, team_id)
        if existing:
            raise ValueError(f"Propriedade com nome '{name}' já existe neste time.")
        new_prop = PropertyDefinition(name=name, label=label, type=type, options=options, team_id=team_id)
        return self.repository.save_definition(new_prop, team_id)

class UpdatePropertyDefinitionUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, prop_id: int, label: str, team_id: int, type: str, options: Optional[str] = None) -> PropertyDefinition:
        # Nota: O repositório precisa suportar get_definition_by_id ou similar
        # Por enquanto, vamos assumir que o repositório foi atualizado
        # Se não, vamos usar o que temos.
        # Na verdade, o SqlAlchemyPropertyRepository tem get_definition_by_id.
        prop = self.repository.get_definition_by_id(prop_id, team_id)
        if not prop: raise ValueError("Propriedade não encontrada")
        prop.label = label
        prop.type = type
        prop.options = options
        return self.repository.save_definition(prop, team_id)

class DeletePropertyDefinitionUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, prop_id: int, team_id: int) -> bool:
        return self.repository.delete_definition(prop_id, team_id)

# --- Linked Property Use Cases ---
class ListEntityLinksUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, entity_type: str, team_id: int) -> List[EntityPropertyLink]:
        return self.repository.list_entity_links(entity_type, team_id)

class CreateEntityLinkUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
        
    def execute(self, entity_type: str, property_id: int, team_id: int, group_id: Optional[int], order: int = 0) -> EntityPropertyLink:
        links = self.repository.list_entity_links(entity_type, team_id)
        if any(ln.property_id == property_id for ln in links):
            raise ValueError(f"Propriedade já está vinculada neste módulo.")
        
        link = EntityPropertyLink(entity_type=entity_type, property_id=property_id, group_id=group_id, order=order, team_id=team_id)
        return self.repository.save_entity_link(link, team_id)

class DeleteEntityLinkUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
        
    def execute(self, link_id: int, team_id: int) -> bool:
        return self.repository.delete_entity_link(link_id, team_id)

# --- Group Use Cases ---
class ListPropertyGroupsUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, team_id: int) -> List[PropertyGroup]:
        return self.repository.list_groups(team_id)

class CreatePropertyGroupUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, name: str, team_id: int) -> PropertyGroup:
        groups = self.repository.list_groups(team_id)
        existing = next((g for g in groups if g.name == name), None)
        if existing: return existing
        return self.repository.save_group(PropertyGroup(name=name, order=999, team_id=team_id), team_id)

class ReorderGroupsUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, orders: List[dict], team_id: int):
        # Usando método utilitário se disponível no repo (ou iterando)
        if hasattr(self.repository, "update_group_orders"):
            self.repository.update_group_orders(orders, team_id)

class ReorderLinksUseCase:
    def __init__(self, repository: IPropertyRepository):
        self.repository = repository
    def execute(self, orders: List[dict], team_id: int):
        if hasattr(self.repository, "update_link_orders"):
            self.repository.update_link_orders(orders, team_id)
