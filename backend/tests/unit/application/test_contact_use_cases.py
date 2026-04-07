import pytest
from unittest.mock import MagicMock
from src.application.use_cases.list_contacts_use_case import ListContactsUseCase
from src.application.use_cases.get_contact_use_case import GetContactUseCase
from src.application.use_cases.create_contact_use_case import CreateContactUseCase
from src.application.use_cases.update_contact_use_case import UpdateContactUseCase
from src.application.use_cases.delete_contact_use_case import DeleteContactUseCase
from src.application.dtos.contact_dto import ContactCreateDTO, ContactUpdateDTO
from src.domain.entities.contact import Contact

@pytest.fixture
def mock_repository():
    return MagicMock()

def test_list_contacts_use_case(mock_repository):
    # Arrange
    contacts = [
        Contact(id=1, name="John Doe", email="john@example.com"),
        Contact(id=2, name="Jane Doe", email="jane@example.com")
    ]
    mock_repository.list_all.return_value = contacts
    use_case = ListContactsUseCase(mock_repository)

    # Act
    result = use_case.execute(workspace_id=1)

    # Assert
    assert len(result) == 2
    assert result[0].name == "John Doe"
    assert result[1].name == "Jane Doe"
    mock_repository.list_all.assert_called_once()

def test_get_contact_use_case_success(mock_repository):
    # Arrange
    contact = Contact(id=1, name="John Doe", email="john@example.com")
    mock_repository.get_by_id.return_value = contact
    use_case = GetContactUseCase(mock_repository)

    # Act
    result = use_case.execute(1, workspace_id=1)

    # Assert
    assert result is not None
    assert result.id == 1
    assert result.name == "John Doe"
    mock_repository.get_by_id.assert_called_once_with(1)

def test_get_contact_use_case_not_found(mock_repository):
    # Arrange
    mock_repository.get_by_id.return_value = None
    use_case = GetContactUseCase(mock_repository)

    # Act
    result = use_case.execute(1, workspace_id=1)

    # Assert
    assert result is None
    mock_repository.get_by_id.assert_called_once_with(1)

def test_create_contact_use_case(mock_repository):
    # Arrange
    dto = ContactCreateDTO(name="New Contact", email="new@example.com", phone="123456")
    saved_contact = Contact(id=1, name="New Contact", email="new@example.com", phone="123456")
    mock_repository.save.return_value = saved_contact
    use_case = CreateContactUseCase(mock_repository)

    # Act
    result = use_case.execute(dto, workspace_id=1)

    # Assert
    assert result.id == 1
    assert result.name == "New Contact"
    mock_repository.save.assert_called_once()

def test_update_contact_use_case_success(mock_repository):
    # Arrange
    existing_contact = Contact(id=1, name="Old Name", email="old@example.com")
    dto = ContactUpdateDTO(name="New Name")
    
    mock_repository.get_by_id.return_value = existing_contact
    mock_repository.update.return_value = Contact(id=1, name="New Name", email="old@example.com")
    
    use_case = UpdateContactUseCase(mock_repository)

    # Act
    result = use_case.execute(1, dto, workspace_id=1)

    # Assert
    assert result.name == "New Name"
    mock_repository.update.assert_called_once()

def test_delete_contact_use_case(mock_repository):
    # Arrange
    mock_repository.delete.return_value = True
    use_case = DeleteContactUseCase(mock_repository)

    # Act
    result = use_case.execute(1, workspace_id=1)

    # Assert
    assert result is True
    mock_repository.delete.assert_called_once_with(1)
