from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, UniqueConstraint, JSON
from sqlalchemy.orm import DeclarativeBase, relationship

class BaseModel(DeclarativeBase):
    pass

class WorkspaceModel(BaseModel):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    primary_color = Column(String, default="#0091ae") # HubSpot Blue
    accent_color = Column(String, default="#ff7a59")  # HubSpot Orange
    created_at = Column(DateTime, default=datetime.utcnow)
    invitation_expiry_days = Column(Integer, default=7)

    teams = relationship("TeamModel", back_populates="workspace")
    users = relationship("UserModel", back_populates="workspace")
    invitations = relationship("WorkspaceInvitationModel", back_populates="workspace")

class TeamModel(BaseModel):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("WorkspaceModel", back_populates="teams")
    users = relationship("UserModel", back_populates="team")

class UserModel(BaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False) # Armazenada em texto plano inicialmente (conforme plano)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    role = Column(String, default="user")
    reset_password_token = Column(String, nullable=True, index=True)
    reset_password_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("TeamModel", back_populates="users")
    workspace = relationship("WorkspaceModel", back_populates="users")

class PropertyGroupModel(BaseModel):
    __tablename__ = "property_groups"
    __table_args__ = (UniqueConstraint('workspace_id', 'name', name='_workspace_group_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    order = Column(Integer, default=0)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

class PropertyDefinitionModel(BaseModel):
    __tablename__ = "property_definitions"
    __table_args__ = (UniqueConstraint('workspace_id', 'entity_type', 'name', name='_workspace_prop_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, index=True, nullable=False, default='contact')
    name = Column(String, nullable=False)  # slug: "personal_email"
    label = Column(String, nullable=False)                          # display: "E-mail Pessoal"
    type = Column(String, default="text")                           # text, number, date, email, select, multiselect, textarea, boolean, currency
    options = Column(Text, nullable=True)                           # Opção 1;Opção 2;Opção 3
    is_system = Column(Boolean, default=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    
    links = relationship("EntityPropertyLinkModel", back_populates="property_def", cascade="all, delete-orphan")

class EntityPropertyLinkModel(BaseModel):
    __tablename__ = "entity_property_links"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, index=True, nullable=False) # contact or company
    property_id = Column(Integer, ForeignKey("property_definitions.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("property_groups.id"), nullable=True)
    order = Column(Integer, default=0)
    is_required = Column(Boolean, default=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    
    property_def = relationship("PropertyDefinitionModel", back_populates="links")
    group = relationship("PropertyGroupModel")

class CompanyContactLinkModel(BaseModel):
    __tablename__ = "company_contact_links"
    company_id = Column(Integer, ForeignKey("companies.id"), primary_key=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), primary_key=True)

class CompanyModel(BaseModel):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=True)
    status = Column(String, default="active")
    stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=True) # Pipeline Stage
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com propriedades customizadas e contatos vinculados
    property_values = relationship("CompanyPropertyValueModel", back_populates="company", cascade="all, delete-orphan")
    contacts = relationship("ContactModel", secondary="company_contact_links", back_populates="companies")
    stage = relationship("PipelineStageModel")

class CompanyPropertyValueModel(BaseModel):
    __tablename__ = "company_property_values"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("property_definitions.id"), nullable=False)
    value = Column(Text, nullable=True)

    company = relationship("CompanyModel", back_populates="property_values")
    property_def = relationship("PropertyDefinitionModel")

class ContactModel(BaseModel):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="active")
    stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=True) # Pipeline Stage
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com as propriedades customizadas e empresas vinculadas
    property_values = relationship("ContactPropertyValueModel", back_populates="contact", cascade="all, delete-orphan")
    companies = relationship("CompanyModel", secondary="company_contact_links", back_populates="contacts")
    stage = relationship("PipelineStageModel")

class ContactPropertyValueModel(BaseModel):
    __tablename__ = "contact_property_values"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("property_definitions.id"), nullable=False)
    value = Column(Text, nullable=True)

    contact = relationship("ContactModel", back_populates="property_values")
    property_def = relationship("PropertyDefinitionModel")

class PipelineModel(BaseModel):
    __tablename__ = "pipelines"
    __table_args__ = (UniqueConstraint('workspace_id', 'entity_type', 'name', name='_workspace_pipeline_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    entity_type = Column(String, nullable=False, default="contact") # contact, company, deal
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    stages = relationship("PipelineStageModel", back_populates="pipeline", order_by="PipelineStageModel.order", cascade="all, delete-orphan")
    
    # Friendly Labels for UI
    item_label_singular = Column(String, nullable=True) # Ex: "Oportunidade"
    item_label_plural = Column(String, nullable=True)   # Ex: "Oportunidades"

class PipelineStageModel(BaseModel):
    __tablename__ = "pipeline_stages"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    name = Column(String, nullable=False)
    order = Column(Integer, default=0)
    color = Column(String, default="#CBD5E0")
    is_final = Column(Boolean, default=False)
    metadata_json = Column(Text, nullable=True) # Configurações extras em JSON

    pipeline = relationship("PipelineModel", back_populates="stages")

class WorkItemTypeModel(BaseModel):
    __tablename__ = "work_item_types"
    __table_args__ = (UniqueConstraint('workspace_id', 'name', name='_workspace_item_type_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # slug
    label = Column(String, nullable=False) # display
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    field_definitions = relationship("WorkItemFieldDefinitionModel", back_populates="work_item_type", cascade="all, delete-orphan")

class WorkItemFieldDefinitionModel(BaseModel):
    __tablename__ = "work_item_field_definitions"
    __table_args__ = (UniqueConstraint('type_id', 'name', name='_type_field_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=False)
    name = Column(String, nullable=False) # slug
    label = Column(String, nullable=False) # display
    field_type = Column(String, default="text")
    options_json = Column(Text, nullable=True) # JSON string for options
    is_required = Column(Boolean, default=False)
    order = Column(Integer, default=0)

    work_item_type = relationship("WorkItemTypeModel", back_populates="field_definitions")

class WorkItemModel(BaseModel):
    __tablename__ = "work_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=False)
    custom_fields = Column(JSON, nullable=True) # Central store for dynamic fields
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Responsibility owner
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pipeline = relationship("PipelineModel")
    stage = relationship("PipelineStageModel")
    work_item_type = relationship("WorkItemTypeModel")
    owner = relationship("UserModel")

class WorkItemHistoryModel(BaseModel):
    __tablename__ = "work_item_history"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id"), nullable=False)
    from_stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=True)
    to_stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    notes = Column(Text, nullable=True)

class WorkspaceInvitationModel(BaseModel):
    __tablename__ = "workspace_invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    role = Column(String, default="user")
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("WorkspaceModel", back_populates="invitations")
    inviter = relationship("UserModel", foreign_keys=[invited_by])
    team = relationship("TeamModel")

class SystemSettingsModel(BaseModel):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(Text, nullable=True)
    description = Column(String, nullable=True)
    is_encrypted = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
