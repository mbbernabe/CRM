from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.domain.entities.work_item import WorkItem, WorkItemType, CustomFieldDefinition, IWorkItemRepository
from src.infrastructure.database.models import WorkItemModel, WorkItemTypeModel, WorkItemFieldDefinitionModel
import json

class WorkItemRepository(IWorkItemRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: WorkItemModel) -> WorkItem:
        entity = WorkItem(
            id=model.id,
            title=model.title,
            description=model.description,
            pipeline_id=model.pipeline_id,
            stage_id=model.stage_id,
            type_id=model.type_id,
            custom_fields=model.custom_fields or {},
            workspace_id=model.workspace_id,
            owner_id=model.owner_id,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
        
        # Hydrate owner info if available (e.g. from joinedload)
        if hasattr(model, 'owner') and model.owner:
            entity.owner_name = model.owner.name
            # Calcula iniciais (ex: "Marcelo Bernabé" -> "MB")
            names = model.owner.name.split()
            if len(names) >= 2:
                entity.owner_initials = (names[0][0] + names[-1][0]).upper()
            elif len(names) == 1:
                entity.owner_initials = names[0][:2].upper()

        return entity

    def create(self, work_item: WorkItem) -> WorkItem:
        model = WorkItemModel(
            title=work_item.title,
            description=work_item.description,
            pipeline_id=work_item.pipeline_id,
            stage_id=work_item.stage_id,
            type_id=work_item.type_id,
            custom_fields=work_item.custom_fields,
            workspace_id=work_item.workspace_id,
            owner_id=work_item.owner_id
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._to_entity(model)

    def get_by_id(self, id: int, workspace_id: int) -> Optional[WorkItem]:
        model = self.db.query(WorkItemModel).filter(
            WorkItemModel.id == id, 
            WorkItemModel.workspace_id == workspace_id
        ).first()
        return self._to_entity(model) if model else None

    def update(self, work_item: WorkItem) -> WorkItem:
        model = self.db.query(WorkItemModel).filter(
            WorkItemModel.id == work_item.id,
            WorkItemModel.workspace_id == work_item.workspace_id
        ).first()
        if model:
            model.title = work_item.title
            model.description = work_item.description
            model.pipeline_id = work_item.pipeline_id
            model.stage_id = work_item.stage_id
            model.type_id = work_item.type_id
            model.custom_fields = work_item.custom_fields
            model.owner_id = work_item.owner_id
            self.db.commit()
            self.db.refresh(model)
            return self._to_entity(model)
        return work_item

    def list_by_pipeline(self, pipeline_id: int, workspace_id: int) -> List[WorkItem]:
        models = self.db.query(WorkItemModel).options(
            joinedload(WorkItemModel.owner)
        ).filter(
            WorkItemModel.pipeline_id == pipeline_id,
            WorkItemModel.workspace_id == workspace_id
        ).all()
        return [self._to_entity(m) for m in models]

    def list_by_stage(self, stage_id: int, workspace_id: int) -> List[WorkItem]:
        models = self.db.query(WorkItemModel).options(
            joinedload(WorkItemModel.owner)
        ).filter(
            WorkItemModel.stage_id == stage_id,
            WorkItemModel.workspace_id == workspace_id
        ).all()
        return [self._to_entity(m) for m in models]

    def delete(self, id: int, workspace_id: int) -> bool:
        model = self.db.query(WorkItemModel).filter(
            WorkItemModel.id == id,
            WorkItemModel.workspace_id == workspace_id
        ).first()
        if model:
            self.db.delete(model)
            self.db.commit()
            return True
        return False

    def create_type(self, work_item_type: WorkItemType) -> WorkItemType:
        model = WorkItemTypeModel(
            name=work_item_type.name,
            label=work_item_type.label,
            icon=work_item_type.icon,
            color=work_item_type.color,
            workspace_id=work_item_type.workspace_id
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        work_item_type.id = model.id
        return work_item_type

    def list_types(self, workspace_id: int) -> List[WorkItemType]:
        models = self.db.query(WorkItemTypeModel).filter(
            WorkItemTypeModel.workspace_id == workspace_id
        ).all()
        types = []
        for m in models:
            item_type = WorkItemType(
                id=m.id,
                name=m.name,
                label=m.label,
                icon=m.icon,
                color=m.color,
                workspace_id=m.workspace_id
            )
            # Load field definitions
            item_type.field_definitions = [
                CustomFieldDefinition(
                    id=fd.id,
                    name=fd.name,
                    label=fd.label,
                    field_type=fd.field_type,
                    options=json.loads(fd.options_json) if fd.options_json else None,
                    required=fd.is_required,
                    order=fd.order,
                    workspace_id=m.workspace_id
                ) for fd in m.field_definitions
            ]
            types.append(item_type)
        return types

    def create_field_definition(self, type_id: int, field_def: CustomFieldDefinition) -> CustomFieldDefinition:
        model = WorkItemFieldDefinitionModel(
            type_id=type_id,
            name=field_def.name,
            label=field_def.label,
            field_type=field_def.field_type,
            options_json=json.dumps(field_def.options) if field_def.options else None,
            is_required=field_def.required,
            order=field_def.order
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        field_def.id = model.id
        return field_def

    def update_type(self, type_id: int, workspace_id: int, label: Optional[str] = None, icon: Optional[str] = None, color: Optional[str] = None, field_definitions: Optional[List[CustomFieldDefinition]] = None) -> Optional[WorkItemType]:
        model = self.db.query(WorkItemTypeModel).filter(
            WorkItemTypeModel.id == type_id,
            WorkItemTypeModel.workspace_id == workspace_id
        ).first()
        
        if not model:
            return None
            
        if label is not None: model.label = label
        if icon is not None: model.icon = icon
        if color is not None: model.color = color
        
        if field_definitions is not None:
            # Sync field definitions
            current_field_ids = [fd.id for fd in model.field_definitions]
            new_field_ids = [fd.id for fd in field_definitions if fd.id is not None]
            
            # Remove
            for fd in model.field_definitions:
                if fd.id not in new_field_ids:
                    self.db.delete(fd)
            
            # Add or Update
            for fd_entity in field_definitions:
                if fd_entity.id and fd_entity.id in current_field_ids:
                    # Update
                    fd_model = self.db.query(WorkItemFieldDefinitionModel).filter(WorkItemFieldDefinitionModel.id == fd_entity.id).first()
                    if fd_model:
                        fd_model.label = fd_entity.label
                        fd_model.field_type = fd_entity.field_type
                        fd_model.options_json = json.dumps(fd_entity.options) if fd_entity.options else None
                        fd_model.is_required = fd_entity.required
                        fd_model.order = fd_entity.order
                else:
                    # Create
                    new_fd_model = WorkItemFieldDefinitionModel(
                        type_id=type_id,
                        name=fd_entity.name,
                        label=fd_entity.label,
                        field_type=fd_entity.field_type,
                        options_json=json.dumps(fd_entity.options) if fd_entity.options else None,
                        is_required=fd_entity.required,
                        order=fd_entity.order
                    )
                    self.db.add(new_fd_model)
        
        self.db.commit()
        return self.get_type_by_id(type_id, workspace_id)

    def delete_type(self, type_id: int, workspace_id: int) -> bool:
        model = self.db.query(WorkItemTypeModel).filter(
            WorkItemTypeModel.id == type_id,
            WorkItemTypeModel.workspace_id == workspace_id
        ).first()
        if model:
            # Check if there are work items using this type
            count = self.db.query(WorkItemModel).filter(WorkItemModel.type_id == type_id).count()
            if count > 0:
                raise ValueError("Não é possível excluir um tipo que possui itens vinculados.")
            
            self.db.delete(model)
            self.db.commit()
            return True
        return False

    def get_type_by_id(self, type_id: int, workspace_id: int) -> Optional[WorkItemType]:
        m = self.db.query(WorkItemTypeModel).filter(
            WorkItemTypeModel.id == type_id,
            WorkItemTypeModel.workspace_id == workspace_id
        ).first()
        if not m:
            return None
            
        item_type = WorkItemType(
            id=m.id,
            name=m.name,
            label=m.label,
            icon=m.icon,
            color=m.color,
            workspace_id=m.workspace_id
        )
        item_type.field_definitions = [
            CustomFieldDefinition(
                id=fd.id,
                name=fd.name,
                label=fd.label,
                field_type=fd.field_type,
                options=json.loads(fd.options_json) if fd.options_json else None,
                required=fd.is_required,
                order=fd.order,
                workspace_id=m.workspace_id
            ) for fd in m.field_definitions
        ]
        return item_type
