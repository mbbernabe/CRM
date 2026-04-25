from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, UniqueConstraint, JSON, Index
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
    invitation_message = Column(Text, nullable=True)
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, nullable=True)
    smtp_user = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)
    smtp_sender_email = Column(String, nullable=True)
    smtp_sender_name = Column(String, nullable=True)
    smtp_security = Column(String, default="STARTTLS")
    
    # RF019: API Pública para Leads
    lead_api_key = Column(String, unique=True, index=True, nullable=True)
    lead_pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=True)
    lead_stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=True)
    lead_type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=True)

    teams = relationship("TeamModel", back_populates="workspace", cascade="all, delete-orphan")
    memberships = relationship("MembershipModel", back_populates="workspace", cascade="all, delete-orphan")
    invitations = relationship("WorkspaceInvitationModel", back_populates="workspace", cascade="all, delete-orphan")
    pipelines = relationship("PipelineModel", cascade="all, delete-orphan", foreign_keys="[PipelineModel.workspace_id]")
    work_item_types = relationship("WorkItemTypeModel", cascade="all, delete-orphan", foreign_keys="[WorkItemTypeModel.workspace_id]")
    work_items = relationship("WorkItemModel", cascade="all, delete-orphan", overlaps="workspace")
    field_groups = relationship("WorkItemFieldGroupModel", cascade="all, delete-orphan", foreign_keys="[WorkItemFieldGroupModel.workspace_id]")
    history = relationship("WorkItemHistoryModel", cascade="all, delete-orphan")
    links = relationship("WorkItemLinkModel", cascade="all, delete-orphan")

class TeamModel(BaseModel):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("WorkspaceModel", back_populates="teams")
    memberships = relationship("MembershipModel", back_populates="team")

class UserModel(BaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    
    # Contexto e Status
    last_active_workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True)
    last_active_membership_id = Column(Integer, ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True)
    preferences = Column(JSON, nullable=True) # UI and user settings
    is_active = Column(Boolean, default=True)
    deactivated_at = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # RF028: Perfil do Usuário
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    position = Column(String, nullable=True)

    memberships = relationship("MembershipModel", back_populates="user", cascade="all, delete-orphan", foreign_keys="[MembershipModel.user_id]")

class MembershipModel(BaseModel):
    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint('user_id', 'workspace_id', 'team_id', name='_user_workspace_team_membership_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True, index=True)
    role = Column(String, default="user") # 'admin', 'user'
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserModel", back_populates="memberships", foreign_keys=[user_id])
    workspace = relationship("WorkspaceModel", back_populates="memberships")
    team = relationship("TeamModel", back_populates="memberships")

    @property
    def workspace_name(self):
        return self.workspace.name if self.workspace else None

    @property
    def team_name(self):
        return self.team.name if self.team else None

    @property
    def primary_color(self):
        return self.workspace.primary_color if self.workspace else None


class PipelineModel(BaseModel):
    __tablename__ = "pipelines"
    __table_args__ = (
        UniqueConstraint('workspace_id', 'type_id', 'name', name='_workspace_pipeline_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=False, default=1) # Reference to WorkItemTypeModel.id
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    stages = relationship("PipelineStageModel", back_populates="pipeline", order_by="PipelineStageModel.order", cascade="all, delete-orphan")

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

class WorkItemFieldGroupModel(BaseModel):
    __tablename__ = "work_item_field_groups"
    __table_args__ = (
        UniqueConstraint('type_id', 'name', name='_type_group_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=False)
    name = Column(String, nullable=False)
    order = Column(Integer, default=0)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True, index=True)

    work_item_type = relationship("WorkItemTypeModel", back_populates="field_groups")
    field_definitions = relationship("WorkItemFieldDefinitionModel", back_populates="group")

class WorkItemTypeModel(BaseModel):
    __tablename__ = "work_item_types"
    __table_args__ = (
        UniqueConstraint('workspace_id', 'name', name='_workspace_item_type_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # slug
    label = Column(String, nullable=False) # display
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True, index=True)
    is_system = Column(Boolean, default=False)
    source_type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=True)

    field_definitions = relationship("WorkItemFieldDefinitionModel", back_populates="work_item_type", order_by="WorkItemFieldDefinitionModel.order", cascade="all, delete-orphan")
    field_groups = relationship("WorkItemFieldGroupModel", back_populates="work_item_type", order_by="WorkItemFieldGroupModel.order", cascade="all, delete-orphan")

class WorkItemFieldDefinitionModel(BaseModel):
    __tablename__ = "work_item_field_definitions"
    __table_args__ = (
        UniqueConstraint('type_id', 'name', name='_type_field_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("work_item_field_groups.id"), nullable=True)
    name = Column(String, nullable=False) # slug
    label = Column(String, nullable=False) # display
    field_type = Column(String, default="text")
    options_json = Column(Text, nullable=True) # JSON string for options
    is_required = Column(Boolean, default=False)
    is_default = Column(Boolean, default=True) # Se True, é importado automaticamente no clone_type
    order = Column(Integer, default=0)
    source_field_id = Column(Integer, ForeignKey("work_item_field_definitions.id"), nullable=True)

    work_item_type = relationship("WorkItemTypeModel", back_populates="field_definitions")
    group = relationship("WorkItemFieldGroupModel", back_populates="field_definitions")

class WorkItemModel(BaseModel):
    __tablename__ = "work_items"
    __table_args__ = (
        Index('ix_work_items_workspace_pipeline', 'workspace_id', 'pipeline_id'),
        Index('ix_work_items_workspace_type', 'workspace_id', 'type_id'),
        Index('ix_work_items_workspace_stage', 'workspace_id', 'stage_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("work_item_types.id"), nullable=False)
    custom_fields = Column(JSON, nullable=True) # Central store for dynamic fields
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Responsibility owner
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    recurrence_config = Column(JSON, nullable=True) # Ex: { "frequency": "weekly", "interval": 1, ... }

    pipeline = relationship("PipelineModel")
    stage = relationship("PipelineStageModel")
    work_item_type = relationship("WorkItemTypeModel")
    owner = relationship("UserModel")
    team = relationship("TeamModel")
    workspace = relationship("WorkspaceModel")

class WorkItemHistoryModel(BaseModel):
    __tablename__ = "work_item_history"
    __table_args__ = (
        Index('ix_history_workitem_workspace', 'work_item_id', 'workspace_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id"), nullable=False)
    from_stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=True)
    to_stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    notes = Column(Text, nullable=True)

class WorkspaceInvitationModel(BaseModel):
    __tablename__ = "workspace_invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
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

class WorkItemLinkModel(BaseModel):
    __tablename__ = "work_item_links"
    __table_args__ = (
        UniqueConstraint('workspace_id', 'source_item_id', 'target_item_id', name='_workspace_link_uc'),
        Index('ix_links_source_workspace', 'source_item_id', 'workspace_id'),
        Index('ix_links_target_workspace', 'target_item_id', 'workspace_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    source_item_id = Column(Integer, ForeignKey("work_items.id"), nullable=False)
    target_item_id = Column(Integer, ForeignKey("work_items.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_item = relationship("WorkItemModel", foreign_keys=[source_item_id])
    target_item = relationship("WorkItemModel", foreign_keys=[target_item_id])

