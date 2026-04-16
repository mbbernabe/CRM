import urllib.request
import json

url = "http://localhost:8000/auth/register"
payload = {
    "name": "Teste",
    "email": "superadmin@crm.com",
    "password": "password123",
    "workspace_name": "Teste Workspace"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print(f"Response Body: {response.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Response Body: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
