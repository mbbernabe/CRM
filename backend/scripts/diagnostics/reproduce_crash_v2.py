
import requests
import sys

def test_register_two(email, team):
    url = "http://localhost:8000/auth/register"
    payload = {
        "name": "Test User",
        "email": email,
        "password": "password123",
        "team_name": team
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"[{team}] Status Code: {response.status_code}")
        print(f"[{team}] Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_register_two("test1@example.com", "Team A")
    test_register_two("test2@example.com", "Team B")
