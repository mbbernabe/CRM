import requests
import json

def test_register():
    url = "http://localhost:8000/auth/register"
    data = {
        "name": "Super Admin",
        "email": "admin@crm.com",
        "password": "admin",
        "workspace_name": "Antigravity Workspace"
    }
    
    print(f"Tentando registrar em {url}...")
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erro na requisição: {e}")

if __name__ == "__main__":
    test_register()
