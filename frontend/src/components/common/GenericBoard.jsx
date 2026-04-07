import React from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import EntityBoardCard from './EntityBoardCard';
import './GenericBoard.css';

const Column = ({ id, title, color, items, entityType }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="kanban-column">
      <div className="column-header" style={{ borderTopColor: color || 'var(--hs-blue)' }}>
        <h3 className="column-title">{title}</h3>
        <span className="item-count">{items.length}</span>
      </div>
      
      <div ref={setNodeRef} className="column-content">
        <SortableContext 
          id={id}
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <EntityBoardCard key={item.id} id={item.id} item={item} entityType={entityType} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const GenericBoard = ({ pipeline, items = [], onMove, entityType }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!pipeline || !pipeline.stages || !Array.isArray(items)) {
    return (
      <div className="board-empty-state">
        <p>Configuração de pipeline não disponível para esta visualização.</p>
      </div>
    );
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Se o destino for uma coluna (ID da coluna)
    const targetStageId = pipeline.stages.find(s => s.id === overId)?.id;
    
    // Se o destino for um card, pegamos o stage_id desse card
    const targetItem = items.find(i => i.id === overId);
    const finalStageId = targetStageId || targetItem?.stage_id;

    if (finalStageId && activeId && onMove) {
      onMove(activeId, finalStageId);
    }
  };

  return (
    <div className="board-container">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="board-scroll">
          {[...pipeline.stages].sort((a, b) => (a.order || 0) - (b.order || 0)).map((stage) => (
            <Column 
              key={stage.id} 
              id={stage.id} 
              title={stage.name} 
              color={stage.color}
              items={items.filter(item => item.stage_id === stage.id)}
              entityType={entityType}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default GenericBoard;
