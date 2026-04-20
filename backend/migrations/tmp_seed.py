import json
import sys
import os

# Ensure the parent directory is in the path to import src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import WorkItemTypeModel, WorkItemFieldDefinitionModel, WorkItemFieldGroupModel

def populate():
    db = SessionLocal()
    try:
        # Check if already has templates
        if db.query(WorkItemTypeModel).filter(WorkItemTypeModel.workspace_id == None).count() > 0:
            print("Templates já existem. Pulando...")
            return

        # 1. Contato
        contact = WorkItemTypeModel(name="contact_template", label="Contato (Modelo)", icon="User", color="#0091ae", workspace_id=None, is_system=True)
        db.add(contact)
        db.flush()
        
        g1 = WorkItemFieldGroupModel(type_id=contact.id, name="Informações de Contato", order=0)
        db.add(g1)
        db.flush()
        
        db.add(WorkItemFieldDefinitionModel(type_id=contact.id, group_id=g1.id, name="email", label="E-mail", field_type="email", order=0))
        db.add(WorkItemFieldDefinitionModel(type_id=contact.id, group_id=g1.id, name="phone", label="Telefone", field_type="phone", order=1))

        # 2. Negócio
        deal = WorkItemTypeModel(name="deal_template", label="Negócio (Modelo)", icon="DollarSign", color="#ff7a59", workspace_id=None, is_system=True)
        db.add(deal)
        db.flush()
        
        g2 = WorkItemFieldGroupModel(type_id=deal.id, name="Financeiro", order=0)
        db.add(g2)
        db.flush()
        
        db.add(WorkItemFieldDefinitionModel(type_id=deal.id, group_id=g2.id, name="amount", label="Valor do Negócio", field_type="currency", order=0))
        db.add(WorkItemFieldDefinitionModel(type_id=deal.id, group_id=g2.id, name="close_date", label="Data de Fechamento", field_type="date", order=1))

        # 3. Ticket de Suporte
        ticket = WorkItemTypeModel(name="ticket_template", label="Ticket de Suporte (Modelo)", icon="LifeBuoy", color="#f2545b", workspace_id=None, is_system=True)
        db.add(ticket)
        db.flush()
        
        g3 = WorkItemFieldGroupModel(type_id=ticket.id, name="Detalhes do Problema", order=0)
        db.add(g3)
        db.flush()
        
        db.add(WorkItemFieldDefinitionModel(type_id=ticket.id, group_id=g3.id, name="priority", label="Prioridade", field_type="select", options_json=json.dumps(["Baixa", "Média", "Alta", "Crítica"]), order=0))
        db.add(WorkItemFieldDefinitionModel(type_id=ticket.id, group_id=g3.id, name="issue_type", label="Tipo de Incidente", field_type="text", order=1))

        db.commit()
        print("Modelos globais criados com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate()
