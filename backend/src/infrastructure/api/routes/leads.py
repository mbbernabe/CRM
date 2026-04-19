from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_workspace_repository import SqlAlchemyWorkspaceRepository
from src.infrastructure.repositories.work_item_repository import WorkItemRepository
from src.infrastructure.repositories.work_item_history_repository import WorkItemHistoryRepository
from src.application.use_cases.leads.ingest_lead_use_case import IngestLeadUseCase
from src.domain.exceptions.base_exceptions import DomainException
from src.infrastructure.utils.logger import get_logger, log_exception

logger = get_logger(__name__)
router = APIRouter(prefix="/public/leads", tags=["Public Leads API"])

@router.post("")
def ingest_lead(
    lead_data: Dict[str, Any], 
    x_api_key: Optional[str] = Header(None), 
    db: Session = Depends(get_db)
):
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="API Key ausente (X-API-Key header)."
        )

    workspace_repo = SqlAlchemyWorkspaceRepository(db)
    work_item_repo = WorkItemRepository(db)
    history_repo = WorkItemHistoryRepository(db)
    
    use_case = IngestLeadUseCase(workspace_repo, work_item_repo, history_repo)
    
    try:
        created_lead = use_case.execute(x_api_key, lead_data)
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "status": "success",
                "message": "Lead recebido com sucesso.",
                "item_id": created_lead.id
            }
        )
    except DomainException as e:
        if "Key" in e.message:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        log_exception(logger, e, "ingest_lead")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Erro interno ao processar o lead."
        )
