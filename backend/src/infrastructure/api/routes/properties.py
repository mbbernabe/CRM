from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository
from src.application.use_cases.property_use_cases import (
    ListGlobalPropertiesUseCase, CreateGlobalPropertyUseCase, UpdateGlobalPropertyUseCase, DeleteGlobalPropertyUseCase,
    ListLinkedPropertiesUseCase, LinkPropertyUseCase, UpdatePropertyLinkUseCase, UnlinkPropertyUseCase, ReorderLinkedPropertiesUseCase,
    ListGroupsUseCase, CreateGroupUseCase, ReorderGroupsUseCase, RenameGroupUseCase
)
from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink
from pydantic import BaseModel

router = APIRouter(prefix="/properties", tags=["Properties"])

class GroupRenameRequest(BaseModel):
    name: str

class CreateGlobalPropertyRequest(BaseModel):
    name: str
    label: str
    type: str = "text"
    options: Optional[str] = None

class UpdateGlobalPropertyRequest(BaseModel):
    label: str
    type: str
    options: Optional[str] = None

class LinkPropertyRequest(BaseModel):
    property_id: int
    group_id: Optional[int] = None
    order: int = 0
    is_required: bool = False

class UpdateLinkRequest(BaseModel):
    group_id: Optional[int] = None
    is_required: bool = False

# --- Global Properties ---
@router.get("/global", response_model=List[PropertyDefinition])
def list_global_properties(db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    return ListGlobalPropertiesUseCase(repo).execute()

@router.post("/global", response_model=PropertyDefinition, status_code=status.HTTP_201_CREATED)
def create_global_property(req: CreateGlobalPropertyRequest, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return CreateGlobalPropertyUseCase(repo).execute(req.name, req.label, req.type, req.options)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/global/{prop_id}", response_model=PropertyDefinition)
def update_global_property(prop_id: int, req: UpdateGlobalPropertyRequest, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return UpdateGlobalPropertyUseCase(repo).execute(prop_id, req.label, req.type, req.options)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/global/{prop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_global_property(prop_id: int, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        success = DeleteGlobalPropertyUseCase(repo).execute(prop_id)
        if not success:
            raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Linked Properties (Entity Type) ---
@router.get("/entity/{entity_type}", response_model=List[EntityPropertyLink])
def list_linked_properties(entity_type: str, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    return ListLinkedPropertiesUseCase(repo).execute(entity_type)

@router.post("/entity/{entity_type}/link", response_model=EntityPropertyLink, status_code=status.HTTP_201_CREATED)
def link_property(entity_type: str, req: LinkPropertyRequest, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return LinkPropertyUseCase(repo).execute(entity_type, req.property_id, req.group_id, req.order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/entity/link/{link_id}", response_model=EntityPropertyLink)
def update_link(link_id: int, req: UpdateLinkRequest, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return UpdatePropertyLinkUseCase(repo).execute(link_id, req.group_id, req.is_required)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/entity/link/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_property(link_id: int, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    success = UnlinkPropertyUseCase(repo).execute(link_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

@router.post("/entity/reorder")
def reorder_linked_properties(orders: List[dict], db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    ReorderLinkedPropertiesUseCase(repo).execute(orders)
    return {"message": "Ordem atualizada com sucesso"}


# --- Property Groups ---
@router.get("/groups", response_model=List[PropertyGroup])
def list_groups(db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    return ListGroupsUseCase(repo).execute()

@router.post("/groups", response_model=PropertyGroup)
def create_group(group: PropertyGroup, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    return CreateGroupUseCase(repo).execute(group.name)

@router.put("/groups/{group_id}", response_model=PropertyGroup)
def rename_group(group_id: int, request: GroupRenameRequest, db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return RenameGroupUseCase(repo).execute(group_id, request.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/groups/reorder")
def reorder_groups(orders: List[dict], db: Session = Depends(get_db)):
    repo = SqlAlchemyPropertyRepository(db)
    ReorderGroupsUseCase(repo).execute(orders)
    return {"message": "Ordem dos grupos atualizada"}
