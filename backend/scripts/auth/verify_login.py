
import requests

def test_login(email, password):
    url = "http://localhost:8000/auth/login"
    payload = {"email": email, "password": password}
    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"[{email}] Login Status: {response.status_code}")
        print(f"[{email}] Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login("test1@example.com", "password123")
