
import json
from src.infrastructure.database.db import SessionLocal
from src.infrastructure.repositories.work_item_repository import WorkItemRepository
from src.application.use_cases.work_item.manage_item_types import ManageItemTypesUseCase
from src.application.dtos.work_item_dto import WorkItemTypeCreateDTO, CustomFieldDefinitionDTO, WorkItemFieldGroupDTO

def test_create_service_type():
    db = SessionLocal()
    repo = WorkItemRepository(db)
    use_case = ManageItemTypesUseCase(repo)
    
    workspace_id = 1
    
    # Simular dados do CSV
    fields_raw = [
        ("Nome do Serviço","nome_servico","text","Catálogo Técnico"),
        ("Código SKU/Serviço","sku_servico","text","Catálogo Técnico"),
        ("Categoria do Serviço","categoria","select","Catálogo Técnico"),
        ("Descrição Comercial","descricao_comercial","textarea","Catálogo Técnico"),
        ("Valor Unitário","valor_unitario","currency","Precificação"),
        ("Custo Estimado de Execução","custo_execucao","currency","Precificação"),
        ("Margem de Lucro (%)","margem_lucro","number","Precificação"),
        ("Impostos Incidentes","impostos","multiselect","Precificação"),
        ("Unidade de Medida (Hora/Dia/Mês)","unidade_medida","select","Catálogo Técnico"),
        ("Tempo Estimado de Entrega (h)","tempo_entrega","number","Entrega & SLA"),
        ("SLA de Resposta (h)","sla_resposta","number","Entrega & SLA"),
        ("Nível de Criticidade","criticidade","select","Entrega & SLA"),
        ("Atendimento Presencial?","presencial","boolean","Entrega & SLA"),
        ("Região de Atendimento","regiao","multiselect","Entrega & SLA"),
        ("Periodicidade de Renovação","periodicidade","select","Recorrência & Contrato"),
        ("Garantia (Meses)","garantia","number","Recorrência & Contrato"),
        ("Multa por Rescisão","multa_rescisao","currency","Recorrência & Contrato"),
        ("Requisitos Técnicos Mínimos","requisitos_tecnicos","textarea","Especificações"),
        ("Softwares Necessários","softwares_requisitos","multiselect","Especificações"),
        ("Hardware Necessário","hardware_requisitos","multiselect","Especificações"),
        ("Certificação Exigida","certificacao_exigida","text","Especificações"),
        ("Termos de Uso (Link)","link_termos","text","Documentação"),
        ("Manual de Operação (Link)","link_manual","text","Documentação"),
        ("FAQ do Serviço","faq_link","text","Documentação"),
        ("Ativo no Catálogo","ativo","boolean","Configurações"),
        ("Destaque no Site/Portal","destaque","boolean","Configurações"),
        ("Código Fiscal (NBS)","codigo_fiscal","text","Configurações")
    ]
    
    groups_names = sorted(list(set(f[3] for f in fields_raw)))
    field_groups = [WorkItemFieldGroupDTO(id=f"temp-{i}", name=name, order=i) for i, name in enumerate(groups_names)]
    
    field_definitions = []
    for i, (label, name, ftype, group_name) in enumerate(fields_raw):
        group_id = next(g.id for g in field_groups if g.name == group_name)
        field_definitions.append(CustomFieldDefinitionDTO(
            name=name,
            label=label,
            field_type=ftype,
            group_id=group_id,
            order=i
        ))
        
    dto = WorkItemTypeCreateDTO(
        name="servico_teste",
        label="Serviço Teste",
        icon="Package",
        color="#0091ae",
        field_definitions=field_definitions,
        field_groups=field_groups
    )
    
    try:
        print("Tentando criar o tipo 'servico_teste'...")
        created = use_case.create_type(dto, workspace_id)
        print(f"Sucesso! ID: {created.id}")
    except Exception as e:
        print(f"Erro ao criar tipo: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_create_service_type()
