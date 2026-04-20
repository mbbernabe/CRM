from typing import List, Optional
from src.domain.entities.work_item import WorkItemType, CustomFieldDefinition, WorkItemFieldGroup, IWorkItemRepository
from src.application.dtos.work_item_dto import WorkItemTypeCreateDTO, WorkItemTypeUpdateDTO

class ManageItemTypesUseCase:
    def __init__(self, repository: IWorkItemRepository):
        self.repository = repository

    def list_types(self, workspace_id: int) -> List[WorkItemType]:
        return self.repository.list_types(workspace_id)

    def create_type(self, dto: WorkItemTypeCreateDTO, workspace_id: int) -> WorkItemType:
        item_type = WorkItemType(
            name=dto.name,
            label=dto.label,
            icon=dto.icon,
            color=dto.color,
            workspace_id=workspace_id
        )
        created_type = self.repository.create_type(item_type)
        
        # Sincroniza campos e grupos imediatamente após a criação do registro base
        return self.update_type(
            created_type.id, 
            WorkItemTypeUpdateDTO(
                label=dto.label,
                icon=dto.icon,
                color=dto.color,
                field_definitions=dto.field_definitions,
                field_groups=dto.field_groups
            ), 
            workspace_id
        )

    def update_type(self, type_id: int, dto: WorkItemTypeUpdateDTO, workspace_id: int) -> Optional[WorkItemType]:
        field_defs = None
        if dto.field_definitions is not None:
            field_defs = [
                CustomFieldDefinition(
                    id=fd.id,
                    group_id=fd.group_id,
                    name=fd.name,
                    label=fd.label,
                    field_type=fd.field_type,
                    options=fd.options,
                    required=fd.required,
                    is_default=fd.is_default,
                    order=fd.order,
                    workspace_id=workspace_id,
                    source_field_id=fd.source_field_id
                ) for fd in dto.field_definitions
            ]
        
        field_groups = None
        if dto.field_groups is not None:
            field_groups = [
                WorkItemFieldGroup(
                    id=g.id,
                    name=g.name,
                    order=g.order,
                    workspace_id=workspace_id,
                    type_id=type_id
                ) for g in dto.field_groups
            ]
            
        return self.repository.update_type(
            type_id=type_id,
            workspace_id=workspace_id,
            label=dto.label,
            icon=dto.icon,
            color=dto.color,
            field_definitions=field_defs,
            field_groups=field_groups
        )

    def delete_type(self, type_id: int, workspace_id: int) -> bool:
        return self.repository.delete_type(type_id, workspace_id)

    def list_templates(self, workspace_id: int) -> List[WorkItemType]:
        return self.repository.list_system_templates(workspace_id)

    def import_template(self, template_id: int, workspace_id: int) -> WorkItemType:
        return self.repository.clone_type(template_id, workspace_id)

    def list_suggested_fields(self, local_type_id: int, workspace_id: int) -> List[CustomFieldDefinition]:
        return self.repository.list_suggested_fields(local_type_id, workspace_id)

    def import_global_field(self, global_field_id: int, local_type_id: int, workspace_id: int) -> CustomFieldDefinition:
        return self.repository.import_global_field(global_field_id, local_type_id, workspace_id)

    def check_for_updates(self, type_id: int, workspace_id: int):
        return self.repository.check_for_updates(type_id, workspace_id)

    def sync_from_global(self, type_id: int, source_field_ids: List[int], workspace_id: int) -> bool:
        return self.repository.sync_from_global(type_id, source_field_ids, workspace_id)

    def import_massive_fields(self, type_id: int, fields_data: List[dict], workspace_id: Optional[int] = None) -> int:
        return self.repository.import_massive_fields(type_id, fields_data, workspace_id)

