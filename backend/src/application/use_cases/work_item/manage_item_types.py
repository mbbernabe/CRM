from typing import List, Optional
from src.domain.entities.work_item import WorkItemType, CustomFieldDefinition, IWorkItemRepository
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
        
        # Create fields if any
        if dto.field_definitions:
            for fd_dto in dto.field_definitions:
                field_def = CustomFieldDefinition(
                    name=fd_dto.name,
                    label=fd_dto.label,
                    field_type=fd_dto.field_type,
                    options=fd_dto.options,
                    required=fd_dto.required,
                    order=fd_dto.order,
                    workspace_id=workspace_id
                )
                self.repository.create_field_definition(created_type.id, field_def)
                
        return self.repository.get_type_by_id(created_type.id, workspace_id)

    def update_type(self, type_id: int, dto: WorkItemTypeUpdateDTO, workspace_id: int) -> Optional[WorkItemType]:
        field_defs = None
        if dto.field_definitions is not None:
            field_defs = [
                CustomFieldDefinition(
                    id=fd.id,
                    name=fd.name,
                    label=fd.label,
                    field_type=fd.field_type,
                    options=fd.options,
                    required=fd.required,
                    order=fd.order,
                    workspace_id=workspace_id
                ) for fd in dto.field_definitions
            ]
            
        return self.repository.update_type(
            type_id=type_id,
            workspace_id=workspace_id,
            label=dto.label,
            icon=dto.icon,
            color=dto.color,
            field_definitions=field_defs
        )

    def delete_type(self, type_id: int, workspace_id: int) -> bool:
        return self.repository.delete_type(type_id, workspace_id)
