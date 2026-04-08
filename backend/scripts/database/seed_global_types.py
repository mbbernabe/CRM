import sys
import os
import json
from sqlalchemy import text

# Adiciona o diretório backend ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.db import SessionLocal, engine
from src.infrastructure.database.models import BaseModel, WorkItemTypeModel, WorkItemFieldGroupModel, WorkItemFieldDefinitionModel

def seed_global_types():
    # Garantir que as tabelas novas existam
    BaseModel.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("--- Semeando Tipos Globais de WorkItems (System Types) ---")

        # 1. Tipo: Contato
        contact_type = db.query(WorkItemTypeModel).filter_by(name="contact", workspace_id=None).first()
        if not contact_type:
            contact_type = WorkItemTypeModel(
                name="contact",
                label="Contato",
                icon="User",
                color="#0091ae",
                workspace_id=None,
                is_system=True
            )
            db.add(contact_type)
            db.flush()
            print("   [OK] Criado tipo global: Contato")
        
        # Grupo de Campos para Contato
        basico_group = db.query(WorkItemFieldGroupModel).filter_by(type_id=contact_type.id, name="Informacoes Basicas").first()
        if not basico_group:
            basico_group = WorkItemFieldGroupModel(
                type_id=contact_type.id,
                name="Informacoes Basicas",
                order=0,
                workspace_id=None
            )
            db.add(basico_group)
            db.flush()
            
            # Campos padrao para Contato
            fields = [
                ("email", "E-mail", "email", 0),
                ("phone", "Telefone", "phone", 1),
                ("cpf", "CPF", "cpf", 2),
            ]
            for name, label, ftype, order in fields:
                field_def = db.query(WorkItemFieldDefinitionModel).filter_by(type_id=contact_type.id, name=name).first()
                if not field_def:
                    field_def = WorkItemFieldDefinitionModel(
                        type_id=contact_type.id,
                        group_id=basico_group.id,
                        name=name,
                        label=label,
                        field_type=ftype,
                        order=order
                    )
                    db.add(field_def)
            print("   [OK] Adicionados campos padrao e grupos para Contato")

        # 2. Tipo: Empresa
        company_type = db.query(WorkItemTypeModel).filter_by(name="company", workspace_id=None).first()
        if not company_type:
            company_type = WorkItemTypeModel(
                name="company",
                label="Empresa",
                icon="Building2",
                color="#516f90",
                workspace_id=None,
                is_system=True
            )
            db.add(company_type)
            db.flush()
            print("   [OK] Criado tipo global: Empresa")

        # Grupo para Empresa
        empresa_basico = db.query(WorkItemFieldGroupModel).filter_by(type_id=company_type.id, name="Dados da Empresa").first()
        if not empresa_basico:
            empresa_basico = WorkItemFieldGroupModel(
                type_id=company_type.id,
                name="Dados da Empresa",
                order=0,
                workspace_id=None
            )
            db.add(empresa_basico)
            db.flush()
            
            fields = [
                ("domain", "Dominio/Website", "text", 0),
                ("cnpj", "CNPJ", "text", 1), 
                ("industry", "Setor", "text", 2),
            ]
            for name, label, ftype, order in fields:
                field_def = db.query(WorkItemFieldDefinitionModel).filter_by(type_id=company_type.id, name=name).first()
                if not field_def:
                    field_def = WorkItemFieldDefinitionModel(
                        type_id=company_type.id,
                        group_id=empresa_basico.id,
                        name=name,
                        label=label,
                        field_type=ftype,
                        order=order
                    )
                    db.add(field_def)
            print("   [OK] Adicionados campos padrao e grupos para Empresa")

        db.commit()
        print("Finalizado com sucesso!")

    except Exception as e:
        db.rollback()
        print(f"Erro no seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_global_types()
