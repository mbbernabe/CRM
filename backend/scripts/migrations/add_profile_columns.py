import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import text
from src.infrastructure.database.db import SessionLocal

def migrate_users_table():
    db = SessionLocal()
    try:
        print("Iniciando migração da tabela 'users'...")
        
        # Adiciona colunas se não existirem
        queries = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;"
        ]
        
        for query in queries:
            print(f"Executando: {query}")
            db.execute(text(query))
        
        db.commit()
        print("Migração concluída com sucesso!")
        
    except Exception as e:
        print(f"Erro na migração: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_users_table()
