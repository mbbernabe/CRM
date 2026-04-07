import sys
import os

# Add the parent directory to sys.path to allow importing from src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.db import init_db

def main():
    print("Iniciando criação das tabelas do Motor de WorkItems...")
    try:
        init_db()
        print("Tabelas criadas com sucesso no crm.db.")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")

if __name__ == "__main__":
    main()
