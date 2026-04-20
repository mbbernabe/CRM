import httpx
import json
import asyncio

async def test_login_inactive():
    url = "http://localhost:8000/auth/login"
    payload = {
        "email": "inactive@test.com",
        "password": "password123"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response Body: {json.dumps(response.json(), indent=2)}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_login_inactive())
