from typing import List, Dict
from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from src.infrastructure.database.models import WorkItemModel, WorkItemTypeModel, WorkspaceModel
from src.infrastructure.repositories.work_item_repository import IWorkItemRepository

class GetMyTasksUseCase:
    def __init__(self, work_item_repo: IWorkItemRepository):
        self.work_item_repo = work_item_repo

    def execute(self, user_id: int, workspace_id: int) -> Dict[str, List[dict]]:
        db = self.work_item_repo.db
        
        # 1. Identificar tipos de "Tarefa"
        task_types = db.query(WorkItemTypeModel).filter(
            or_(
                WorkItemTypeModel.workspace_id == workspace_id,
                WorkItemTypeModel.workspace_id == None
            ),
            or_(
                WorkItemTypeModel.label.ilike('%Tarefa%'),
                WorkItemTypeModel.name.ilike('%task%')
            )
        ).all()
        
        type_ids = [t.id for t in task_types]
        
        if not type_ids:
            return {
                "meu_dia": [], "importante": [], "planejado": [], 
                "atribuido": [], "concluidas": [], "todas": []
            }

        # 2. Buscar todas as tarefas no workspace
        query = db.query(WorkItemModel).options(
            joinedload(WorkItemModel.work_item_type),
            joinedload(WorkItemModel.workspace)
        ).filter(
            WorkItemModel.workspace_id == workspace_id,
            WorkItemModel.type_id.in_(type_ids)
        )
        
        all_tasks_models = query.all()
        
        # 3. Filtrar e Categorizar
        current_user_id = int(user_id)
        # Usar data local do servidor para comparação
        today_str = datetime.now().strftime('%Y-%m-%d')
        
        result = {
            "meu_dia": [],
            "importante": [],
            "planejado": [],
            "atribuido": [],
            "concluidas": [],
            "todas": []
        }
        
        for task in all_tasks_models:
            task_dict = self._to_dict(task)
            custom = task_dict.get('custom_fields', {})
            
            # Verificar se está concluída
            is_completed = custom.get('is_completed') is True
            
            # Lista Geral (Todas) - inclui concluídas
            result["todas"].append(task_dict)
            
            if is_completed:
                # Somente para a lista de concluídas
                if task.owner_id == current_user_id:
                    result["concluidas"].append(task_dict)
                continue # Não aparece nas outras listas se concluída

            # Filtro por Responsável para as listas inteligentes
            if task.owner_id == current_user_id:
                result["atribuido"].append(task_dict)
                
                # Importante
                if custom.get('is_important') is True:
                    result["importante"].append(task_dict)
                
                # Meu Dia
                due_date = custom.get('due_date')
                start_date = custom.get('start_date')
                if due_date == today_str or start_date == today_str:
                    result["meu_dia"].append(task_dict)
                    
                # Planejado
                if start_date or due_date:
                    result["planejado"].append(task_dict)
                
        return result

    def _to_dict(self, task: WorkItemModel):
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "pipeline_id": task.pipeline_id,
            "stage_id": task.stage_id,
            "type_id": task.type_id,
            "type_label": task.work_item_type.label if task.work_item_type else "Tarefa",
            "type_color": task.work_item_type.color if task.work_item_type else "#00a65a",
            "type_icon": task.work_item_type.icon if task.work_item_type else "CheckSquare",
            "owner_id": task.owner_id,
            "workspace_id": task.workspace_id,
            "workspace_name": task.workspace.name if task.workspace else "Geral",
            "custom_fields": task.custom_fields or {},
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None
        }
