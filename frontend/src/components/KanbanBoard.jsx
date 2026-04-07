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
import './KanbanBoard.css';

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
    </div>
  );
};

export default KanbanBoard;
