from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import DeclarativeBase, relationship

class BaseModel(DeclarativeBase):
    pass

class PropertyGroupModel(BaseModel):
    __tablename__ = "property_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    order = Column(Integer, default=0)

class PropertyDefinitionModel(BaseModel):
    __tablename__ = "property_definitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)  # slug: "personal_email"
    label = Column(String, nullable=False)                          # display: "E-mail Pessoal"
    type = Column(String, default="text")                           # text, number, date, email, select, multiselect, textarea, boolean, currency
    group = Column(String, default="Outros")                        # Mantido para compatibilidade inicial
    group_id = Column(Integer, ForeignKey("property_groups.id"), nullable=True)
    entity_type = Column(String, default="contact", index=True, nullable=False) # contact or company
    options = Column(Text, nullable=True)                           # Opção 1;Opção 2;Opção 3
    order = Column(Integer, default=0)
    is_system = Column(Boolean, default=False)
    is_required = Column(Boolean, default=False)

class CompanyModel(BaseModel):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com propriedades customizadas
    property_values = relationship("CompanyPropertyValueModel", back_populates="company", cascade="all, delete-orphan")

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
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com as propriedades customizadas
    property_values = relationship("ContactPropertyValueModel", back_populates="contact", cascade="all, delete-orphan")

class ContactPropertyValueModel(BaseModel):
    __tablename__ = "contact_property_values"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("property_definitions.id"), nullable=False)
    value = Column(Text, nullable=True)

    contact = relationship("ContactModel", back_populates="property_values")
    property_def = relationship("PropertyDefinitionModel")
