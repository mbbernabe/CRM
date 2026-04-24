from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import sys
import os

# Ajuste para importar do projeto
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.infrastructure.database.models import WorkItemTypeModel, WorkItemFieldDefinitionModel

engine = create_engine("sqlite:///backend/crm.db")
Session = sessionmaker(bind=engine)
session = Session()

task_type = session.query(WorkItemTypeModel).filter(WorkItemTypeModel.name == 'task_template').first()
if task_type:
    print(f"Type: {task_type.label} ({task_type.name})")
    fields = session.query(WorkItemFieldDefinitionModel).filter(WorkItemFieldDefinitionModel.type_id == task_type.id).all()
    for f in fields:
        print(f" - {f.label} ({f.name}): {f.field_type}")
else:
    print("Task template type not found")
