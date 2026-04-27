from src.infrastructure.database.db import SessionLocal
from src.infrastructure.api.routes.home import get_home_summary
from src.infrastructure.database.models import UserModel, WorkspaceModel

db = SessionLocal()
user = db.query(UserModel).first()
workspace = db.query(WorkspaceModel).first()

if user and workspace:
    class MockUser:
        id = user.id
        name = user.name
        preferences = user.preferences
        memberships = []

    try:
        res = get_home_summary(workspace_id=workspace.id, current_user=MockUser(), db=db)
        print("Backend result:", res)
    except Exception as e:
        print("Backend error:", e)
else:
    print("No user or workspace found")
db.close()
