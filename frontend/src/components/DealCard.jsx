import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, DollarSign } from 'lucide-react';

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

      <style jsx>{`
        .deal-card {
          margin-bottom: 8px;
          user-select: none;
        }
        
        .deal-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--hs-text-primary);
          margin-bottom: 4px;
        }

        .deal-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 12px;
        }

        .deal-company {
          font-size: 12px;
          color: var(--hs-text-secondary);
        }

        .deal-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--hs-text-primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .deal-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--hs-border-light);
        }

        .contact-avatar {
          width: 20px;
          height: 20px;
          background: #e5e7eb;
          color: #4b5563;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .contact-name {
          font-size: 11px;
          color: var(--hs-text-secondary);
        }

        .dragging {
          z-index: 1000;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default DealCard;
