import sys
import os

# Adiciona o diretório atual ao path para importar src
sys.path.append(os.getcwd())

try:
    from src.infrastructure.database.models import WorkspaceModel, PipelineModel
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Tenta inicializar os mappers
    engine = create_engine("sqlite:///:memory:")
    WorkspaceModel.metadata.create_all(engine)
    print("Mappers inicializados com sucesso!")
except Exception as e:
    print(f"Erro ao inicializar mappers: {e}")
    import traceback
    traceback.print_exc()
