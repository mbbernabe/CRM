from typing import List, Optional
from src.domain.entities.pipeline import Pipeline, PipelineStage
from src.domain.repositories.pipeline_repository import IPipelineRepository
from src.application.dtos.pipeline_dto import PipelineCreateDTO, PipelineUpdateDTO, PipelineStageDTO

class PipelineUseCases:
    def __init__(self, repository: IPipelineRepository):
        self.repository = repository

    def list_pipelines(self, workspace_id: int) -> List[Pipeline]:
        return self.repository.list_all(workspace_id)

    def get_pipeline(self, pipeline_id: int, workspace_id: int) -> Optional[Pipeline]:
        return self.repository.get_by_id(pipeline_id, workspace_id)

    def create_pipeline(self, dto: PipelineCreateDTO, workspace_id: int, team_id: Optional[int] = None) -> Pipeline:
        stages = [
            PipelineStage(
                name=s.name, 
                order=s.order, 
                color=s.color, 
                is_final=s.is_final, 
                metadata=s.metadata
            ) for s in dto.stages
        ]
        pipeline = Pipeline(
            name=dto.name,
            entity_type=dto.entity_type,
            workspace_id=workspace_id,
            team_id=team_id,
            item_label_singular=dto.item_label_singular or "Item",
            item_label_plural=dto.item_label_plural or "Itens",
            stages=stages
        )
        return self.repository.save(pipeline, workspace_id)

    def update_pipeline(self, pipeline_id: int, dto: PipelineUpdateDTO, workspace_id: int) -> bool:
        pipeline = self.repository.get_by_id(pipeline_id, workspace_id)
        if not pipeline:
            return False

        if dto.name is not None:
            pipeline.name = dto.name
        if dto.item_label_singular is not None:
            pipeline.item_label_singular = dto.item_label_singular
        if dto.item_label_plural is not None:
            pipeline.item_label_plural = dto.item_label_plural
        
        if dto.stages is not None:
            pipeline.stages = [
                PipelineStage(
                    id=s.id,
                    name=s.name,
                    order=s.order,
                    color=s.color,
                    is_final=s.is_final,
                    metadata=s.metadata
                ) for s in dto.stages
            ]
        
        return self.repository.update(pipeline, workspace_id)

    def delete_pipeline(self, pipeline_id: int, workspace_id: int) -> bool:
        return self.repository.delete(pipeline_id, workspace_id)

    def move_entity(self, entity_type: str, entity_id: int, stage_id: int, workspace_id: int) -> bool:
        return self.repository.move_entity(entity_type, entity_id, stage_id, workspace_id)
