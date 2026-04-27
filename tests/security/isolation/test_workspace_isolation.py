import pytest
from fastapi import status
from sqlalchemy.orm import Session
from src.infrastructure.database.models import WorkspaceModel, UserModel, WorkItemTypeModel, MembershipModel

def test_unauthorized_workspace_access(client, db_session: Session):
    """
    SECURITY TEST: IDOR (Insecure Direct Object Reference)
    Verifica se um usuário autenticado no Workspace A pode acessar dados do Workspace B
    simplesmente alterando o header X-Workspace-ID.
    """
    
    # 1. Criar Workspace A e um Usuário pertencente a ele
    ws_a = WorkspaceModel(name="Workspace A")
    db_session.add(ws_a)
    db_session.commit()
    db_session.refresh(ws_a)
    
    user_a = UserModel(
        name="User A",
        email="user_a@test.com",
        password="hashed_password"
    )
    db_session.add(user_a)
    db_session.commit()
    db_session.refresh(user_a)
    
    # Criar o vínculo do Usuário A com o Workspace A
    membership_a = MembershipModel(
        user_id=user_a.id,
        workspace_id=ws_a.id,
        role="user"
    )
    db_session.add(membership_a)
    
    # 2. Criar Workspace B (alvo do ataque)
    ws_b = WorkspaceModel(name="Workspace B")
    db_session.add(ws_b)
    db_session.commit()
    db_session.refresh(ws_b)
    
    # Adicionar um dado sensível no Workspace B (um tipo de item de trabalho)
    type_b = WorkItemTypeModel(name="Sensitive Type B", workspace_id=ws_b.id, label="Sensitive")
    db_session.add(type_b)
    db_session.commit()
    
    # 3. Simular requisição do Usuário A tentando acessar dados do Workspace B
    # O atacante usa seu próprio User-ID (autenticado) mas aponta para o Workspace B no header
    headers = {
        "X-User-ID": str(user_a.id),
        "X-Workspace-ID": str(ws_b.id),
        "Authorization": "Bearer valid-token-for-a"
    }
    
    response = client.get("/workitems/types", headers=headers)
    
    # EXPECTATIVA DE SEGURANÇA: Deve retornar 403 Forbidden ou 404 Not Found
    # Se retornar 200 OK e listar os dados do Workspace B, há uma vulnerabilidade de IDOR.
    
    assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND], \
        f"VULNERABILIDADE DETECTADA: Usuário do Workspace {ws_a.id} acessou dados do Workspace {ws_b.id}"

def test_access_denied_without_workspace_header(client):
    """Verifica que a API rejeita requisições sem o header de workspace."""
    response = client.get("/workitems/types")
    # FastAPI retorna 422 quando um Header obrigatório falta
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
