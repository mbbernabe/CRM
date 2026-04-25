from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.api.dependencies import get_workspace_id, get_current_user
from src.infrastructure.database.models import WorkItemModel, WorkItemTypeModel, UserModel, PipelineModel
from sqlalchemy import func, and_, or_
from typing import List, Dict, Any
from datetime import datetime, date

router = APIRouter(prefix="/home", tags=["Home"])

@router.get("/summary")
def get_home_summary(
    workspace_id: int = Depends(get_workspace_id),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Obter tipos de itens para ações rápidas
    item_types = db.query(WorkItemTypeModel).filter(
        or_(
            WorkItemTypeModel.workspace_id == workspace_id,
            WorkItemTypeModel.workspace_id == None
        )
    ).all()

    # 2. Contagem de Tarefas (My Tasks Context)
    # Procurar pelo tipo 'Tarefa'
    task_type = db.query(WorkItemTypeModel).filter(
        and_(
            WorkItemTypeModel.name == 'tarefa',
            or_(WorkItemTypeModel.workspace_id == workspace_id, WorkItemTypeModel.workspace_id == None)
        )
    ).first()

    task_stats = {"overdue": 0, "today": 0, "pending": 0}
    
    if task_type:
        today = date.today()
        
        # Consultar itens do tipo tarefa atribuídos ao usuário
        base_task_query = db.query(WorkItemModel).filter(
            WorkItemModel.workspace_id == workspace_id,
            WorkItemModel.type_id == task_type.id,
            WorkItemModel.owner_id == current_user.id
        )

        # Simplificação: Usando custom_fields para datas se não houver campos nativos
        # No PRD atual, tarefas usam 'prazo' no custom_fields (range [start, end])
        # Mas para facilitar a Home, vamos focar no que é pendente no funil
        
        # Tarefas em estágios não finais
        final_stages = db.query(PipelineModel.id).join(PipelineModel.stages).filter(
            PipelineModel.workspace_id == workspace_id,
            PipelineModel.type_id == task_type.id
        ).all()
        # TODO: Refinar lógica de 'pendente' baseada em is_final
        
        task_stats["pending"] = base_task_query.count()

    # 3. Itens Recentes (Últimos 5 modificados no Workspace)
    recent_items = db.query(
        WorkItemModel.id, 
        WorkItemModel.title, 
        WorkItemModel.updated_at,
        WorkItemTypeModel.label.label("type_label"),
        WorkItemTypeModel.icon.label("type_icon"),
        WorkItemTypeModel.color.label("type_color")
    ).join(
        WorkItemTypeModel, WorkItemModel.type_id == WorkItemTypeModel.id
    ).filter(
        WorkItemModel.workspace_id == workspace_id
    ).order_by(
        WorkItemModel.updated_at.desc()
    ).limit(5).all()

    return {
        "user_name": current_user.name,
        "actions": [
            {
                "id": t.id,
                "name": t.name,
                "label": t.label,
                "icon": t.icon,
                "color": t.color
            } for t in item_types if not t.is_system or t.name == 'tarefa'
        ],
        "task_stats": task_stats,
        "recent_items": [
            {
                "id": item.id,
                "title": item.title,
                "updated_at": item.updated_at,
                "type": {
                    "label": item.type_label,
                    "icon": item.type_icon,
                    "color": item.type_color
                }
            } for item in recent_items
        ],
        "preferences": current_user.preferences or {}
    }

@router.post("/preferences")
def update_home_preferences(
    prefs: Dict[str, Any],
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    current_prefs = user.preferences or {}
    current_prefs.update(prefs)
    user.preferences = current_prefs
    db.commit()
    
    return {"status": "success", "preferences": user.preferences}
