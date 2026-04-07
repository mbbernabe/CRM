from typing import List, Optional
from sqlalchemy.orm import Session, aliased
from src.domain.entities.work_item_history import WorkItemHistory, IWorkItemHistoryRepository
from src.infrastructure.database.models import WorkItemHistoryModel, UserModel, PipelineStageModel

class WorkItemHistoryRepository(IWorkItemHistoryRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: WorkItemHistoryModel) -> WorkItemHistory:
        return WorkItemHistory(
            id=model.id,
            workitem_id=model.work_item_id,
            from_stage_id=model.from_stage_id,
            to_stage_id=model.to_stage_id,
            changed_at=model.changed_at,
            changed_by=model.changed_by,
            workspace_id=model.workspace_id,
            notes=model.notes
        )

    def create(self, history: WorkItemHistory) -> WorkItemHistory:
        model = WorkItemHistoryModel(
            work_item_id=history.workitem_id,
            from_stage_id=history.from_stage_id,
            to_stage_id=history.to_stage_id,
            changed_by=history.changed_by,
            workspace_id=history.workspace_id,
            notes=history.notes
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        
        # Populate UI friendly fields immediately if needed, though usually just re-fetched
        return self._to_entity(model)

    def list_by_workitem(self, workitem_id: int, workspace_id: int) -> List[WorkItemHistory]:
        FromStage = aliased(PipelineStageModel)
        ToStage = aliased(PipelineStageModel)
        
        results = self.db.query(
            WorkItemHistoryModel, UserModel, FromStage, ToStage
        ).outerjoin(
            UserModel, WorkItemHistoryModel.changed_by == UserModel.id
        ).outerjoin(
            FromStage, WorkItemHistoryModel.from_stage_id == FromStage.id
        ).outerjoin(
            ToStage, WorkItemHistoryModel.to_stage_id == ToStage.id
        ).filter(
            WorkItemHistoryModel.work_item_id == workitem_id,
            WorkItemHistoryModel.workspace_id == workspace_id
        ).order_by(WorkItemHistoryModel.changed_at.desc()).all()

        entities = []
        for m, user, from_stage, to_stage in results:
            entity = self._to_entity(m)
            entity.changed_by_name = user.name if user else None
            entity.from_stage_name = from_stage.name if from_stage else None
            entity.to_stage_name = to_stage.name if to_stage else None
            entities.append(entity)
            
        return entities
