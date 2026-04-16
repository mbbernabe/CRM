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
    def update(self, pipeline: Pipeline, workspace_id: int) -> bool:
        pass

    @abstractmethod
    def move_entity(self, type_id: int, entity_id: int, stage_id: int, workspace_id: int) -> bool:
        pass

    @abstractmethod
    def get_stage_by_id(self, stage_id: int, workspace_id: int) -> Optional[PipelineStage]:
        pass
    @abstractmethod
    def list_templates(self, source_type_id: int) -> List[Pipeline]:
        pass

    @abstractmethod
    def clone_from_template(self, template_id: int, workspace_id: int, target_type_id: int) -> Pipeline:
        pass
