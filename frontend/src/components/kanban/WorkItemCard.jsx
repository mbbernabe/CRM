import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as LucideIcons from 'lucide-react';
import './WorkItemCard.css';

const WorkItemCard = ({ id, item, isOverlay = false, onEdit, onContextMenu }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: isOverlay });

  const style = isOverlay ? {
    cursor: 'grabbing',
  } : {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab'
  };

  const IconComponent = item.type_icon && LucideIcons[item.type_icon] 
    ? LucideIcons[item.type_icon] 
    : LucideIcons.FileText;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderCustomFields = () => {
    if (!item.custom_fields) return null;
    
    // Mostramos apenas os primeiros 3 campos para não poluir o card
    return Object.entries(item.custom_fields)
      .slice(0, 3)
      .map(([key, value]) => {
        if (!value) return null;
        let formattedValue = value;
        
        // Formatação simples (melhorar com base no FieldDefinition no futuro)
        if (typeof value === 'boolean') formattedValue = value ? 'Sim' : 'Não';
        
        return (
          <div key={key} className="custom-field-row">
            <span className="field-label">{key}:</span>
            <span className="field-value">{String(formattedValue)}</span>
          </div>
        );
      });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`work-item-card ${isDragging ? 'dragging' : ''} ${isOverlay ? 'is-overlay' : ''}`}
      onDoubleClick={() => onEdit && onEdit(item)}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(e, item);
        }
      }}
    >
      <div className="card-header">
        <div 
          className="type-badge" 
          style={{ backgroundColor: item.type_color || 'var(--hs-blue)' }}
        >
          <IconComponent size={10} />
          <span>{item.type_label}</span>
        </div>
      </div>
      
      <h4 className="card-title">{item.title}</h4>
      
      <div className="card-body">
        {renderCustomFields()}
      </div>
      
      <div className="card-footer">
        <span className="time-stamp">{formatDate(item.created_at)}</span>
        {item.owner_initials && (
          <div className="owner-avatar" title={item.owner_name}>
            {item.owner_initials}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkItemCard;
