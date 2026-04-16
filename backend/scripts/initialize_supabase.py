import sys
import os
import json
from datetime import datetime, timedelta

# Ensure the parent directory is in the path to import src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.infrastructure.database.db import engine, SessionLocal, init_db
from src.infrastructure.database.models import (
    BaseModel, WorkItemTypeModel, WorkItemFieldDefinitionModel, 
    WorkItemFieldGroupModel, WorkspaceModel, UserModel, TeamModel
)
from src.infrastructure.security.auth_utils import SecurityUtils

def initialize():
    print("--- Iniciando Inicializacao do Supabase ---")
    
    # 1. Create Tables
    print("Criando tabelas...")
    try:
        init_db()
        print("OK: Tabelas criadas com sucesso.")
    except Exception as e:
        print(f"ERRO: Erro ao criar tabelas: {e}")
        return

    db = SessionLocal()
    try:
        # 2. Seed Global Templates
        print("\nSemeando modelos globais (Work Item Types)...")
        if db.query(WorkItemTypeModel).filter(WorkItemTypeModel.workspace_id == None).count() > 0:
            print("INFO: Templates ja existem. Pulando...")
        else:
            # 2.1 Contato
            contact = WorkItemTypeModel(name="contact_template", label="Contato (Modelo)", icon="User", color="#0091ae", workspace_id=None, is_system=True)
            db.add(contact)
            db.flush()
            
            g1 = WorkItemFieldGroupModel(type_id=contact.id, name="Informacoes de Contato", order=0)
            db.add(g1)
            db.flush()
            
            db.add(WorkItemFieldDefinitionModel(type_id=contact.id, group_id=g1.id, name="email", label="E-mail", field_type="email", order=0))
            db.add(WorkItemFieldDefinitionModel(type_id=contact.id, group_id=g1.id, name="phone", label="Telefone", field_type="phone", order=1))

            # 2.2 Negocio
            deal = WorkItemTypeModel(name="deal_template", label="Negocio (Modelo)", icon="DollarSign", color="#ff7a59", workspace_id=None, is_system=True)
            db.add(deal)
            db.flush()
            
            g2 = WorkItemFieldGroupModel(type_id=deal.id, name="Financeiro", order=0)
            db.add(g2)
            db.flush()
            
            db.add(WorkItemFieldDefinitionModel(type_id=deal.id, group_id=g2.id, name="amount", label="Valor do Negocio", field_type="currency", order=0))
            db.add(WorkItemFieldDefinitionModel(type_id=deal.id, group_id=g2.id, name="close_date", label="Data de Fechamento", field_type="date", order=1))

            print("OK: Modelos globais criados.")

        # 3. Create Default Workspace
        print("\nVerificando Workspace padrao...")
        workspace = db.query(WorkspaceModel).filter(WorkspaceModel.id == 1).first()
        if not workspace:
            workspace = WorkspaceModel(
                id=1,
                name="Meu CRM",
                description="Workspace padrao do sistema",
                primary_color="#0091ae",
                accent_color="#ff7a59"
            )
            db.add(workspace)
            db.flush()
            print("OK: Workspace 'Meu CRM' (ID: 1) criado.")
        else:
            print("INFO: Workspace padrao ja existe.")

        # 4. Create/Reset Super Admin
        email = 'mbbernabe@gmail.com'
        print(f"\nVerificando Super Admin ({email})...")
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user:
            print(f"INFO: Usuario {email} ja existe. Atualizando permissoes e senha...")
            user.role = 'superadmin'
            user.password = SecurityUtils.hash_password('admin1234')
            user.workspace_id = workspace.id
            print("OK: Usuario atualizado (Senha resetada para: admin1234).")
        else:
            user = UserModel(
                name="Marcelo Bernabe",
                email=email,
                password=SecurityUtils.hash_password('admin1234'),
                workspace_id=workspace.id,
                role='superadmin'
            )
            db.add(user)
            print("OK: Super Admin criado (Senha inicial: admin1234).")

        db.commit()
        print("\n--- Inicializacao concluida com sucesso! ---")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro durante a inicialização: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    initialize()
