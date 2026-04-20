
from sqlalchemy import text
from src.infrastructure.database.db import engine

def migrate():
    with engine.connect() as conn:
        print("Adicionando coluna 'team_id' à tabela 'work_items'...")
        try:
            conn.execute(text("ALTER TABLE work_items ADD COLUMN team_id INTEGER REFERENCES teams(id)"))
            conn.commit()
            print("[OK] Coluna 'team_id' adicionada com sucesso.")
        except Exception as e:
            print(f"[ERRO] Falha ao adicionar coluna: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
