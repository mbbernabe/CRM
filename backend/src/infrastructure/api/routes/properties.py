from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.infrastructure.database.db import get_db
from src.infrastructure.repositories.sqlalchemy_property_repository import SqlAlchemyPropertyRepository
from src.application.use_cases.property_use_cases import (
    ListPropertiesUseCase,
    CreatePropertyUseCase,
    UpdatePropertyUseCase,
    DeletePropertyUseCase,
    ReorderPropertiesUseCase,
    ListGroupsUseCase,
    CreateGroupUseCase,
    ReorderGroupsUseCase
)
from src.domain.entities.property import PropertyDefinition, PropertyGroup

router = APIRouter(prefix="/properties", tags=["Properties"])

@router.get("/", response_model=List[PropertyDefinition])
def list_properties(entity_type: str = "contact", db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = ListPropertiesUseCase(repository)
    return use_case.execute(entity_type=entity_type)

@router.post("/", response_model=PropertyDefinition, status_code=status.HTTP_201_CREATED)
def create_property(prop: PropertyDefinition, db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = CreatePropertyUseCase(repository)
    try:
        return use_case.execute(prop.name, prop.label, prop.type, prop.group, prop.group_id, prop.entity_type, prop.options)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reorder")
def reorder_properties(orders: List[dict], db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = ReorderPropertiesUseCase(repository)
    use_case.execute(orders)
    return {"message": "Ordem das propriedades atualizada"}

# Group routes
@router.get("/groups", response_model=List[PropertyGroup])
def list_groups(db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = ListGroupsUseCase(repository)
    return use_case.execute()

@router.post("/groups", response_model=PropertyGroup)
def create_group(group: PropertyGroup, db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = CreateGroupUseCase(repository)
    return use_case.execute(group.name)

@router.post("/groups/reorder")
def reorder_groups(orders: List[dict], db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = ReorderGroupsUseCase(repository)
    use_case.execute(orders)
    return {"message": "Ordem dos grupos atualizada"}

@router.put("/{prop_id}", response_model=PropertyDefinition)
def update_property(prop_id: int, prop: PropertyDefinition, db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = UpdatePropertyUseCase(repository)
    try:
        return use_case.execute(prop_id, prop.label, prop.type, prop.group, prop.group_id, prop.entity_type, prop.options)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{prop_id}")
def delete_property(prop_id: int, db: Session = Depends(get_db)):
    repository = SqlAlchemyPropertyRepository(db)
    use_case = DeletePropertyUseCase(repository)
    try:
        success = use_case.execute(prop_id)
        if not success:
            raise HTTPException(status_code=404, detail="Propriedade não encontrada")
        return {"message": "Propriedade excluída com sucesso"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
