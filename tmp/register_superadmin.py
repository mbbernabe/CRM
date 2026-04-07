import urllib.request
import urllib.error
import json

url = 'http://localhost:8000/auth/register'
data = json.dumps({
    "name": "Marcelo Barroso Bernabe",
    "email": "mbbernabe@gmail.com",
    "password": "mbb1223",
    "workspace_name": "Minha Empresa Dev"
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read())
        print("REGISTRO OK!")
        print(f"  User: {result['user']['name']}")
        print(f"  Email: {result['user']['email']}")
        print(f"  Role: {result['user']['role']}")
        print(f"  Workspace: {result['workspace']['name']}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP Error {e.code}: {body}")
except Exception as e:
    print(f"Erro de conexao: {e}")
