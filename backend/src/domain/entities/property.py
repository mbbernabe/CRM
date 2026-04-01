from dataclasses import dataclass, field
from typing import Optional

@dataclass
class PropertyDefinition:
    id: Optional[int] = None
    name: str = ""          # slug: "personal_email"
    label: str = ""         # display: "E-mail Pessoal"
    type: str = "text"      # text, number, date, email, select
    options: Optional[str] = None
    is_system: bool = False

@dataclass
class PropertyGroup:
    id: Optional[int] = None
    name: str = ""
    order: int = 0

@dataclass
class EntityPropertyLink:
    id: Optional[int] = None
    entity_type: str = "contact"
    property_id: int = 0
    group_id: Optional[int] = None
    order: int = 0
    is_required: bool = False
    
    # Relacionamentos para facilitar o trânsito de dados na UI
    property_def: Optional[PropertyDefinition] = None
    group: Optional[PropertyGroup] = None

@dataclass
class ContactPropertyValue:
    contact_id: int
    property_id: int
    value: str
    property_def: Optional[PropertyDefinition] = None

@dataclass
class CompanyPropertyValue:
    company_id: int
    property_id: int
    value: str
    property_def: Optional[PropertyDefinition] = None
