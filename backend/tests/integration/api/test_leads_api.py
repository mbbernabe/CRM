import pytest
from src.infrastructure.database.models import WorkspaceModel, PipelineModel, PipelineStageModel, WorkItemTypeModel, WorkItemModel

def test_public_ingest_lead_success(client, db_session):
    # Arrange
    # 1. Criar massa de dados: Workspace com configuração de lead
    workspace = WorkspaceModel(
        name="Lead Corp",
        lead_api_key="secret_key_123",
        lead_pipeline_id=1,
        lead_stage_id=1,
        lead_type_id=1
    )
    db_session.add(workspace)
    
    # 2. Criar metadados necessários
    wtype = WorkItemTypeModel(id=1, name="lead", label="Lead", workspace_id=1)
    pipe = PipelineModel(id=1, name="Vendas", workspace_id=1, type_id=1)
    stage = PipelineStageModel(id=1, name="Novo", pipeline_id=1, order=0)
    
    db_session.add(wtype)
    db_session.add(pipe)
    db_session.add(stage)
    db_session.commit()
    
    payload = {
        "name": "Maria Teste",
        "email": "maria@teste.com",
        "interest": "Produto A"
    }
    
    # Act
    response = client.post(
        "/public/leads",
        json=payload,
        headers={"X-API-Key": "secret_key_123"}
    )
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["item_id"] is not None
    
    # Verificar no banco
    item = db_session.query(WorkItemModel).filter(WorkItemModel.id == data["item_id"]).first()
    assert item is not None
    assert item.title == "Maria Teste"
    assert item.workspace_id == workspace.id
    assert item.custom_fields["interest"] == "Produto A"

def test_public_ingest_lead_invalid_key(client):
    # Act
    response = client.post(
        "/public/leads",
        json={"name": "Test"},
        headers={"X-API-Key": "wrong_key"}
    )
    
    # Assert
    assert response.status_code == 401
    assert "API Key inválida" in response.json()["detail"]

def test_public_ingest_lead_missing_key(client):
    # Act
    response = client.post(
        "/public/leads",
        json={"name": "Test"}
    )
    
    # Assert
    assert response.status_code == 401
    assert "API Key ausente" in response.json()["detail"]
