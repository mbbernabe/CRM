"""
Migration: Adicionar índices de performance nas tabelas mais acessadas.
Deve ser executado uma única vez no banco de produção.

Referência: Análise de Performance — Item 3 (Índices Ausentes)
"""
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL não configurada. Defina no .env")
    sys.exit(1)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

# Índices simples em workspace_id (se não existirem)
SINGLE_INDEXES = [
    ("ix_teams_workspace_id", "teams", "workspace_id"),
    ("ix_users_workspace_id", "users", "workspace_id"),
    ("ix_pipelines_workspace_id", "pipelines", "workspace_id"),
    ("ix_work_item_field_groups_workspace_id", "work_item_field_groups", "workspace_id"),
    ("ix_work_item_types_workspace_id", "work_item_types", "workspace_id"),
    ("ix_work_items_workspace_id", "work_items", "workspace_id"),
    ("ix_work_item_history_workspace_id", "work_item_history", "workspace_id"),
    ("ix_workspace_invitations_workspace_id", "workspace_invitations", "workspace_id"),
]

# Índices compostos para queries frequentes
COMPOSITE_INDEXES = [
    ("ix_work_items_workspace_pipeline", "work_items", ["workspace_id", "pipeline_id"]),
    ("ix_work_items_workspace_type", "work_items", ["workspace_id", "type_id"]),
    ("ix_work_items_workspace_stage", "work_items", ["workspace_id", "stage_id"]),
    ("ix_history_workitem_workspace", "work_item_history", ["work_item_id", "workspace_id"]),
]

def index_exists(conn, index_name):
    """Verifica se o índice já existe no banco PostgreSQL."""
    result = conn.execute(text(
        "SELECT 1 FROM pg_indexes WHERE indexname = :name"
    ), {"name": index_name})
    return result.fetchone() is not None

def run_migration():
    with engine.connect() as conn:
        created = 0
        skipped = 0

        print("🔧 Criando índices simples (workspace_id)...")
        for idx_name, table, column in SINGLE_INDEXES:
            if index_exists(conn, idx_name):
                print(f"  ⏭ {idx_name} já existe — pulando")
                skipped += 1
            else:
                sql = f'CREATE INDEX "{idx_name}" ON "{table}" ("{column}")'
                conn.execute(text(sql))
                print(f"  ✅ {idx_name} criado em {table}.{column}")
                created += 1

        print("\n🔧 Criando índices compostos...")
        for idx_name, table, columns in COMPOSITE_INDEXES:
            if index_exists(conn, idx_name):
                print(f"  ⏭ {idx_name} já existe — pulando")
                skipped += 1
            else:
                cols = ", ".join(f'"{c}"' for c in columns)
                sql = f'CREATE INDEX "{idx_name}" ON "{table}" ({cols})'
                conn.execute(text(sql))
                print(f"  ✅ {idx_name} criado em {table}.({', '.join(columns)})")
                created += 1

        conn.commit()
        print(f"\n📊 Resultado: {created} índices criados, {skipped} já existentes.")

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 Migration: Índices de Performance")
    print("=" * 50)
    run_migration()
    print("\n✅ Migração finalizada com sucesso!")
