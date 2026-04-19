import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

db_url = os.getenv("DATABASE_URL")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print(f"Testing connection with psycopg2 directly...")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = [row[0] for row in cur.fetchall()]
    print(f"Tables found: {tables}")
    
    required_tables = ["workspaces", "users", "work_items", "teams", "pipelines"]
    missing = [t for t in required_tables if t not in tables]
    
    if not missing:
        print("\n[RESULT] O banco de dados já possui as tabelas necessárias.")
    elif len(tables) == 0:
        print("\n[RESULT] O banco de dados está vazio. É necessário rodar o script de inicialização.")
    else:
        print(f"\n[RESULT] O banco de dados existe mas faltam tabelas: {missing}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"\n[ERROR] Erro ao conectar ao banco de dados: {e}")
