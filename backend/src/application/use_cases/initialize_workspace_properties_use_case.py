from src.domain.entities.property import PropertyDefinition, PropertyGroup, EntityPropertyLink
from src.domain.repositories.property_repository import IPropertyRepository

class InitializeWorkspacePropertiesUseCase:
    def __init__(self, property_repo: IPropertyRepository):
        self.property_repo = property_repo

    def execute(self, workspace_id: int):
        # 1. Criar Grupos Padrão
        contact_info_group = PropertyGroup(name="Informações de Contato", order=0)
        contact_info_group = self.property_repo.save_group(contact_info_group, workspace_id)

        company_info_group = PropertyGroup(name="Informações da Empresa", order=0)
        company_info_group = self.property_repo.save_group(company_info_group, workspace_id)

        # 2. Definir Propriedades de Contato Padrão
        contact_props = [
            {"name": "name", "label": "Nome Completo", "type": "text", "is_system": True},
            {"name": "email", "label": "Email Principal", "type": "email", "is_system": True},
            {"name": "phone", "label": "Telefone", "type": "text", "is_system": True},
            {"name": "status", "label": "Status do Contato", "type": "select", "options": "Ativo;Inativo;Lead;Cliente", "is_system": True},
        ]

        for p_data in contact_props:
            prop_def = PropertyDefinition(**p_data, entity_type="contact")
            prop_def = self.property_repo.save_definition(prop_def, workspace_id)
            # Vincular ao grupo de contato
            self.property_repo.save_entity_link(EntityPropertyLink(
                entity_type="contact",
                property_id=prop_def.id,
                group_id=contact_info_group.id,
                order=0,
                is_required=True if p_data["name"] == "name" else False,
                workspace_id=workspace_id
            ), workspace_id)

        # 3. Definir Propriedades de Empresa Padrão
        company_props = [
            {"name": "name", "label": "Nome da Empresa", "type": "text", "is_system": True},
            {"name": "domain", "label": "Domínio/Site", "type": "text", "is_system": True},
            {"name": "status", "label": "Status da Empresa", "type": "select", "options": "Ativo;Lead;Prospect;Inativo", "is_system": True},
        ]

        for p_data in company_props:
            prop_def = PropertyDefinition(**p_data, entity_type="company")
            prop_def = self.property_repo.save_definition(prop_def, workspace_id)
            # Vincular ao grupo de empresa
            self.property_repo.save_entity_link(EntityPropertyLink(
                entity_type="company",
                property_id=prop_def.id,
                group_id=company_info_group.id,
                order=0,
                is_required=True if p_data["name"] == "name" else False,
                workspace_id=workspace_id
            ), workspace_id)

        return True
