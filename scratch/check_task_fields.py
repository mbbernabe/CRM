import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.infrastructure.database.models import WorkItemTypeModel, WorkItemFieldDefinitionModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres.npblzejgnbvfzexqrwhy:Zpep0a45Vr6353vJ@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

try:
    types = session.query(WorkItemTypeModel).filter(WorkItemTypeModel.label.ilike('%Tarefa%')).all()
    for t in types:
        print(f'Type: {t.label} (ID: {t.id})')
        fields = session.query(WorkItemFieldDefinitionModel).filter(WorkItemFieldDefinitionModel.type_id == t.id).all()
        for f in fields:
            print(f'  - {f.label}: {f.field_type} (Name: {f.name})')
finally:
    session.close()
