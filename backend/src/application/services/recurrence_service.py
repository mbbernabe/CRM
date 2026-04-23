from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dateutil.relativedelta import relativedelta
from src.domain.entities.work_item import WorkItem, IWorkItemRepository

class RecurrenceService:
    def __init__(self, work_item_repo: IWorkItemRepository):
        self.work_item_repo = work_item_repo

    def process_completion(self, work_item: WorkItem) -> Optional[WorkItem]:
        """
        Verifica se um item concluído tem recorrência e gera o próximo se necessário.
        """
        if not work_item.recurrence_config:
            return None
        
        config = work_item.recurrence_config
        freq = config.get("frequency") # daily, weekly, monthly, yearly
        interval = int(config.get("interval", 1))
        
        # 1. Identificar a data base (preferencialmente due_date, senão hoje)
        custom = work_item.custom_fields or {}
        base_due_date_str = custom.get("due_date")
        
        try:
            if base_due_date_str:
                base_date = datetime.strptime(str(base_due_date_str).split('T')[0], '%Y-%m-%d')
            else:
                base_date = datetime.now()
        except Exception:
            base_date = datetime.now()

        # 2. Calcular próxima data
        next_date = self._calculate_next_date(base_date, freq, interval)
        if not next_date:
            return None

        # 3. Clonar o item
        next_item = WorkItem(
            title=work_item.title,
            description=work_item.description,
            pipeline_id=work_item.pipeline_id,
            stage_id=work_item.stage_id, # Volta para o estágio inicial ou mantém? Geralmente volta para o início.
            # Mas no My Tasks Center, o estágio é menos importante que os custom_fields.
            type_id=work_item.type_id,
            workspace_id=work_item.workspace_id,
            team_id=work_item.team_id,
            owner_id=work_item.owner_id,
            recurrence_config=work_item.recurrence_config, # Mantém a regra no próximo
            custom_fields={**work_item.custom_fields}
        )
        
        # 4. Limpar status de conclusão e atualizar datas
        next_item.custom_fields["is_completed"] = False
        next_item.custom_fields["due_date"] = next_date.strftime('%Y-%m-%d')
        
        # Se houver start_date, recalcular mantendo a mesma duração
        if "start_date" in custom and base_due_date_str:
            try:
                old_start = datetime.strptime(str(custom["start_date"]).split('T')[0], '%Y-%m-%d')
                duration = base_date - old_start
                next_item.custom_fields["start_date"] = (next_date - duration).strftime('%Y-%m-%d')
            except Exception:
                pass

        # 5. Persistir
        return self.work_item_repo.create(next_item)

    def _calculate_next_date(self, current_date: datetime, freq: str, interval: int) -> Optional[datetime]:
        if freq == "daily":
            return current_date + timedelta(days=interval)
        elif freq == "weekly":
            return current_date + timedelta(weeks=interval)
        elif freq == "monthly":
            return current_date + relativedelta(months=interval)
        elif freq == "yearly":
            return current_date + relativedelta(years=interval)
        return None
