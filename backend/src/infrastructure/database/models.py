from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import DeclarativeBase, relationship

class BaseModel(DeclarativeBase):
    pass

class TeamModel(BaseModel):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("UserModel", back_populates="team")

class UserModel(BaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False) # Armazenada em texto plano inicialmente (conforme plano)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("TeamModel", back_populates="users")

class PropertyGroupModel(BaseModel):
    __tablename__ = "property_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    order = Column(Integer, default=0)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

class PropertyDefinitionModel(BaseModel):
    __tablename__ = "property_definitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)  # slug: "personal_email"
    label = Column(String, nullable=False)                          # display: "E-mail Pessoal"
    type = Column(String, default="text")                           # text, number, date, email, select, multiselect, textarea, boolean, currency
    options = Column(Text, nullable=True)                           # Opção 1;Opção 2;Opção 3
    is_system = Column(Boolean, default=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    
    links = relationship("EntityPropertyLinkModel", back_populates="property_def", cascade="all, delete-orphan")

class EntityPropertyLinkModel(BaseModel):
    __tablename__ = "entity_property_links"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, index=True, nullable=False) # contact or company
    property_id = Column(Integer, ForeignKey("property_definitions.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("property_groups.id"), nullable=True)
    order = Column(Integer, default=0)
    is_required = Column(Boolean, default=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    
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
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com propriedades customizadas e contatos vinculados
    property_values = relationship("CompanyPropertyValueModel", back_populates="company", cascade="all, delete-orphan")
    contacts = relationship("ContactModel", secondary="company_contact_links", back_populates="companies")

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
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com as propriedades customizadas e empresas vinculadas
    property_values = relationship("ContactPropertyValueModel", back_populates="contact", cascade="all, delete-orphan")
    companies = relationship("CompanyModel", secondary="company_contact_links", back_populates="contacts")

class ContactPropertyValueModel(BaseModel):
    __tablename__ = "contact_property_values"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("property_definitions.id"), nullable=False)
    value = Column(Text, nullable=True)

    contact = relationship("ContactModel", back_populates="property_values")
    property_def = relationship("PropertyDefinitionModel")
