
from src.infrastructure.database.db import SessionLocal
from src.infrastructure.repositories.work_item_repository import WorkItemRepository
from src.domain.entities.work_item import WorkItemType, CustomFieldDefinition

def test_duplicate_field():
    db = SessionLocal()
    repo = WorkItemRepository(db)
    
    try:
        # 1. Criar um tipo
        t = WorkItemType(name="teste_dup", label="Teste Dup", workspace_id=1)
        created = repo.create_type(t)
        
        # 2. Tentar adicionar dois campos com o mesmo nome
        fields = [
            CustomFieldDefinition(name="campo1", label="Campo 1"),
            CustomFieldDefinition(name="campo1", label="Campo 1 de novo")
        ]
        
        print("Tentando atualizar com campos duplicados...")
        repo.update_type(created.id, 1, field_definitions=fields)
    except Exception as e:
        print(f"Erro capturado: {str(e)}")
    finally:
        # Cleanup
        db.rollback()
        db.query(WorkItemType).filter(WorkItemType.name == "teste_dup").delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    test_duplicate_field()
