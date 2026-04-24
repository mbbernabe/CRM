import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.infrastructure.database.models import WorkItemTypeModel, WorkItemFieldDefinitionModel, WorkItemModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres.npblzejgnbvfzexqrwhy:Zpep0a45Vr6353vJ@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

try:
    # 1. Identificar tipos de "Tarefa"
    types = session.query(WorkItemTypeModel).filter(WorkItemTypeModel.label.ilike('%Tarefa%')).all()
    
    for t in types:
        print(f'Processando Tipo: {t.label} (ID: {t.id})')
        
        # Buscar definições atuais
        fields = session.query(WorkItemFieldDefinitionModel).filter(WorkItemFieldDefinitionModel.type_id == t.id).all()
        field_map = {f.name: f for f in fields}
        
        has_start = 'start_date' in field_map
        has_due = 'due_date' in field_map
        
        if has_start or has_due:
            print(f'  - Convertendo campos de data para date_range...')
            
            # Criar novo campo "Prazo" se não existir
            if 'prazo' not in field_map:
                new_field = WorkItemFieldDefinitionModel(
                    type_id=t.id,
                    name='prazo',
                    label='Prazo (Início e Fim)',
                    field_type='date_range',
                    order=field_map.get('start_date', field_map.get('due_date')).order,
                    is_required=False,
                    is_default=True,
                    group_id=field_map.get('start_date', field_map.get('due_date')).group_id
                )
                session.add(new_field)
                session.flush()
                print(f'  - Campo "prazo" criado.')
            
            # 2. Migrar dados dos WorkItems
            items = session.query(WorkItemModel).filter(WorkItemModel.type_id == t.id).all()
            for item in items:
                custom = item.custom_fields or {}
                start = custom.get('start_date', '')
                due = custom.get('due_date', '')
                
                if start or due:
                    custom['prazo'] = f"{start};{due}"
                    # Remover antigos
                    if 'start_date' in custom: del custom['start_date']
                    if 'due_date' in custom: del custom['due_date']
                    
                    item.custom_fields = custom
                    session.add(item)
            
            print(f'  - {len(items)} itens migrados.')
            
            # 3. Remover definições antigas
            if has_start: session.delete(field_map['start_date'])
            if has_due: session.delete(field_map['due_date'])
            
    session.commit()
    print('Migração concluída com sucesso!')
except Exception as e:
    session.rollback()
    print(f'Erro durante a migração: {e}')
finally:
    session.close()
