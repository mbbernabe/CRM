from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import sys
import os

# Ajuste para importar do projeto
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.infrastructure.database.models import WorkItemTypeModel, WorkItemFieldDefinitionModel, WorkItemModel

print(f"Diretório atual: {os.getcwd()}")
abs_path = os.path.abspath(os.path.join(os.getcwd(), 'backend', 'crm.db'))
print(f"Caminho do DB: {abs_path}")
engine = create_engine(f"sqlite:///{abs_path}")
Session = sessionmaker(bind=engine)
session = Session()

task_type = session.query(WorkItemTypeModel).filter(WorkItemTypeModel.name == 'task_template').first()
if task_type:
    print(f"Tipo Tarefa encontrado: {task_type.id}")
    
    # 1. Buscar campos antigos
    start_field = session.query(WorkItemFieldDefinitionModel).filter(
        WorkItemFieldDefinitionModel.type_id == task_type.id,
        WorkItemFieldDefinitionModel.name.in_(['start_date', 'data_inicio', 'Data de Inicio'])
    ).first()
    
    due_field = session.query(WorkItemFieldDefinitionModel).filter(
        WorkItemFieldDefinitionModel.type_id == task_type.id,
        WorkItemFieldDefinitionModel.name.in_(['due_date', 'prazo_final', 'Prazo Final'])
    ).first()
    
    # 2. Criar novo campo de Prazo (date_range)
    range_field = session.query(WorkItemFieldDefinitionModel).filter(
        WorkItemFieldDefinitionModel.type_id == task_type.id,
        WorkItemFieldDefinitionModel.name == 'prazo'
    ).first()
    
    if not range_field:
        range_field = WorkItemFieldDefinitionModel(
            type_id=task_type.id,
            name='prazo',
            label='Prazo (Início e Fim)',
            field_type='date_range',
            required=False
        )
        session.add(range_field)
        print("Novo campo 'prazo' (date_range) criado.")
    
    session.commit()
    
    # 3. Migrar dados existentes
    items = session.query(WorkItemModel).filter(WorkItemModel.type_id == task_type.id).all()
    for item in items:
        cf = item.custom_fields or {}
        # Tenta pegar de vários nomes possíveis
        start = cf.get('start_date') or cf.get('data_inicio') or cf.get('Data de Inicio')
        due = cf.get('due_date') or cf.get('prazo_final') or cf.get('Prazo Final')
        
        if start or due:
            cf['prazo'] = f"{start or ''};{due or ''}"
            # Opcional: remover campos antigos para limpar a UI
            if 'start_date' in cf: del cf['start_date']
            if 'due_date' in cf: del cf['due_date']
            if 'data_inicio' in cf: del cf['data_inicio']
            if 'prazo_final' in cf: del cf['prazo_final']
            if 'Data de Inicio' in cf: del cf['Data de Inicio']
            if 'Prazo Final' in cf: del cf['Prazo Final']
            
            item.custom_fields = cf
            print(f"Migrado item {item.id}: {cf['prazo']}")
    
    # 4. Remover definições de campos antigos para limpar a UI
    if start_field: session.delete(start_field)
    if due_field: session.delete(due_field)
    
    session.commit()
    print("Migração concluída.")
else:
    print("Tipo Tarefa não encontrado.")
