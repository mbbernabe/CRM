
from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import WorkItemTypeModel

db = SessionLocal()
try:
    types = db.query(WorkItemTypeModel).all()
    print(f"ID | Name | Label | Workspace ID")
    print("-" * 40)
    for t in types:
        print(f"{t.id} | {t.name} | {t.label} | {t.workspace_id}")
finally:
    db.close()
