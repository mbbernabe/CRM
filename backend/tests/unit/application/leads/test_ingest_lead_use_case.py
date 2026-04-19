import pytest
from unittest.mock import Mock, MagicMock
from src.application.use_cases.leads.ingest_lead_use_case import IngestLeadUseCase
from src.domain.entities.workspace import Workspace
from src.domain.entities.work_item import WorkItem
from src.domain.exceptions.base_exceptions import DomainException

def test_ingest_lead_success():
    # Arrange
    mock_workspace_repo = Mock()
    mock_work_item_repo = Mock()
    mock_history_repo = Mock()
    
    use_case = IngestLeadUseCase(mock_workspace_repo, mock_work_item_repo, mock_history_repo)
    
    api_key = "test_api_key"
    payload = {
        "name": "João Silva",
        "email": "joao@exemplo.com",
        "phone": "11999999999",
        "message": "Quero comprar"
    }
    
    workspace = Workspace(
        id=1,
        name="Test Workspace",
        lead_api_key=api_key,
        lead_pipeline_id=10,
        lead_stage_id=20,
        lead_type_id=30
    )
    
    mock_workspace_repo.get_by_api_key.return_value = workspace
    mock_work_item_repo.create.side_effect = lambda x: x # Retorna o próprio objeto com ID simulado
    
    # Act
    result = use_case.execute(api_key, payload)
    
    # Assert
    assert result is not None
    assert result.title == "João Silva" # Deve usar o nome do payload
    assert result.workspace_id == 1
    assert result.pipeline_id == 10
    assert result.stage_id == 20
    assert result.type_id == 30
    assert result.custom_fields["email"] == "joao@exemplo.com"
    assert result.custom_fields["message"] == "Quero comprar"
    
    mock_workspace_repo.get_by_api_key.assert_called_once_with(api_key)
    mock_work_item_repo.create.assert_called_once()
    mock_history_repo.create.assert_called_once()

def test_ingest_lead_invalid_key():
    # Arrange
    mock_workspace_repo = Mock()
    mock_work_item_repo = Mock()
    mock_history_repo = Mock()
    
    use_case = IngestLeadUseCase(mock_workspace_repo, mock_work_item_repo, mock_history_repo)
    mock_workspace_repo.get_by_api_key.return_value = None
    
    # Act & Assert
    with pytest.raises(DomainException) as exc:
        use_case.execute("invalid_key", {})
    
    assert "API Key inválida" in str(exc.value)

def test_ingest_lead_missing_config():
    # Arrange
    mock_workspace_repo = Mock()
    mock_work_item_repo = Mock()
    mock_history_repo = Mock()
    
    use_case = IngestLeadUseCase(mock_workspace_repo, mock_work_item_repo, mock_history_repo)
    
    # Workspace sem configuração de destino
    workspace = Workspace(
        id=1,
        name="Test Workspace",
        lead_api_key="key",
        lead_pipeline_id=None 
    )
    
    mock_workspace_repo.get_by_api_key.return_value = workspace
    
    # Act & Assert
    with pytest.raises(DomainException) as exc:
        use_case.execute("key", {"name": "Test"})
    
    assert "Configuração de destino de leads não definida" in str(exc.value)

def test_ingest_lead_uses_email_as_title_fallback():
    # Arrange
    mock_workspace_repo = Mock()
    mock_work_item_repo = Mock()
    mock_history_repo = Mock()
    use_case = IngestLeadUseCase(mock_workspace_repo, mock_work_item_repo, mock_history_repo)
    
    workspace = Workspace(id=1, lead_api_key="key", lead_pipeline_id=1, lead_stage_id=1, lead_type_id=1)
    mock_workspace_repo.get_by_api_key.return_value = workspace
    mock_work_item_repo.create.side_effect = lambda x: x
    
    # Payload sem nome, apenas email
    payload = {"email": "lead@site.com", "msg": "hello"}
    
    # Act
    result = use_case.execute("key", payload)
    
    # Assert
    assert result.title == "lead@site.com"
