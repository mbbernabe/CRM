import requests
import json

def test_login_inactive():
    url = "http://localhost:8000/auth/login"
    payload = {
        "email": "inactive@test.com",
        "password": "password123"
    }
    
    # First, ensure the user exists and is inactive
    # (Using a separate script or assuming it's there from previous tests)
    # Actually, let's just use the existing one if possible or create it via DB
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login_inactive()
