from src.infrastructure.database.db import SessionLocal
from src.infrastructure.repositories.sqlalchemy_pipeline_repository import SqlAlchemyPipelineRepository
from src.domain.entities.pipeline import Pipeline, PipelineStage

db = SessionLocal()
repo = SqlAlchemyPipelineRepository(db)

try:
    # Cria uma pipeline de teste para o Team 1
    stages = [
        PipelineStage(name="Novo Lead", order=1, color="#3182CE"),
        PipelineStage(name="Qualificado", order=2, color="#38A169"),
        PipelineStage(name="Fechado", order=3, color="#E53E3E", is_final=True)
    ]
    p = Pipeline(name="Vendas Diretas", entity_type="contact", stages=stages)
    saved = repo.save(p, team_id=1)
    print(f"Pipeline criada com sucesso: ID {saved.id}")
    
    # Lista as pipelines
    all_p = repo.list_all(team_id=1)
    print(f"Total de pipelines para o Team 1: {len(all_p)}")
    
except Exception as e:
    print(f"Erro ao testar: {e}")
finally:
    db.close()
