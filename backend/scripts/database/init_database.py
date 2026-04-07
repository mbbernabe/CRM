import sys
import os

# Adiciona o diretório backend ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.db import init_db

def main():
    print("🚀 Inicializando tabelas do banco de dados...")
    init_db()
    print("✅ Tabelas criadas com sucesso.")

if __name__ == "__main__":
    main()
