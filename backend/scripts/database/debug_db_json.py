from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json

# Configuração simples para conectar ao SQLite local
DATABASE_URL = "sqlite:///./crm.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- Verificando Tipos de Objetos ---")
try:
    # 1. Listar Tipos
    types = db.execute(text("SELECT id, name, label FROM work_item_types")).all()
    print(f"Total de tipos: {len(types)}")
    for t in types:
        print(f"ID: {t.id} | Name: {t.name} | Label: {t.label}")

    # 2. Listar Campos Customizados e testar JSON
    print("\n--- Verificando Definições de Campos ---")
    fields = db.execute(text("SELECT id, name, options_json FROM work_item_field_definitions")).all()
    for f in fields:
        print(f"Verificando Campo ID: {f.id} ({f.name})")
        if f.options_json:
            try:
                data = json.loads(f.options_json)
                print(f"  [OK] JSON válido: {data}")
            except Exception as e:
                print(f"  [ERRO] JSON INVÁLIDO encontrado: '{f.options_json}' | Erro: {e}")
except Exception as e:
    print(f"Erro ao acessar o banco: {e}")
finally:
    db.close()
