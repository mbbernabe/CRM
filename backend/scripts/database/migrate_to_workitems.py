import sys
import os
import sqlite3
import json
from sqlalchemy import text
from datetime import datetime

# Adiciona o diretório backend ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import WorkItemModel, WorkItemTypeModel, ContactModel, CompanyModel, PipelineModel

def migrate():
    db = SessionLocal()
    try:
        print("🚀 Iniciando migração de Contatos e Empresas para WorkItems...")

        # 1. Garantir que os tipos base existam por Workspace
        workspaces = db.execute(text("SELECT id FROM workspaces")).fetchall()
        
        type_ids = {} # (workspace_id, name) -> type_id
        
        for (ws_id,) in workspaces:
            # Tipo Contato
            contact_type = db.query(WorkItemTypeModel).filter_by(workspace_id=ws_id, name="contact").first()
            if not contact_type:
                contact_type = WorkItemTypeModel(
                    name="contact", label="Contato", icon="User", color="#0091ae", workspace_id=ws_id
                )
                db.add(contact_type)
                db.flush()
            type_ids[(ws_id, "contact")] = contact_type.id
            
            # Tipo Empresa
            company_type = db.query(WorkItemTypeModel).filter_by(workspace_id=ws_id, name="company").first()
            if not company_type:
                company_type = WorkItemTypeModel(
                    name="company", label="Empresa", icon="Building2", color="#516f90", workspace_id=ws_id
                )
                db.add(company_type)
                db.flush()
            type_ids[(ws_id, "company")] = company_type.id

        db.commit()

        # 2. Migrar Contatos
        contacts = db.query(ContactModel).all()
        contact_count = 0
        for c in contacts:
            # Verifica se já migrou (idempotência básica por título/workspace/pipeline simplificada)
            # Em produção usaríamos uma tabela de de-para ou flag. 
            # Aqui vamos criar apenas se não houver um WorkItem idêntico vinculado.
            
            # Precisamos de um pipeline vinculado. Se o contato tem stage_id, buscamos o pipeline desse stage.
            if not c.stage_id:
                continue
                
            stage = db.execute(text("SELECT pipeline_id FROM pipeline_stages WHERE id = :id"), {"id": c.stage_id}).fetchone()
            if not stage:
                continue
            
            pipeline_id = stage[0]
            
            # Verifica se já existe
            exists = db.query(WorkItemModel).filter_by(
                title=c.name, 
                workspace_id=c.workspace_id, 
                type_id=type_ids[(c.workspace_id, "contact")]
            ).first()
            
            if not exists:
                work_item = WorkItemModel(
                    title=c.name,
                    description=f"E-mail: {c.email}\nFone: {c.phone}",
                    pipeline_id=pipeline_id,
                    stage_id=c.stage_id,
                    type_id=type_ids[(c.workspace_id, "contact")],
                    custom_fields={"email": c.email, "phone": c.phone, "legacy_id": c.id, "legacy_type": "contact"},
                    workspace_id=c.workspace_id,
                    created_at=c.created_at
                )
                db.add(work_item)
                contact_count += 1

        # 3. Migrar Empresas
        companies = db.query(CompanyModel).all()
        company_count = 0
        for comp in companies:
            if not comp.stage_id:
                continue
                
            stage = db.execute(text("SELECT pipeline_id FROM pipeline_stages WHERE id = :id"), {"id": comp.stage_id}).fetchone()
            if not stage:
                continue
            
            pipeline_id = stage[0]

            exists = db.query(WorkItemModel).filter_by(
                title=comp.name, 
                workspace_id=comp.workspace_id, 
                type_id=type_ids[(comp.workspace_id, "company")]
            ).first()

            if not exists:
                work_item = WorkItemModel(
                    title=comp.name,
                    description=f"Domínio: {comp.domain}",
                    pipeline_id=pipeline_id,
                    stage_id=comp.stage_id,
                    type_id=type_ids[(comp.workspace_id, "company")],
                    custom_fields={"domain": comp.domain, "legacy_id": comp.id, "legacy_type": "company"},
                    workspace_id=comp.workspace_id,
                    created_at=comp.created_at
                )
                db.add(work_item)
                company_count += 1

        db.commit()
        print(f"✅ Migração concluída!")
        print(f"   - Contatos migrados: {contact_count}")
        print(f"   - Empresas migradas: {company_count}")

    except Exception as e:
        db.rollback()
        print(f"❌ Erro durante a migração: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
