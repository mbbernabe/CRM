from src.domain.entities.work_item import IWorkItemRepository
from src.domain.entities.work_item_history import IWorkItemHistoryRepository, WorkItemHistory
from typing import Optional

class DeleteWorkItemUseCase:
    def __init__(
        self, 
        work_item_repo: IWorkItemRepository,
        history_repo: IWorkItemHistoryRepository
    ):
        self.work_item_repo = work_item_repo
        self.history_repo = history_repo

    def execute(
        self, 
        work_item_id: int, 
        workspace_id: int,
        user_id: Optional[int] = None
    ) -> bool:
        work_item = self.work_item_repo.get_by_id(work_item_id, workspace_id)
        if not work_item:
            raise ValueError("Work item não encontrado ou não pertence a este workspace.")
        
        # Pode ser interessante no futuro fazer soft delete, por ora será hard delete
        success = self.work_item_repo.delete(work_item_id, workspace_id)
        
        # Criar histórico se ele manter dados dependendo do banco (opcional, pq itens atrelados geralmente sumiriam em cascading delete)
        # Se for cascading delete no DB, os history tambem somem a menos que o schema defina SET NULL
        
        return success
