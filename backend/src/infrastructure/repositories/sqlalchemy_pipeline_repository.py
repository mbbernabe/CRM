from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.domain.entities.pipeline import Pipeline, PipelineStage
from src.domain.repositories.pipeline_repository import IPipelineRepository
from src.infrastructure.database.models import PipelineModel, PipelineStageModel, ContactModel, CompanyModel

class SqlAlchemyPipelineRepository(IPipelineRepository):
    def __init__(self, db: Session):
        self.db = db

    def _map_to_domain(self, db_pipeline: PipelineModel) -> Pipeline:
        stages = [
            PipelineStage(
                id=s.id,
                pipeline_id=s.pipeline_id,
                name=s.name,
                order=s.order,
                color=s.color,
                is_final=s.is_final,
                metadata=s.metadata_json
            ) for s in db_pipeline.stages
        ]
        return Pipeline(
            id=db_pipeline.id,
            name=db_pipeline.name,
            entity_type=db_pipeline.entity_type,
            team_id=db_pipeline.team_id,
            workspace_id=db_pipeline.workspace_id,
            item_label_singular=db_pipeline.item_label_singular or "Item",
            item_label_plural=db_pipeline.item_label_plural or "Itens",
            stages=stages
        )

    def list_all(self, workspace_id: int) -> List[Pipeline]:
        db_pipelines = self.db.query(PipelineModel).options(
            joinedload(PipelineModel.stages)
        ).filter(PipelineModel.workspace_id == workspace_id).all()
        return [self._map_to_domain(p) for p in db_pipelines]

    def get_by_id(self, pipeline_id: int, workspace_id: int) -> Optional[Pipeline]:
        db_pipeline = self.db.query(PipelineModel).options(
            joinedload(PipelineModel.stages)
        ).filter(PipelineModel.id == pipeline_id, PipelineModel.workspace_id == workspace_id).first()
        
        if not db_pipeline:
            return None
        return self._map_to_domain(db_pipeline)

    def save(self, pipeline: Pipeline, workspace_id: int) -> Pipeline:
        db_pipeline = PipelineModel(
            name=pipeline.name,
            entity_type=pipeline.entity_type,
            team_id=pipeline.team_id,
            workspace_id=workspace_id,
            item_label_singular=pipeline.item_label_singular,
            item_label_plural=pipeline.item_label_plural
        )
        self.db.add(db_pipeline)
        self.db.flush() 

        if pipeline.stages:
            for s in pipeline.stages:
                db_stage = PipelineStageModel(
                    pipeline_id=db_pipeline.id,
                    name=s.name,
                    order=s.order,
                    color=s.color,
                    is_final=s.is_final,
                    metadata_json=s.metadata
                )
                self.db.add(db_stage)
        
        self.db.commit()
        self.db.refresh(db_pipeline)
        return self._map_to_domain(db_pipeline)

    def update(self, pipeline: Pipeline, workspace_id: int) -> bool:
        db_pipeline = self.db.query(PipelineModel).filter(
            PipelineModel.id == pipeline.id, 
            PipelineModel.workspace_id == workspace_id
        ).first()
        
        if not db_pipeline:
            return False
            
        db_pipeline.name = pipeline.name
        db_pipeline.entity_type = pipeline.entity_type
        db_pipeline.item_label_singular = pipeline.item_label_singular
        db_pipeline.item_label_plural = pipeline.item_label_plural

        current_stage_ids = [s.id for s in db_pipeline.stages]
        new_stage_ids = [s.id for s in pipeline.stages if s.id is not None]
        
        # Deleta os que não estão na nova lista
        for stage in db_pipeline.stages:
            if stage.id not in new_stage_ids:
                self.db.delete(stage)
                
        # Atualiza ou Cria
        for s in pipeline.stages:
            if s.id and s.id in current_stage_ids:
                db_stage = self.db.query(PipelineStageModel).filter(PipelineStageModel.id == s.id).first()
                if db_stage:
                    db_stage.name = s.name
                    db_stage.order = s.order
                    db_stage.color = s.color
                    db_stage.is_final = s.is_final
                    db_stage.metadata_json = s.metadata
            else:
                db_stage = PipelineStageModel(
                    pipeline_id=pipeline.id,
                    name=s.name,
                    order=s.order,
                    color=s.color,
                    is_final=s.is_final,
                    metadata_json=s.metadata
                )
                self.db.add(db_stage)
                
        self.db.commit()
        return True
                
        self.db.commit()
        return True

    def delete(self, pipeline_id: int, workspace_id: int) -> bool:
        db_pipeline = self.db.query(PipelineModel).filter(
            PipelineModel.id == pipeline_id,
            PipelineModel.workspace_id == workspace_id
        ).first()
        if db_pipeline:
            self.db.delete(db_pipeline)
            self.db.commit()
            return True
        return False

    def move_entity(self, entity_type: str, entity_id: int, stage_id: int, workspace_id: int) -> bool:
        # Verifica se o estágio existe e pertence a uma pipeline do workspace
        db_stage = self.db.query(PipelineStageModel).join(PipelineModel).filter(
            PipelineStageModel.id == stage_id,
            PipelineModel.workspace_id == workspace_id
        ).first()
        
        if not db_stage:
            return False
            
        if entity_type == "contact":
            db_entity = self.db.query(ContactModel).filter(
                ContactModel.id == entity_id,
                ContactModel.workspace_id == workspace_id
            ).first()
        elif entity_type == "company":
            db_entity = self.db.query(CompanyModel).filter(
                CompanyModel.id == entity_id,
                CompanyModel.workspace_id == workspace_id
            ).first()
        else:
            return False
            
        if db_entity:
            db_entity.stage_id = stage_id
            self.db.commit()
            return True
        return False

    def get_stage_by_id(self, stage_id: int, workspace_id: int) -> Optional[PipelineStage]:
        db_stage = self.db.query(PipelineStageModel).join(PipelineModel).filter(
            PipelineStageModel.id == stage_id,
            PipelineModel.workspace_id == workspace_id
        ).first()
        
        if not db_stage:
            return None
            
        return PipelineStage(
            id=db_stage.id,
            pipeline_id=db_stage.pipeline_id,
            name=db_stage.name,
            order=db_stage.order,
            color=db_stage.color,
            is_final=db_stage.is_final,
            metadata=db_stage.metadata_json
        )
