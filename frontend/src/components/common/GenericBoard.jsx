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

      <style jsx>{`
        .kanban-column {
          width: 300px;
          background: #f4f7fa;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          max-height: 100%;
          border: 1px solid var(--hs-border-light);
        }

        .column-header {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 4px solid var(--hs-blue);
          background: white;
          border-radius: 8px 8px 0 0;
          border-bottom: 1px solid var(--hs-border-light);
        }

        .column-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--hs-text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .item-count {
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          color: var(--hs-text-secondary);
        }

        .column-content {
          padding: 12px;
          flex: 1;
          overflow-y: auto;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};

const GenericBoard = ({ pipeline, items, onMove, entityType }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!pipeline || !pipeline.stages) return null;

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

    if (finalStageId && activeId) {
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
          {pipeline.stages.sort((a, b) => a.order - b.order).map((stage) => (
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

      <style jsx>{`
        .board-container {
          flex: 1;
          padding: 20px;
          overflow: hidden;
          background: #fdfdfd;
        }

        .board-scroll {
          display: flex;
          gap: 20px;
          height: 100%;
          overflow-x: auto;
          padding-bottom: 20px;
          align-items: flex-start;
        }
      `}</style>
    </div>
  );
};

export default GenericBoard;
