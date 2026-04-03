from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository
from src.infrastructure.api.dependencies import get_team_id
from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink
from src.application.use_cases.property_use_cases import (
    ListPropertyDefinitionsUseCase, CreatePropertyDefinitionUseCase,
    UpdatePropertyDefinitionUseCase, DeletePropertyDefinitionUseCase,
    ListEntityLinksUseCase, CreateEntityLinkUseCase, DeleteEntityLinkUseCase, ReorderLinksUseCase,
    ListPropertyGroupsUseCase, CreatePropertyGroupUseCase, ReorderGroupsUseCase
)

router = APIRouter(prefix="/properties", tags=["Properties"])

class GroupRenameRequest(BaseModel):
    name: str

class CreateDefinitionRequest(BaseModel):
    name: str
    label: str
    type: str = "text"
    options: Optional[str] = None

class LinkPropertyRequest(BaseModel):
    property_id: int
    group_id: Optional[int] = None
    order: int = 0
    is_required: bool = False

class UpdateLinkRequest(BaseModel):
    group_id: Optional[int] = None
    is_required: bool = False

# --- Property Definitions (Antigas Global) ---
@router.get("/definitions", response_model=List[PropertyDefinition])
def list_definitions(db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    return ListPropertyDefinitionsUseCase(repo).execute(team_id)

@router.post("/definitions", response_model=PropertyDefinition, status_code=status.HTTP_201_CREATED)
def create_definition(req: CreateDefinitionRequest, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return CreatePropertyDefinitionUseCase(repo).execute(req.name, req.label, team_id, req.type, req.options)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/definitions/{prop_id}", response_model=PropertyDefinition)
def update_definition(prop_id: int, req: CreateDefinitionRequest, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return UpdatePropertyDefinitionUseCase(repo).execute(prop_id, req.label, team_id, req.type, req.options)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/definitions/{prop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_definition(prop_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        success = DeletePropertyDefinitionUseCase(repo).execute(prop_id, team_id)
        if not success:
            raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Linked Properties (Entity Type) ---
@router.get("/entity/{entity_type}", response_model=List[EntityPropertyLink])
def list_linked_properties(entity_type: str, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    return ListEntityLinksUseCase(repo).execute(entity_type, team_id)

@router.post("/entity/{entity_type}/link", response_model=EntityPropertyLink, status_code=status.HTTP_201_CREATED)
def link_property(entity_type: str, req: LinkPropertyRequest, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    try:
        return CreateEntityLinkUseCase(repo).execute(entity_type, req.property_id, team_id, req.group_id, req.order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/entity/link/{link_id}", response_model=EntityPropertyLink)
def update_link(link_id: int, req: UpdateLinkRequest, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    # Buscando o link
    link = repo.get_link_by_id(link_id, team_id)
    if not link:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    
    link.group_id = req.group_id
    link.is_required = req.is_required
    return repo.save_entity_link(link, team_id)

@router.delete("/entity/link/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_property(link_id: int, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    success = DeleteEntityLinkUseCase(repo).execute(link_id, team_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

@router.post("/entity/reorder")
def reorder_links(orders: List[dict], db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    ReorderLinksUseCase(repo).execute(orders, team_id)
    return {"message": "Ordem atualizada com sucesso"}

# --- Property Groups ---
@router.get("/groups", response_model=List[PropertyGroup])
def list_groups(db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    return ListPropertyGroupsUseCase(repo).execute(team_id)

@router.post("/groups", response_model=PropertyGroup)
def create_group(group: PropertyGroup, db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    return CreatePropertyGroupUseCase(repo).execute(group.name, team_id)

@router.post("/groups/reorder")
def reorder_groups(orders: List[dict], db: Session = Depends(get_db), team_id: int = Depends(get_team_id)):
    repo = SqlAlchemyPropertyRepository(db)
    ReorderGroupsUseCase(repo).execute(orders, team_id)
    return {"message": "Ordem dos grupos atualizada"}
