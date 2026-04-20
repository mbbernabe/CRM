import requests
import json

BASE_URL = "http://localhost:8000/workitems/types"
HEADERS = {"X-Workspace-Id": "1"} # Default workspace for trial/dev

def test_crud():
    print("Testing GET...")
    res = requests.get(BASE_URL, headers=HEADERS)
    print(f"GET: {res.status_code}, {res.text}")
    
    print("\nTesting POST...")
    payload = {
        "name": "test_type",
        "label": "Test Type",
        "icon": "Package",
        "color": "#0091ae",
        "field_definitions": [
            {
                "name": "field1",
                "label": "Field 1",
                "field_type": "text",
                "required": True,
                "order": 1
            }
        ]
    }
    res = requests.post(BASE_URL, json=payload, headers=HEADERS)
    print(f"POST: {res.status_code}, {res.text}")
    if res.status_code != 200:
        return
    
    new_id = res.json()["id"]
    
    print(f"\nTesting PUT on ID {new_id}...")
    payload["label"] = "Updated Type"
    res = requests.put(f"{BASE_URL}/{new_id}", json=payload, headers=HEADERS)
    print(f"PUT: {res.status_code}, {res.text}")
    
    print(f"\nTesting DELETE on ID {new_id}...")
    res = requests.delete(f"{BASE_URL}/{new_id}", headers=HEADERS)
    print(f"DELETE: {res.status_code}")

if __name__ == "__main__":
    test_crud()
