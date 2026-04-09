from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.domain.entities.work_item import WorkItem, WorkItemType, CustomFieldDefinition, WorkItemFieldGroup, IWorkItemRepository
from src.infrastructure.database.models import WorkItemModel, WorkItemTypeModel, WorkItemFieldDefinitionModel, WorkItemFieldGroupModel
import json
import logging

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

    def list_by_type(self, type_id: int, workspace_id: int) -> List[WorkItem]:
        models = self.db.query(WorkItemModel).options(
            joinedload(WorkItemModel.owner)
        ).filter(
            WorkItemModel.type_id == type_id,
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
            workspace_id=work_item_type.workspace_id,
            is_system=work_item_type.is_system
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        work_item_type.id = model.id
        return work_item_type

    def list_types(self, workspace_id: int) -> List[WorkItemType]:
        models = self.db.query(WorkItemTypeModel).filter(
            (WorkItemTypeModel.workspace_id == workspace_id) | (WorkItemTypeModel.workspace_id == None)
        ).all()
        types = []
        for m in models:
            item_type = self._type_model_to_entity(m)
            types.append(item_type)
        return types

    def _type_model_to_entity(self, m: WorkItemTypeModel) -> WorkItemType:
        item_type = WorkItemType(
            id=m.id,
            name=m.name,
            label=m.label,
            icon=m.icon,
            color=m.color,
            workspace_id=m.workspace_id,
            is_system=m.is_system
        )
        # Load field groups
        item_type.field_groups = [
            WorkItemFieldGroup(
                id=g.id,
                name=g.name,
                order=g.order,
                workspace_id=g.workspace_id,
                type_id=g.type_id
            ) for g in m.field_groups
        ]
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
                group_id=fd.group_id,
                workspace_id=m.workspace_id
            ) for fd in m.field_definitions
        ]
        return item_type

    def create_field_definition(self, type_id: int, field_def: CustomFieldDefinition) -> CustomFieldDefinition:
        model = WorkItemFieldDefinitionModel(
            type_id=type_id,
            group_id=field_def.group_id,
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

    def update_type(self, type_id: int, workspace_id: int, label: Optional[str] = None, icon: Optional[str] = None, color: Optional[str] = None, field_definitions: Optional[List[CustomFieldDefinition]] = None, field_groups: Optional[List[WorkItemFieldGroup]] = None) -> Optional[WorkItemType]:
        logger = logging.getLogger(__name__)
        try:
            model = self.db.query(WorkItemTypeModel).filter(
                (WorkItemTypeModel.id == type_id) & 
                ((WorkItemTypeModel.workspace_id == workspace_id) | (WorkItemTypeModel.workspace_id == None))
            ).first()
            
            if not model:
                logger.warning(f"Tipo {type_id} não encontrado para workspace {workspace_id}")
                return None
                
            if label is not None: model.label = label
            if icon is not None: model.icon = icon
            if color is not None: model.color = color
            
            # Map for resolving group_id (temp_identifier -> real_id)
            group_id_map = {} # Can be name or temp-ID

            if field_groups is not None:
                # Sync field groups
                # Use int conversion for safety if frontend sends strings
                try:
                    new_group_ids = [int(g.id) for g in field_groups if g.id is not None]
                except (ValueError, TypeError):
                    # Fallback if some IDs are not numeric strings
                    new_group_ids = [g.id for g in field_groups if isinstance(g.id, int)]

                for g_model in list(model.field_groups): # Use list() to avoid mutation issues
                    if g_model.id not in new_group_ids:
                        self.db.delete(g_model)
                
                for g_entity in field_groups:
                    # Resolve numeric IDs
                    actual_id = None
                    try:
                        if g_entity.id is not None and str(g_entity.id).isdigit():
                            actual_id = int(g_entity.id)
                    except: pass

                    if actual_id:
                        g_model = self.db.query(WorkItemFieldGroupModel).filter(WorkItemFieldGroupModel.id == actual_id).first()
                        if g_model:
                            g_model.name = g_entity.name
                            g_model.order = g_entity.order
                            group_id_map[str(g_entity.id)] = g_model.id
                            group_id_map[g_entity.name] = g_model.id
                    else:
                        new_g = WorkItemFieldGroupModel(
                            type_id=type_id,
                            name=g_entity.name,
                            order=g_entity.order,
                            workspace_id=workspace_id
                        )
                        self.db.add(new_g)
                        self.db.flush() # Get the new ID immediately
                        group_id_map[g_entity.name] = new_g.id
                        if g_entity.id: # Capture temp ID if present
                             group_id_map[str(g_entity.id)] = new_g.id
                
                self.db.flush()

            if field_definitions is not None:
                # Sync field definitions
                current_field_ids = [fd.id for fd in model.field_definitions]
                
                resolved_field_definitions = []
                for fd in field_definitions:
                    # Resolve group_id
                    final_group_id = None
                    if fd.group_id is not None:
                        if isinstance(fd.group_id, int):
                            final_group_id = fd.group_id
                        elif str(fd.group_id) in group_id_map:
                            final_group_id = group_id_map[str(fd.group_id)]
                        elif str(fd.group_id).isdigit():
                            final_group_id = int(fd.group_id)
                    
                    fd.group_id = final_group_id
                    resolved_field_definitions.append(fd)

                new_field_ids = [int(fd.id) for fd in resolved_field_definitions if fd.id is not None]
                
                # Remove
                for fd_model in list(model.field_definitions):
                    if fd_model.id not in new_field_ids:
                        self.db.delete(fd_model)
                
                # Add or Update
                for fd_entity in resolved_field_definitions:
                    actual_fd_id = None
                    if fd_entity.id is not None:
                        try: actual_fd_id = int(fd_entity.id)
                        except: pass

                    if actual_fd_id and actual_fd_id in current_field_ids:
                        # Update
                        fd_model = self.db.query(WorkItemFieldDefinitionModel).filter(WorkItemFieldDefinitionModel.id == actual_fd_id).first()
                        if fd_model:
                            fd_model.label = fd_entity.label
                            fd_model.field_type = fd_entity.field_type
                            fd_model.options_json = json.dumps(fd_entity.options) if fd_entity.options else None
                            fd_model.is_required = fd_entity.required
                            fd_model.order = fd_entity.order
                            fd_model.group_id = fd_entity.group_id
                    else:
                        # Create
                        new_fd_model = WorkItemFieldDefinitionModel(
                            type_id=type_id,
                            group_id=fd_entity.group_id,
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
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao atualizar WorkItemType {type_id}: {str(e)}", exc_info=True)
            raise e

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
            (WorkItemTypeModel.id == type_id) & 
            ((WorkItemTypeModel.workspace_id == workspace_id) | (WorkItemTypeModel.workspace_id == None))
        ).first()
        if not m:
            return None
            
        return self._type_model_to_entity(m)
