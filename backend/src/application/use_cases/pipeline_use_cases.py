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

    def list_templates(self, source_type_id: int) -> List[Pipeline]:
        return self.repository.list_templates(source_type_id)

    def import_from_template(self, template_id: int, workspace_id: int, target_type_id: int) -> Pipeline:
        return self.repository.clone_from_template(template_id, workspace_id, target_type_id)

    def create_pipeline(self, dto: PipelineCreateDTO, workspace_id: Optional[int], team_id: Optional[int] = None) -> Pipeline:
        # workspace_id can be None for system templates (Super Admin)
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
            type_id=dto.type_id,
            workspace_id=workspace_id,
            team_id=team_id,
            stages=stages
        )
        return self.repository.save(pipeline, workspace_id)

    def update_pipeline(self, pipeline_id: int, dto: PipelineUpdateDTO, workspace_id: int) -> bool:
        pipeline = self.repository.get_by_id(pipeline_id, workspace_id)
        if not pipeline:
            return False

        if dto.name is not None:
            pipeline.name = dto.name
        
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

    def move_entity(self, type_id: int, entity_id: int, stage_id: int, workspace_id: int) -> bool:
        return self.repository.move_entity(type_id, entity_id, stage_id, workspace_id)
