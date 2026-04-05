from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities.pipeline import Pipeline, PipelineStage

class IPipelineRepository(ABC):
    @abstractmethod
    def list_all(self, workspace_id: int) -> List[Pipeline]:
        pass

    @abstractmethod
    def get_by_id(self, pipeline_id: int, workspace_id: int) -> Optional[Pipeline]:
        pass

    @abstractmethod
    def save(self, pipeline: Pipeline, workspace_id: int) -> Pipeline:
        pass

    @abstractmethod
    def delete(self, pipeline_id: int, workspace_id: int) -> bool:
        pass

    @abstractmethod
    def update_stages(self, pipeline_id: int, stages: List[PipelineStage], workspace_id: int) -> bool:
        pass

    @abstractmethod
    def move_entity(self, entity_type: str, entity_id: int, stage_id: int, workspace_id: int) -> bool:
        pass
