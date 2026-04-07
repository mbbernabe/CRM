import sys
import sqlite3
import os

sys.path.insert(0, 'backend')

from sqlalchemy import create_engine
from src.infrastructure.database.models import BaseModel

DB_PATH = os.path.abspath('backend/crm.db')

print(f"=== RESET COMPLETO DO BANCO ===")
print(f"Banco: {DB_PATH}")

# Remover banco antigo
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print("Banco antigo removido.")

# Recriar com schema completo
url = f"sqlite:///{DB_PATH}"
engine = create_engine(url, connect_args={"check_same_thread": False})
BaseModel.metadata.create_all(bind=engine)
print("Schema criado com sucesso!")

# Verificar tabelas
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cursor.fetchall()]
print(f"Tabelas criadas ({len(tables)}): {tables}")

# Verificar colunas de property_groups
cursor.execute("PRAGMA table_info(property_groups)")
cols = cursor.fetchall()
print(f"\nColunas de property_groups:")
for col in cols:
    print(f"  {col[1]} ({col[2]})")

conn.close()
print("\n=== RESET CONCLUIDO ===")
print("Acesse o sistema e clique em 'Acesso Rapido (SuperAdmin)' para criar o primeiro usuario.")
