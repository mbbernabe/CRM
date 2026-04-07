import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Building2, DollarSign, Mail, Phone, Calendar, Users, Handshake } from 'lucide-react';
import './EntityBoardCard.css';

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
    </div>
  );
};

export default EntityBoardCard;
