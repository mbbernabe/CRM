
import requests
import sys

def test_register():
    url = "http://localhost:8000/auth/register"
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123",
        "team_name": "Test Team"
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_register()
