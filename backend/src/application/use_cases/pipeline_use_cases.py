from typing import List, Optional
from src.domain.entities.pipeline import Pipeline, PipelineStage
from src.domain.repositories.pipeline_repository import IPipelineRepository
from src.application.dtos.pipeline_dto import PipelineCreateDTO, PipelineUpdateDTO, PipelineStageDTO

class PipelineUseCases:
    def __init__(self, repository: IPipelineRepository):
        self.repository = repository

    def list_pipelines(self, team_id: int) -> List[Pipeline]:
        return self.repository.list_all(team_id)

    def get_pipeline(self, pipeline_id: int, team_id: int) -> Optional[Pipeline]:
        return self.repository.get_by_id(pipeline_id, team_id)

    def create_pipeline(self, dto: PipelineCreateDTO, team_id: int) -> Pipeline:
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
            stages=stages
        )
        return self.repository.save(pipeline, team_id)

    def update_pipeline(self, pipeline_id: int, dto: PipelineUpdateDTO, team_id: int) -> bool:
        if dto.stages is not None:
            stages = [
                PipelineStage(
                    id=s.id,
                    name=s.name,
                    order=s.order,
                    color=s.color,
                    is_final=s.is_final,
                    metadata=s.metadata
                ) for s in dto.stages
            ]
            return self.repository.update_stages(pipeline_id, stages, team_id)
        return True # Se não houver estágios para atualizar, consideramos sucesso

    def delete_pipeline(self, pipeline_id: int, team_id: int) -> bool:
        return self.repository.delete(pipeline_id, team_id)

    def move_entity(self, entity_type: str, entity_id: int, stage_id: int, team_id: int) -> bool:
        return self.repository.move_entity(entity_type, entity_id, stage_id, team_id)
