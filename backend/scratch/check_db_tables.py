import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Path adjust to find .env in backend/
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    exit(1)

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print(f"Connecting to: {db_url.split('@')[-1]}") # Hide credentials

try:
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    
    required_tables = ["workspaces", "users", "work_items", "teams", "pipelines"]
    missing = [t for t in required_tables if t not in tables]
    
    if not missing:
        print("\n[RESULT] O banco de dados já possui as tabelas necessárias.")
    elif len(tables) == 0:
        print("\n[RESULT] O banco de dados está vazio. É necessário rodar o script de inicialização.")
    else:
        print(f"\n[RESULT] O banco de dados existe mas faltam tabelas: {missing}")
except Exception as e:
    print(f"\n[ERROR] Erro ao conectar ao banco de dados: {e}")
