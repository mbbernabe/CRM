from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.infrastructure.database.db import get_db
from src.infrastructure.api.dependencies import get_workspace_id, get_current_user
from src.infrastructure.database.models import WorkItemModel, PipelineModel, PipelineStageModel, UserModel, TeamModel, WorkItemTypeModel
from sqlalchemy import func, and_
from typing import List, Dict, Any
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/funnel/{pipeline_id}")
def get_funnel_stats(
    pipeline_id: int, 
    workspace_id: int = Depends(get_workspace_id),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validar pipeline
    pipeline = db.query(PipelineModel).filter(
        PipelineModel.id == pipeline_id, 
        PipelineModel.workspace_id == workspace_id
    ).first()
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline não encontrada")

    # 2. Controle de acesso
    role = current_user.role if current_user else "user"
    team_id = current_user.team_id if current_user else None
    
    # 3. Buscar estágios e contar itens
    stages = db.query(PipelineStageModel).filter(PipelineStageModel.pipeline_id == pipeline_id).order_by(PipelineStageModel.order).all()
    
    stats = []
    total_in_pipeline = 0
    for stage in stages:
        item_query = db.query(func.count(WorkItemModel.id)).filter(
            WorkItemModel.stage_id == stage.id,
            WorkItemModel.workspace_id == workspace_id
        )
        if role not in ["admin", "super_admin"] and team_id:
            item_query = item_query.filter(WorkItemModel.team_id == team_id)
        
        count = item_query.scalar()
        total_in_pipeline += count
        stats.append({
            "stage_id": stage.id,
            "stage_name": stage.name,
            "color": stage.color,
            "count": count,
            "is_final": stage.is_final
        })
    
    return {
        "pipeline_name": pipeline.name,
        "total_items": total_in_pipeline,
        "stages": stats
    }

@router.get("/overview")
def get_overview_stats(
    workspace_id: int = Depends(get_workspace_id),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = current_user.role if current_user else "user"
    team_id = current_user.team_id if current_user else None

    # 1. Total de Itens Ativos
    total_query = db.query(func.count(WorkItemModel.id)).filter(WorkItemModel.workspace_id == workspace_id)
    if role not in ["admin", "super_admin"] and team_id:
        total_query = total_query.filter(WorkItemModel.team_id == team_id)
    total_items = total_query.scalar()

    # 2. Novos Itens (Últimos 30 dias)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_items_query = db.query(func.count(WorkItemModel.id)).filter(
        WorkItemModel.workspace_id == workspace_id,
        WorkItemModel.created_at >= thirty_days_ago
    )
    if role not in ["admin", "super_admin"] and team_id:
        new_items_query = new_items_query.filter(WorkItemModel.team_id == team_id)
    new_items_count = new_items_query.scalar()

    # 3. Distribuição por Tipo de Objeto
    type_query = db.query(
        WorkItemTypeModel.label,
        func.count(WorkItemModel.id)
    ).join(
        WorkItemModel, WorkItemModel.type_id == WorkItemTypeModel.id
    ).filter(
        WorkItemModel.workspace_id == workspace_id
    )
    if role not in ["admin", "super_admin"] and team_id:
        type_query = type_query.filter(WorkItemModel.team_id == team_id)
    
    type_distribution = type_query.group_by(WorkItemTypeModel.id).all()

    # 4. Top Responsáveis
    owner_query = db.query(
        UserModel.name, 
        func.count(WorkItemModel.id)
    ).join(
        WorkItemModel, WorkItemModel.owner_id == UserModel.id
    ).filter(
        WorkItemModel.workspace_id == workspace_id
    )
    if role not in ["admin", "super_admin"] and team_id:
        owner_query = owner_query.filter(WorkItemModel.team_id == team_id)
    
    top_owners = owner_query.group_by(UserModel.id).order_by(func.count(WorkItemModel.id).desc()).limit(5).all()

    # 5. Evolução Mensal (Simples: Itens criados por mês nos últimos 6 meses)
    # Nota: Em um banco real, usaríamos date_trunc ou similar. Para SQLite/Geral, vamos simplificar.
    evolution = []
    for i in range(6):
        month_start = (datetime.utcnow().replace(day=1) - timedelta(days=i*30)).replace(day=1, hour=0, minute=0, second=0)
        # Aproximação de meses
        next_month = (month_start + timedelta(days=32)).replace(day=1)
        
        evo_query = db.query(func.count(WorkItemModel.id)).filter(
            WorkItemModel.workspace_id == workspace_id,
            WorkItemModel.created_at >= month_start,
            WorkItemModel.created_at < next_month
        )
        if role not in ["admin", "super_admin"] and team_id:
            evo_query = evo_query.filter(WorkItemModel.team_id == team_id)
            
        evolution.append({
            "month": month_start.strftime("%b/%y"),
            "count": evo_query.scalar()
        })

    return {
        "total_items": total_items,
        "new_items_30d": new_items_count,
        "type_distribution": [{"label": label, "count": count} for label, count in type_distribution],
        "top_owners": [{"name": name, "count": count} for name, count in top_owners],
        "evolution": list(reversed(evolution))
    }
