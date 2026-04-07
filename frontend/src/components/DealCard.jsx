import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, DollarSign } from 'lucide-react';
import './DealCard.css';

const DealCard = ({ id, deal }) => {
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

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`hs-card deal-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="deal-title">{deal.title}</div>
      
      <div className="deal-details">
        <div className="deal-company">{deal.company}</div>
        <div className="deal-value">
          <DollarSign size={12} />
          {deal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      </div>

      <div className="deal-footer">
        <div className="contact-avatar">
          {deal.contact.split(' ').map(n => n[0]).join('')}
        </div>
        <span className="contact-name">{deal.contact}</span>
      </div>
    </div>
  );
};

export default DealCard;
