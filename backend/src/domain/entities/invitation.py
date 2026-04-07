from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class WorkspaceInvitation:
    email: str
    token: str
    workspace_id: int
    expires_at: datetime
    id: Optional[int] = None
    role: str = "user"
    team_id: Optional[int] = None
    invited_by: Optional[int] = None
    accepted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    # Resolved display fields
    workspace_name: Optional[str] = None
    inviter_name: Optional[str] = None
    team_name: Optional[str] = None

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    @property
    def is_accepted(self) -> bool:
        return self.accepted_at is not None

    @property
    def is_pending(self) -> bool:
        return not self.is_accepted and not self.is_expired
