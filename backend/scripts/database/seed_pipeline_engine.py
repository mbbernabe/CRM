import sys
import os

# Adiciona o diretório backend ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import (
    WorkspaceModel, PipelineModel, PipelineStageModel, 
    WorkItemTypeModel, WorkItemFieldDefinitionModel
)

from sqlalchemy import text

def seed():
    db = SessionLocal()
    try:
        # 1. Buscar workspace do admin (geralmente ID 1) usando SQL bruto para evitar erros de esquema
        result = db.execute(text("SELECT id FROM workspaces LIMIT 1")).fetchone()
        if not result:
            print("Nenhum workspace encontrado para seed.")
            return
        ws_id = result[0]

        print(f"Semeando dados para Workspace ID: {ws_id}")

        # 2. Criar Pipeline de Vendas se não existir
        pipeline = db.query(PipelineModel).filter_by(workspace_id=ws_id, name="Funil de Vendas Base").first()
        if not pipeline:
            pipeline = PipelineModel(
                name="Funil de Vendas Base",
                entity_type="workItem",
                workspace_id=ws_id,
                item_label_singular="Oportunidade",
                item_label_plural="Oportunidades"
            )
            db.add(pipeline)
            db.flush()
            
            # Stages
            stages = [
                PipelineStageModel(pipeline_id=pipeline.id, name="Prospecção", order=0, color="#3182CE"),
                PipelineStageModel(pipeline_id=pipeline.id, name="Qualificação", order=1, color="#F6AD55"),
                PipelineStageModel(pipeline_id=pipeline.id, name="Proposta", order=2, color="#9F7AEA"),
                PipelineStageModel(pipeline_id=pipeline.id, name="Fechado Ganho", order=3, color="#48BB78", is_final=True),
                PipelineStageModel(pipeline_id=pipeline.id, name="Fechado Perdido", order=4, color="#F56565", is_final=True),
            ]
            for s in stages:
                db.add(s)

        # 3. Criar WorkItemType "Negócio" se não existir
        item_type = db.query(WorkItemTypeModel).filter_by(workspace_id=ws_id, name="deal").first()
        if not item_type:
            item_type = WorkItemTypeModel(
                name="deal",
                label="Negócio",
                icon="Handshake",
                color="#ff7a59",
                workspace_id=ws_id
            )
            db.add(item_type)
            db.flush()
            
            # Field Definitions
            fields = [
                WorkItemFieldDefinitionModel(type_id=item_type.id, name="value", label="Valor", field_type="number", order=0),
                WorkItemFieldDefinitionModel(type_id=item_type.id, name="close_date", label="Data de Fechamento", field_type="date", order=1),
            ]
            for f in fields:
                db.add(f)

        db.commit()
        print("Seed do Motor de Pipeline concluído com sucesso!")
        
    except Exception as e:
        db.rollback()
        print(f"Erro no seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
