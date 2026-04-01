from dataclasses import dataclass, field
from typing import Optional

@dataclass
class PropertyDefinition:
    id: Optional[int] = None
    name: str = ""          # slug: "personal_email"
    label: str = ""         # display: "E-mail Pessoal"
    type: str = "text"      # text, number, date, email, select
    group: str = "Outros"
    group_id: Optional[int] = None
    entity_type: str = "contact"
    options: Optional[str] = None
    order: int = 0
    is_system: bool = False
    is_required: bool = False

@dataclass
class PropertyGroup:
    id: Optional[int] = None
    name: str = ""
    order: int = 0

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
