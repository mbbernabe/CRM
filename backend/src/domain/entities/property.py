from dataclasses import dataclass, field
from typing import Optional

@dataclass
class PropertyDefinition:
    id: Optional[int] = None
    name: str = ""          # slug: "personal_email"
    label: str = ""         # display: "E-mail Pessoal"
    type: str = "text"      # text, number, date, email, select
    group: str = "Outros"   # Endereço, Documentos, etc.
    options: Optional[str] = None # Opção 1;Opção 2;Opção 3
    is_system: bool = False
    is_required: bool = False

@dataclass
class ContactPropertyValue:
    contact_id: int
    property_id: int
    value: str
    property_def: Optional[PropertyDefinition] = None
