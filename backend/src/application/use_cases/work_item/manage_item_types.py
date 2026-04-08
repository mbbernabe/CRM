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
        
        # Create groups first to get IDs
        group_id_map = {} # temp_id or name -> real_id
        if dto.field_groups:
            for g_dto in dto.field_groups:
                g_entity = WorkItemFieldGroup(
                    name=g_dto.name,
                    order=g_dto.order,
                    workspace_id=workspace_id,
                    type_id=created_type.id
                )
                # We need a repository method to create a single group or handle it in update_type
                # For simplicity here, we'll use update_type to sync everything at the end
                pass

        # Use update_type logic to handle the complex syncing of groups and fields
        return self.update_type(
            created_type.id, 
            WorkItemTypeUpdateDTO(
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
                    order=fd.order,
                    workspace_id=workspace_id
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
