import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Check Workspaces
    cur.execute("SELECT id, name FROM workspaces")
    workspaces = cur.fetchall()
    print(f"Workspaces found: {len(workspaces)}")
    for w in workspaces:
        print(f" - ID: {w[0]}, Name: {w[1]}")
    
    # Check Users
    cur.execute("SELECT id, email FROM users")
    users = cur.fetchall()
    print(f"\nUsers found: {len(users)}")
    for u in users:
        print(f" - ID: {u[0]}, Email: {u[1]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error querying data: {e}")
