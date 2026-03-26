import React from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import DealCard from './DealCard';

const Column = ({ id, title, deals }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="kanban-column">
      <div className="column-header">
        <h3 className="column-title">{title}</h3>
        <span className="deal-count">{deals.length}</span>
      </div>
      
      <div ref={setNodeRef} className="column-content">
        <SortableContext 
          id={id}
          items={deals.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} id={deal.id} deal={deal} />
          ))}
        </SortableContext>
      </div>

      <style jsx>{`
        .kanban-column {
          width: 280px;
          background: #ebf0f5;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          max-height: 100%;
        }

        .column-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 3px solid var(--hs-blue);
          border-radius: 6px 6px 0 0;
        }

        .column-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--hs-text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .deal-count {
          background: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--hs-text-secondary);
        }

        .column-content {
          padding: 8px;
          flex: 1;
          overflow-y: auto;
          min-height: 150px;
        }
      `}</style>
    </div>
  );
};

const KanbanBoard = ({ pipeline, deals, onDragEnd }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="kanban-container">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div className="kanban-scroll">
          {pipeline.columns.map((column) => (
            <Column 
              key={column.id} 
              id={column.id} 
              title={column.name} 
              deals={deals.filter(d => d.status === column.id)}
            />
          ))}
        </div>
      </DndContext>

      <style jsx>{`
        .kanban-container {
          flex: 1;
          padding: 24px;
          overflow: hidden;
          background: var(--hs-bg-main);
        }

        .kanban-scroll {
          display: flex;
          gap: 16px;
          height: 100%;
          overflow-x: auto;
          padding-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
