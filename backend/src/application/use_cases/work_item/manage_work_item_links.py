from typing import List, Optional
from src.domain.entities.work_item_link import IWorkItemLinkRepository
from src.domain.entities.work_item import IWorkItemRepository
from src.domain.entities.work_item_history import IWorkItemHistoryRepository, WorkItemHistory
from src.application.dtos.work_item_dto import WorkItemLinkReadDTO

class ManageWorkItemLinksUseCase:
    def __init__(
        self, 
        link_repo: IWorkItemLinkRepository, 
        work_item_repo: IWorkItemRepository,
        history_repo: IWorkItemHistoryRepository
    ):
        self.link_repo = link_repo
        self.work_item_repo = work_item_repo
        self.history_repo = history_repo

    def add_link(self, source_id: int, target_id: int, workspace_id: int, user_id: int, user_role: str = "admin", user_team_id: Optional[int] = None) -> bool:
        # Validate items exist in same workspace and are visible to user
        team_filter = user_team_id if user_role not in ["admin", "super_admin"] else None
        source = self.work_item_repo.get_by_id(source_id, workspace_id, team_id=team_filter)
        target = self.work_item_repo.get_by_id(target_id, workspace_id, team_id=team_filter)
        
        if not source or not target:
            raise ValueError("Um ou ambos os itens não foram encontrados ou você não tem permissão de acesso.")

        if source_id == target_id:
            raise ValueError("Não é possível vincular um item a ele mesmo.")

        success = self.link_repo.add_link(source_id, target_id, workspace_id)
        
        if success:
            # Record in history for both items
            history_source = WorkItemHistory(
                workitem_id=source_id,
                from_stage_id=source.stage_id,
                to_stage_id=source.stage_id,
                changed_by=user_id,
                workspace_id=workspace_id,
                notes=f"Item vinculado a: {target.title}"
            )
            self.history_repo.create(history_source)

            history_target = WorkItemHistory(
                workitem_id=target_id,
                from_stage_id=target.stage_id,
                to_stage_id=target.stage_id,
                changed_by=user_id,
                workspace_id=workspace_id,
                notes=f"Item vinculado a: {source.title}"
            )
            self.history_repo.create(history_target)

        return success

    def remove_link(self, source_id: int, target_id: int, workspace_id: int, user_id: int, user_role: str = "admin", user_team_id: Optional[int] = None) -> bool:
        team_filter = user_team_id if user_role not in ["admin", "super_admin"] else None
        source = self.work_item_repo.get_by_id(source_id, workspace_id, team_id=team_filter)
        target = self.work_item_repo.get_by_id(target_id, workspace_id, team_id=team_filter)
        
        success = self.link_repo.remove_link(source_id, target_id, workspace_id)
        
        if success and source and target:
            # Record in history
            self.history_repo.create(WorkItemHistory(
                workitem_id=source_id,
                from_stage_id=source.stage_id,
                to_stage_id=source.stage_id,
                changed_by=user_id,
                workspace_id=workspace_id,
                notes=f"Vínculo removido com: {target.title}"
            ))
            self.history_repo.create(WorkItemHistory(
                workitem_id=target_id,
                from_stage_id=target.stage_id,
                to_stage_id=target.stage_id,
                changed_by=user_id,
                workspace_id=workspace_id,
                notes=f"Vínculo removido com: {source.title}"
            ))

        return success

    def list_links(self, work_item_id: int, workspace_id: int, user_role: str = "admin", user_team_id: Optional[int] = None) -> List[WorkItemLinkReadDTO]:
        team_filter = user_team_id if user_role not in ["admin", "super_admin"] else None
        items = self.link_repo.get_linked_items(work_item_id, workspace_id, team_id=team_filter)
        return [WorkItemLinkReadDTO(**item) for item in items]
