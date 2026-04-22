import requests
import json
import time

def test_register():
    url = "http://localhost:8000/auth/register"
    timestamp = int(time.time())
    data = {
        "name": "User Test",
        "email": f"test_{timestamp}@crm.com",
        "password": "admin",
        "workspace_name": f"Workspace {timestamp}"
    }
    
    print(f"Tentando registrar em {url} com email: {data['email']}...")
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Erro na requisição: {e}")

if __name__ == "__main__":
    test_register()
