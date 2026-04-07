import os
import sys

# Adicionar o diretório backend ao sys.path para importações funcionarem
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import UserModel, WorkspaceModel

def check_users():
    db = SessionLocal()
    try:
        users = db.query(UserModel).all()
        print(f"Total de usuários: {len(users)}")
        for u in users:
            workspace = db.query(WorkspaceModel).filter(WorkspaceModel.id == u.workspace_id).first()
            print(f"ID: {u.id} | Nome: {u.name} | Email: {u.email} | Role: {u.role} | Workspace: {workspace.name if workspace else 'N/A'}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
