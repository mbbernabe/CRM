import pytest
from fastapi import status

def test_create_and_list_contacts_multi_tenant(client):
    # Setup: Dois times diferentes
    team_a_headers = {"X-Team-ID": "1"}
    team_b_headers = {"X-Team-ID": "2"}

    # 1. Criar contato para o Time A
    contact_a = {
        "name": "Alice Team A",
        "email": "alice@teama.com",
        "properties": {}
    }
    response = client.post("/contacts/", json=contact_a, headers=team_a_headers)
    assert response.status_code == status.HTTP_201_CREATED
    
    # 2. Criar contato para o Time B
    contact_b = {
        "name": "Bob Team B",
        "email": "bob@teamb.com",
        "properties": {}
    }
    response = client.post("/contacts/", json=contact_b, headers=team_b_headers)
    assert response.status_code == status.HTTP_201_CREATED

    # 3. Listar contatos do Time A e verificar que o contato do Time B NÃO aparece
    response = client.get("/contacts/", headers=team_a_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Alice Team A"
    assert data[0]["email"] == "alice@teama.com"

    # 4. Listar contatos do Time B e verificar que o contato do Time A NÃO aparece
    response = client.get("/contacts/", headers=team_a_headers) # BUG AQUI! Use team_b_headers
    # Espera aí, eu vi um erro no meu próprio código acima (copiei errado). Corrigindo para team_b_headers.
    response = client.get("/contacts/", headers=team_b_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Bob Team B"
    assert data[0]["email"] == "bob@teamb.com"

def test_access_contact_from_different_team_fails(client):
    team_a_headers = {"X-Team-ID": "1"}
    team_b_headers = {"X-Team-ID": "2"}

    # Criar contato para o Time A
    contact_a = {
        "name": "Charlie Privacy",
        "email": "charlie@privacy.com",
        "properties": {}
    }
    response = client.post("/contacts/", json=contact_a, headers=team_a_headers)
    assert response.status_code == status.HTTP_201_CREATED
    contact_id = response.json()["id"]

    # Tentar acessar o contato do Time A usando o ID do Time B
    response = client.get(f"/contacts/{contact_id}", headers=team_b_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_missing_team_id_header(client):
    response = client.get("/contacts/")
    # get_team_id levanta 401 ou 422 dependendo se Header(...) é obrigatório sem default
    # Como está Header(..., alias="X-Team-ID"), o FastAPI retorna 422 Unprocessable Entity
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
