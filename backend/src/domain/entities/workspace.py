from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Workspace:
    id: Optional[int] = None
    name: str = ""
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#0091ae"
    accent_color: str = "#ff7a59"
    invitation_expiry_days: int = 7
    invitation_message: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_sender_email: Optional[str] = None
    smtp_sender_name: Optional[str] = None
    smtp_security: str = "STARTTLS"
    lead_api_key: Optional[str] = None
    lead_pipeline_id: Optional[int] = None
    lead_stage_id: Optional[int] = None
    lead_type_id: Optional[int] = None
    created_at: datetime = datetime.utcnow()
