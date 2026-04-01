from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import DeclarativeBase, relationship

class BaseModel(DeclarativeBase):
    pass

class PropertyDefinitionModel(BaseModel):
    __tablename__ = "property_definitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)  # slug: "personal_email"
    label = Column(String, nullable=False)                          # display: "E-mail Pessoal"
    type = Column(String, default="text")                           # text, number, date, email, select, multiselect, textarea, boolean, currency
    group = Column(String, default="Outros")                        # Endereço, Documentos, etc.
    options = Column(Text, nullable=True)                           # Opção 1;Opção 2;Opção 3
    is_system = Column(Boolean, default=False)
    is_required = Column(Boolean, default=False)

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
