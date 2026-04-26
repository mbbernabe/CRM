from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List, Union
from enum import Enum

class FieldType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    MULTISELECT = "multiselect"
    TEXTAREA = "textarea"
    BOOLEAN = "boolean"
    CURRENCY = "currency"
    EMAIL = "email"
    CPF = "cpf"
    CNPJ = "cnpj"
    CEP = "cep"
    PHONE = "phone"

@dataclass
class WorkItemFieldGroup:
    id: Optional[Union[int, str]] = None
    name: str = ""
    order: int = 0
    workspace_id: Optional[int] = None
    type_id: int = 0

@dataclass
class CustomFieldDefinition:
    id: Optional[int] = None
    name: str = "" # slug: "expected_revenue"
    label: str = "" # display: "Receita Esperada"
    field_type: FieldType = FieldType.TEXT
    options: Optional[List[str]] = None # For select types
    required: bool = False
    is_default: bool = True
    order: int = 0
    group_id: Optional[Union[int, str]] = None
    workspace_id: Optional[int] = None
    source_field_id: Optional[int] = None

@dataclass
class WorkItemType:
    id: Optional[int] = None
    name: str = "" # internal slug: "deal"
    label: str = "" # friendly name: "Negócio"
    icon: Optional[str] = None
    color: Optional[str] = None
    workspace_id: Optional[int] = None
    is_system: bool = False
    is_installed: bool = False
    source_type_id: Optional[int] = None
    # Field definitions specifically for this type
    field_definitions: List[CustomFieldDefinition] = field(default_factory=list)
    field_groups: List[WorkItemFieldGroup] = field(default_factory=list)

@dataclass
class WorkItem:
    id: Optional[int] = None
    title: str = ""
    description: Optional[str] = None
    pipeline_id: int = 0
    stage_id: int = 0
    type_id: int = 0
    custom_fields: Dict[str, Any] = field(default_factory=dict)
    workspace_id: Optional[int] = None
    team_id: Optional[int] = None
    owner_id: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    recurrence_config: Optional[Dict[str, Any]] = None

    # Optional metadata to store friendly names for UI (computed at application layer)
    type_label: Optional[str] = None
    stage_name: Optional[str] = None
    owner_name: Optional[str] = None
    owner_initials: Optional[str] = None

class IWorkItemRepository:
    def create(self, work_item: WorkItem) -> WorkItem:
        raise NotImplementedError

    def get_by_id(self, id: int, workspace_id: int, team_id: Optional[int] = None) -> Optional[WorkItem]:
        raise NotImplementedError

    def update(self, work_item: WorkItem) -> WorkItem:
        raise NotImplementedError

    def list_by_pipeline(self, pipeline_id: int, workspace_id: int, team_id: Optional[int] = None) -> List[WorkItem]:
        raise NotImplementedError

    def list_by_stage(self, stage_id: int, workspace_id: int, team_id: Optional[int] = None) -> List[WorkItem]:
        raise NotImplementedError

    def list_by_type(self, type_id: int, workspace_id: int, team_id: Optional[int] = None) -> List[WorkItem]:
        raise NotImplementedError

    def delete(self, id: int, workspace_id: int) -> bool:
        raise NotImplementedError

    def search(self, query: str, workspace_id: int, limit: int = 10, team_id: Optional[int] = None) -> List[WorkItem]:
        """Busca itens pelo título no workspace, opcionalmente filtrando por time."""
        raise NotImplementedError

    def create_type(self, work_item_type: WorkItemType) -> WorkItemType:
        raise NotImplementedError

    def list_types(self, workspace_id: int) -> List[WorkItemType]:
        raise NotImplementedError

    def list_system_templates(self, workspace_id: int) -> List[WorkItemType]:
        raise NotImplementedError

    def clone_type(self, template_id: int, target_workspace_id: int) -> WorkItemType:
        raise NotImplementedError

    def create_field_definition(self, type_id: int, field_def: CustomFieldDefinition) -> CustomFieldDefinition:
        raise NotImplementedError

    def list_suggested_fields(self, local_type_id: int, workspace_id: int) -> List[CustomFieldDefinition]:
        """Lista campos do modelo global que ainda não foram importados para o tipo local."""
        raise NotImplementedError

    def import_global_field(self, global_field_id: int, local_type_id: int, workspace_id: int) -> CustomFieldDefinition:
        """Clona um campo específico da biblioteca global para o tipo local."""
        raise NotImplementedError

    def check_for_updates(self, type_id: int, workspace_id: int) -> List[Dict[str, Any]]:
        """Compara o tipo local com sua origem global e retorna as diferenças."""
        raise NotImplementedError

    def sync_from_global(self, type_id: int, source_field_ids: List[int], workspace_id: int) -> bool:
        """Aplica atualizações do modelo global ao tipo local de forma manual."""
        raise NotImplementedError
