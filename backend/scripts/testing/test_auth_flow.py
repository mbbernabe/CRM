import requests
import json
import uuid

BASE_URL = "http://localhost:8000/auth"

def test_full_auth_flow():
    print("--- [TEST: FULL AUTH FLOW] ---")
    
    # 1. Dados de teste aleatórios para evitar conflitos
    unique_id = str(uuid.uuid4())[:8]
    test_user = {
        "name": f"Test User {unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "password123",
        "workspace_name": f"Workspace {unique_id}"
    }

    # 2. Testar Registro
    print(f"Registrando usuário: {test_user['email']}...")
    try:
        reg_res = requests.post(f"{BASE_URL}/register", json=test_user)
        if reg_res.status_code == 201:
            print("Cadastro bem-sucedido (201)!")
            data = reg_res.json()
            user = data.get("user")
            print(f"Usuário criado: ID {user.get('id')}, Workspace ID {user.get('workspace_id')}")
        else:
            print(f"ERRO no cadastro: {reg_res.status_code} - {reg_res.text}")
            return
    except Exception as e:
        print(f"Falha na conexão: {e}")
        return

    # 3. Testar Registro Duplicado (Deve dar erro amigável)
    print("Testando registro duplicado (deve falhar)...")
    reg_dup_res = requests.post(f"{BASE_URL}/register", json=test_user)
    if reg_dup_res.status_code == 400:
        print(f"Sucesso! Erro amigável recebido: {reg_dup_res.json().get('detail')}")
    else:
        print(f"ERRO: Esperava 400, recebi {reg_dup_res.status_code}")

    # 4. Testar Login
    print(f"Fazendo login com: {test_user['email']}...")
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    log_res = requests.post(f"{BASE_URL}/login", json=login_data)
    if log_res.status_code == 200:
        print("Login bem-sucedido (200)!")
        data = log_res.json()
        user = data.get("user")
        print(f"Usuário logado: {user.get('name')} (Role: {user.get('role')})")
    else:
        print(f"ERRO no login: {log_res.status_code} - {log_res.text}")

    # 5. Testar Login com Senha Errada
    print("Testando login com senha errada (deve falhar)...")
    login_wrong = {
        "email": test_user["email"],
        "password": "wrongpassword"
    }
    log_wrong_res = requests.post(f"{BASE_URL}/login", json=login_wrong)
    if log_wrong_res.status_code == 401:
        print(f"Sucesso! Erro amigável recebido: {log_wrong_res.json().get('detail')}")
    else:
        print(f"ERRO: Esperava 401, recebi {log_wrong_res.status_code}")

    print("--- [TESTE CONCLUÍDO] ---")

if __name__ == "__main__":
    test_full_auth_flow()
