from typing import List, Dict, Any, Optional
from src.domain.entities.work_item import WorkItem, IWorkItemRepository, WorkItemType
from dataclasses import asdict

class GetPipelineBoardUseCase:
    def __init__(
        self, 
        work_item_repo: IWorkItemRepository,
        pipeline_repo: Any # To fetch pipelines and stages
    ):
        self.work_item_repo = work_item_repo
        self.pipeline_repo = pipeline_repo

    def execute(self, pipeline_id: int, workspace_id: int) -> Dict[str, Any]:
        # 1. Fetch Pipeline Structure
        pipeline = self.pipeline_repo.get_by_id(pipeline_id, workspace_id)
        if not pipeline:
            raise ValueError("Pipeline não encontrado.")

        # 2. Fetch WorkItems for this pipeline
        work_items = self.work_item_repo.list_by_pipeline(pipeline_id, workspace_id)
        
        # 3. Aggregation Logic: Groups items by stage
        # In a real environment, we would also fetch WorkItemType labels for the UI
        types = self.work_item_repo.list_types(workspace_id)
        type_map = {t.id: t for t in types}

        stages_data = []
        for stage in sorted(pipeline.stages, key=lambda s: s.order):
            items_in_stage = [
                self._enrich_item(item, type_map) 
                for item in work_items if item.stage_id == stage.id
            ]
            
            stages_data.append({
                "id": stage.id,
                "name": stage.name,
                "order": stage.order,
                "color": stage.color,
                "is_final": stage.is_final,
                "items": items_in_stage
            })

        active_type = type_map.get(pipeline.type_id)
        
        return {
            "id": pipeline.id,
            "pipeline_id": pipeline.id,
            "pipeline_name": pipeline.name,
            "type_id": pipeline.type_id,
            "item_label_singular": active_type.label if active_type else "Item",
            "item_label_plural": active_type.label if active_type else "Itens",
            "stages": stages_data
        }

    def _enrich_item(self, item: WorkItem, type_map: Dict[int, WorkItemType]) -> Dict[str, Any]:
        item_data = asdict(item)
        
        # Add friendly type label if available
        if item.type_id in type_map:
            item_data["type_label"] = type_map[item.type_id].label
            item_data["type_color"] = type_map[item.type_id].color
            item_data["type_icon"] = type_map[item.type_id].icon
            
        return item_data
