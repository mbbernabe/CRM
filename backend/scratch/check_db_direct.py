import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Guessing direct host based on project ref
project_ref = "npblzejgnbvfzexqrwhy"
password = "2emZjjLOwknGbg9z"
direct_host = f"db.{project_ref}.supabase.co"

print(f"Testing DIRECT connection to {direct_host}...")

try:
    conn = psycopg2.connect(
        host=direct_host,
        database="postgres",
        user="postgres",
        password=password,
        port="5432"
    )
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = [row[0] for row in cur.fetchall()]
    print(f"Tables found: {tables}")
    cur.close()
    conn.close()
    print("\n[SUCCESS] Conexão direta funcionou!")
except Exception as e:
    print(f"\n[ERROR] Conexão direta também falhou: {e}")
