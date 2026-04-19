import pytest
from src.infrastructure.database.models import WorkItemModel, PipelineModel, PipelineStageModel, WorkItemTypeModel, UserModel
from src.infrastructure.api.dependencies import get_current_user, get_workspace_id
from main import app

# Mock user dependency
class MockUser:
    def __init__(self, id=1, role="admin", team_id=None):
        self.id = id
        self.role = role
        self.team_id = team_id
        self.name = "Test User"

def get_mock_admin():
    return MockUser(role="admin")

def get_mock_workspace():
    return 1

def test_analytics_overview_success(client, db_session):
    # Arrange
    app.dependency_overrides[get_current_user] = get_mock_admin
    app.dependency_overrides[get_workspace_id] = get_mock_workspace
    
    # Criar massa de dados
    wtype = WorkItemTypeModel(id=1, name="deal", label="Negócio", workspace_id=1)
    db_session.add(wtype)
    db_session.commit()
    
    # 3 Itens
    for i in range(3):
        item = WorkItemModel(
            title=f"Item {i}",
            workspace_id=1,
            type_id=1,
            stage_id=1,
            pipeline_id=1
        )
        db_session.add(item)
    db_session.commit()
    
    # Act
    response = client.get("/analytics/overview")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 3
    assert len(data["type_distribution"]) == 1
    assert data["type_distribution"][0]["label"] == "Negócio"
    
    app.dependency_overrides.clear()

def test_analytics_funnel_success(client, db_session):
    # Arrange
    app.dependency_overrides[get_current_user] = get_mock_admin
    app.dependency_overrides[get_workspace_id] = get_mock_workspace
    
    pipe = PipelineModel(id=1, name="Sales", workspace_id=1)
    stage1 = PipelineStageModel(id=1, name="New", pipeline_id=1, order=0)
    stage2 = PipelineStageModel(id=2, name="Won", pipeline_id=1, order=1, is_final=True)
    
    db_session.add(pipe)
    db_session.add(stage1)
    db_session.add(stage2)
    
    # 2 itens no stage 1, 1 item no stage 2
    db_session.add(WorkItemModel(title="I1", workspace_id=1, stage_id=1, pipeline_id=1, type_id=1))
    db_session.add(WorkItemModel(title="I2", workspace_id=1, stage_id=1, pipeline_id=1, type_id=1))
    db_session.add(WorkItemModel(title="I3", workspace_id=1, stage_id=2, pipeline_id=1, type_id=1))
    
    db_session.commit()
    
    # Act
    response = client.get("/analytics/funnel/1")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 3
    assert len(data["stages"]) == 2
    assert data["stages"][0]["stage_name"] == "New"
    assert data["stages"][0]["count"] == 2
    assert data["stages"][1]["stage_name"] == "Won"
    assert data["stages"][1]["count"] == 1
    
    app.dependency_overrides.clear()
