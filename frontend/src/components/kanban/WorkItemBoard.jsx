import React from 'react';
import { 
  DndContext, 
  closestCorners,
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
import { useDroppable, DragOverlay } from '@dnd-kit/core';
import WorkItemCard from './WorkItemCard';
import './WorkItemBoard.css';

const Column = ({ id, title, color, items, onEdit, onContextMenu }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="kanban-column" key={id}>
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
            <WorkItemCard 
              key={item.id} 
              id={item.id} 
              item={item} 
              onEdit={onEdit}
              onContextMenu={onContextMenu}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

const WorkItemBoard = ({ pipeline, onMove, onEdit, onContextMenu }) => {
  const [activeId, setActiveId] = React.useState(null);

  const activeItem = React.useMemo(() => {
    if (!activeId || !pipeline) return null;
    for (const stage of pipeline.stages) {
      const item = stage.items.find(i => i.id === activeId);
      if (item) return item;
    }
    return null;
  }, [activeId, pipeline]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!pipeline || !pipeline.stages) {
    return (
      <div className="board-empty-state">
        <p>Configuração de pipeline não disponível.</p>
      </div>
    );
  }
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Se o destino for uma coluna (ID da coluna)
    const targetStage = pipeline.stages.find(s => String(s.id) === String(overId));
    
    // Se o destino for um card, pegamos o stage_id desse card
    let finalStageId = targetStage?.id;
    
    if (!finalStageId) {
        for (const stage of pipeline.stages) {
            if (stage.items.some(i => String(i.id) === String(overId))) {
                finalStageId = stage.id;
                break;
            }
        }
    }

    if (finalStageId && activeId && onMove) {
      // Evita chamar a API se o estágio for o mesmo
      if (activeItem && activeItem.stage_id !== finalStageId) {
        onMove(activeId, finalStageId);
      }
    }
    
    setActiveId(null);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  return (
    <div className="work-item-board">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {pipeline.stages.map((stage) => (
          <Column 
            key={stage.id} 
            id={stage.id} 
            title={stage.name} 
            color={stage.color}
            items={stage.items || []}
            onEdit={onEdit}
            onContextMenu={onContextMenu}
          />
        ))}
        
        <DragOverlay adjustScale={true}>
          {activeItem ? (
            <WorkItemCard id={activeId} item={activeItem} isOverlay={true} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default WorkItemBoard;
