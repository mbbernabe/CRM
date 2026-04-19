from typing import List, Optional, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from src.domain.entities.work_item_link import WorkItemLink, IWorkItemLinkRepository
from src.infrastructure.database.models import WorkItemLinkModel, WorkItemModel, WorkItemTypeModel

class SQLAlchemyWorkItemLinkRepository(IWorkItemLinkRepository):
    def __init__(self, session: Session):
        self.session = session

    def add_link(self, source_id: int, target_id: int, workspace_id: int) -> bool:
        # Check if already exists (bidirectional)
        exists = self.session.query(WorkItemLinkModel).filter(
            and_(
                WorkItemLinkModel.workspace_id == workspace_id,
                or_(
                    and_(WorkItemLinkModel.source_item_id == source_id, WorkItemLinkModel.target_item_id == target_id),
                    and_(WorkItemLinkModel.source_item_id == target_id, WorkItemLinkModel.target_item_id == source_id)
                )
            )
        ).first()

        if exists:
            return True

        # Ensure we always store source_id < target_id to avoid duplicate logic (canonical form)
        s_id, t_id = (source_id, target_id) if source_id < target_id else (target_id, source_id)

        new_link = WorkItemLinkModel(
            workspace_id=workspace_id,
            source_item_id=s_id,
            target_item_id=t_id
        )
        self.session.add(new_link)
        self.session.commit()
        return True

    def remove_link(self, source_id: int, target_id: int, workspace_id: int) -> bool:
        s_id, t_id = (source_id, target_id) if source_id < target_id else (target_id, source_id)
        
        link = self.session.query(WorkItemLinkModel).filter(
            and_(
                WorkItemLinkModel.workspace_id == workspace_id,
                WorkItemLinkModel.source_item_id == s_id,
                WorkItemLinkModel.target_item_id == t_id
            )
        ).first()

        if link:
            self.session.delete(link)
            self.session.commit()
            return True
        return False

    def list_links(self, work_item_id: int, workspace_id: int) -> List[WorkItemLink]:
        links = self.session.query(WorkItemLinkModel).filter(
            and_(
                WorkItemLinkModel.workspace_id == workspace_id,
                or_(
                    WorkItemLinkModel.source_item_id == work_item_id,
                    WorkItemLinkModel.target_item_id == work_item_id
                )
            )
        ).all()

        return [
            WorkItemLink(
                id=l.id,
                workspace_id=l.workspace_id,
                source_item_id=l.source_item_id,
                target_item_id=l.target_item_id,
                created_at=l.created_at
            ) for l in links
        ]

    def get_linked_items(self, work_item_id: int, workspace_id: int, team_id: Optional[int] = None) -> List[dict]:
        # Get all links where work_item_id is source or target
        links = self.session.query(WorkItemLinkModel).filter(
            and_(
                WorkItemLinkModel.workspace_id == workspace_id,
                or_(
                    WorkItemLinkModel.source_item_id == work_item_id,
                    WorkItemLinkModel.target_item_id == work_item_id
                )
            )
        ).all()

        linked_ids = []
        for l in links:
            if l.source_item_id == work_item_id:
                linked_ids.append(l.target_item_id)
            else:
                linked_ids.append(l.source_item_id)

        if not linked_ids:
            return []

        # Fetch detailed info with eager loading for performance
        query = self.session.query(WorkItemModel).options(
            joinedload(WorkItemModel.work_item_type)
        ).filter(
            and_(
                WorkItemModel.workspace_id == workspace_id,
                WorkItemModel.id.in_(linked_ids)
            )
        )
        
        if team_id is not None:
            query = query.filter(WorkItemModel.team_id == team_id)
            
        items = query.all()

        return [
            {
                "id": item.id,
                "title": item.title,
                "type_id": item.type_id,
                "type_name": item.work_item_type.name,
                "type_label": item.work_item_type.label,
                "type_icon": item.work_item_type.icon,
                "type_color": item.work_item_type.color
            } for item in items
        ]
