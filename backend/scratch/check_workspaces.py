
from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import WorkspaceModel

db = SessionLocal()
try:
    ws = db.query(WorkspaceModel).all()
    print(f"ID | Name")
    print("-" * 20)
    for w in ws:
        print(f"{w.id} | {w.name}")
finally:
    db.close()
