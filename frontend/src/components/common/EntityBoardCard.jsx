import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Building2, DollarSign, Mail, Phone, Calendar } from 'lucide-react';

const EntityBoardCard = ({ id, item, entityType }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
  };

  const renderContent = () => {
    switch (entityType) {
      case 'contact':
        return (
          <>
            <div className="card-top">
              <div className="avatar small">{getInitials(item.name)}</div>
              <div className="title">{item.name}</div>
            </div>
            <div className="card-body">
              {item.email && <div className="info-line"><Mail size={12} /> {item.email}</div>}
              {item.phone && <div className="info-line"><Phone size={12} /> {item.phone}</div>}
            </div>
          </>
        );
      case 'company':
        return (
          <>
            <div className="card-top">
              <div className="avatar small company"><Building2 size={12} /></div>
              <div className="title">{item.name}</div>
            </div>
            <div className="card-body">
               {item.domain && <div className="info-line">{item.domain}</div>}
               <div className="info-line"><Users size={12} /> {item.contacts?.length || 0} contatos</div>
            </div>
          </>
        );
      case 'deal':
        // Negócios (Deals) podem ser um tipo específico com valor
        return (
          <>
            <div className="card-top">
              <div className="title">{item.title || item.name}</div>
            </div>
            <div className="card-body">
              <div className="info-line"><Handshake size={12} /> {item.company}</div>
              <div className="price-tag">
                 {item.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div className="card-footer">
               <div className="avatar x-small">{getInitials(item.contact)}</div>
               <span>{item.contact}</span>
            </div>
          </>
        );
      default:
        return <div className="title">{item.name}</div>;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`entity-board-card ${isDragging ? 'dragging' : ''}`}
    >
      {renderContent()}

      <style jsx>{`
        .entity-board-card {
          padding: 12px;
          background: white;
          border: 1px solid var(--hs-border);
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: box-shadow 0.2s, border-color 0.2s;
          user-select: none;
        }

        .entity-board-card:hover {
          border-color: var(--hs-blue);
          box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        }

        .card-top { display: flex; align-items: center; gap: 10px; }
        .avatar.small { width: 24px; height: 24px; font-size: 10px; background: var(--hs-blue); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .avatar.small.company { background: #f1f5f9; color: var(--hs-text-secondary); }
        .avatar.x-small { width: 18px; height: 18px; font-size: 8px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        
        .title { font-size: 14px; font-weight: 600; color: var(--hs-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .card-body { display: flex; flex-direction: column; gap: 4px; }
        .info-line { font-size: 11px; color: var(--hs-text-secondary); display: flex; align-items: center; gap: 6px; }
        
        .price-tag { font-size: 13px; font-weight: 700; color: var(--hs-text-primary); margin-top: 4px; }
        
        .card-footer { display: flex; align-items: center; gap: 6px; padding-top: 8px; border-top: 1px solid var(--hs-border-light); font-size: 11px; color: var(--hs-text-secondary); }

        .dragging { z-index: 1000; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: var(--hs-blue); }
      `}</style>
    </div>
  );
};

export default EntityBoardCard;
