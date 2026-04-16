import sys
import os

# Ensure the parent directory is in the path to import src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.infrastructure.database.db import engine, SessionLocal
from sqlalchemy import text

def drop_tables():
    print("--- Iniciando Remocao de Tabelas Legadas ---")
    
    tables_to_drop = [
        "company_contact_links",
        "company_property_values",
        "contact_property_values",
        "entity_property_links",
        "property_definitions",
        "property_groups",
        "companies",
        "contacts"
    ]
    
    with engine.connect() as conn:
        for table in tables_to_drop:
            print(f"Removendo tabela: {table}...")
            try:
                # Use cascade to ensure dependent objects are dropped (like constraints)
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                conn.commit()
                print(f"OK: Tabela {table} removida.")
            except Exception as e:
                print(f"ERRO: Erro ao remover {table}: {e}")

    print("\n--- Remocao concluida com sucesso! ---")

if __name__ == "__main__":
    drop_tables()
