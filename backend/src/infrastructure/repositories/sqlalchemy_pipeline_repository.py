from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.domain.entities.pipeline import Pipeline, PipelineStage
from src.domain.repositories.pipeline_repository import IPipelineRepository
from src.infrastructure.database.models import PipelineModel, PipelineStageModel

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
            type_id=db_pipeline.type_id,
            team_id=db_pipeline.team_id,
            workspace_id=db_pipeline.workspace_id,
            stages=stages
        )

    def list_all(self, workspace_id: int) -> List[Pipeline]:
        db_pipelines = self.db.query(PipelineModel).options(
            joinedload(PipelineModel.stages)
        ).filter(
            (PipelineModel.workspace_id == workspace_id) | (PipelineModel.workspace_id == None)
        ).all()
        return [self._map_to_domain(p) for p in db_pipelines]

    def get_by_id(self, pipeline_id: int, workspace_id: int) -> Optional[Pipeline]:
        db_pipeline = self.db.query(PipelineModel).options(
            joinedload(PipelineModel.stages)
        ).filter(
            PipelineModel.id == pipeline_id, 
            (PipelineModel.workspace_id == workspace_id) | (PipelineModel.workspace_id == None)
        ).first()
        
        if not db_pipeline:
            return None
        return self._map_to_domain(db_pipeline)

    def save(self, pipeline: Pipeline, workspace_id: int) -> Pipeline:
        db_pipeline = PipelineModel(
            name=pipeline.name,
            type_id=pipeline.type_id,
            team_id=pipeline.team_id,
            workspace_id=workspace_id
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
        db_pipeline.type_id = pipeline.type_id

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

    def move_entity(self, type_id: int, entity_id: int, stage_id: int, workspace_id: int) -> bool:
        # Verifica se o estágio existe e pertence a uma pipeline do workspace
        db_stage = self.db.query(PipelineStageModel).join(PipelineModel).filter(
            PipelineStageModel.id == stage_id,
            PipelineModel.workspace_id == workspace_id
        ).first()
        
        if not db_stage:
            return False
            
        # No novo sistema, tudo é WorkItemModel
        from src.infrastructure.database.models import WorkItemModel
        db_entity = self.db.query(WorkItemModel).filter(
            WorkItemModel.id == entity_id,
            WorkItemModel.workspace_id == workspace_id,
            WorkItemModel.type_id == type_id
        ).first()
            
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
    def list_templates(self, source_type_id: int) -> List[Pipeline]:
        db_pipelines = self.db.query(PipelineModel).options(
            joinedload(PipelineModel.stages)
        ).filter(
            PipelineModel.type_id == source_type_id,
            PipelineModel.workspace_id == None
        ).all()
        return [self._map_to_domain(p) for p in db_pipelines]

    def clone_from_template(self, template_id: int, workspace_id: int, target_type_id: int) -> Pipeline:
        try:
            db_template = self.db.query(PipelineModel).options(
                joinedload(PipelineModel.stages)
            ).filter(PipelineModel.id == template_id).first()

            if not db_template:
                raise Exception("Template de pipeline não encontrado")

            new_pipeline = PipelineModel(
                name=db_template.name,
                type_id=target_type_id,
                workspace_id=workspace_id
            )
            self.db.add(new_pipeline)
            self.db.flush()

            for s in db_template.stages:
                new_stage = PipelineStageModel(
                    pipeline_id=new_pipeline.id,
                    name=s.name,
                    order=s.order,
                    color=s.color,
                    is_final=s.is_final,
                    metadata_json=s.metadata_json
                )
                self.db.add(new_stage)

            self.db.commit()
            self.db.refresh(new_pipeline)
            return self._map_to_domain(new_pipeline)
        except Exception as e:
            self.db.rollback()
            raise e
