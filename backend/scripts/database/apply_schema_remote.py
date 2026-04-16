
from src.infrastructure.database.db import init_db
import sys

try:
    print("Iniciando a criação das tabelas no Supabase...")
    init_db()
    print("Tabelas criadas com sucesso!")
except Exception as e:
    print(f"Erro ao criar tabelas: {e}")
    sys.exit(1)
