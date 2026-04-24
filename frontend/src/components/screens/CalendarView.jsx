import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, CheckCircle2 } from 'lucide-react';
import './CalendarView.css';

const CalendarView = ({ tasks, onTaskClick, onAddTask, onTaskUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [popover, setPopover] = useState({ visible: false, x: 0, y: 0, date: null });
  const [quickTitle, setQuickTitle] = useState('');
  const [resizeState, setResizeState] = useState(null);
  const [previewTask, setPreviewTask] = useState(null); // { id, start, end, originalFields }

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDay = firstDayOfMonth.getDay(); // 0 = Sunday
    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, prevMonthLastDay - i, 12), // Set to noon to avoid DST issues
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(year, month, i, 12),
        isCurrentMonth: true
      });
    }
    
    // Next month padding
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i, 12),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDay = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return (tasks || []).filter(task => {
      // Se for a tarefa em preview, usamos as datas do preview para filtragem
      if (previewTask && task.id === previewTask.id) {
        return dateStr >= previewTask.start && dateStr <= previewTask.end;
      }

      // Verifica campos individuais de data
      const dueDate = task.custom_fields?.due_date || task.custom_fields?.['Prazo Final'];
      const startDate = task.custom_fields?.start_date || task.custom_fields?.['Data de Inicio'];
      
      // Verifica se há campos de date_range (formato "YYYY-MM-DD;YYYY-MM-DD")
      const dateRangeFields = Object.values(task.custom_fields || {}).filter(val => typeof val === 'string' && val.includes(';'));
      const isDayOfRange = dateRangeFields.some(range => {
        const [start, end] = range.split(';');
        if (start && end) {
          return dateStr >= start && dateStr <= end;
        }
        return start === dateStr || end === dateStr;
      });

      return dueDate === dateStr || startDate === dateStr || isDayOfRange;
    }).map(task => {
      let start, end;
      
      if (previewTask && task.id === previewTask.id) {
        start = previewTask.start;
        end = previewTask.end;
      } else {
        const prazo = task.custom_fields?.prazo || "";
        [start, end] = prazo.includes(';') ? prazo.split(';') : [task.custom_fields?.start_date, task.custom_fields?.due_date];
      }
      
      return {
        ...task,
        isStart: start === dateStr,
        isEnd: end === dateStr,
        isMiddle: dateStr > start && dateStr < end
      };
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const handleContextMenu = (e, date) => {
    e.preventDefault();
    setPopover({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      date: date
    });
    setQuickTitle('');
  };

  const handleQuickAddSubmit = (e) => {
    if (e.key === 'Enter' && quickTitle.trim() && popover.date) {
      onAddTask(quickTitle.trim(), popover.date);
      setPopover({ ...popover, visible: false });
      setQuickTitle('');
    } else if (e.key === 'Escape') {
      setPopover({ ...popover, visible: false });
    }
  };

  const handleResizeStart = (e, task, edge) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (task.is_temp) {
      // O addToast é injetado pelo MyTasksCenter, mas aqui no CalendarView 
      // podemos apenas bloquear ou talvez emitir um alerta. 
      // Por consistência, vamos apenas retornar, já que o clique já mostra o toast.
      return;
    }

    const prazo = task.custom_fields?.prazo || ";";
    const [start, end] = prazo.split(';');

    setResizeState({
      taskId: task.id,
      edge,
      originalCustomFields: { ...task.custom_fields }
    });

    setPreviewTask({
      id: task.id,
      start: start || task.custom_fields?.start_date,
      end: end || task.custom_fields?.due_date,
      originalFields: { ...task.custom_fields }
    });
  };

  const handleMouseEnterDay = (date) => {
    if (!resizeState || !previewTask) return;

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let { start, end } = previewTask;
    
    if (resizeState.edge === 'start') {
      start = dateStr;
    } else {
      end = dateStr;
    }

    // Validação básica
    if (start && end && start > end) {
      if (resizeState.edge === 'start') end = start;
      else start = end;
    }

    setPreviewTask(prev => ({ ...prev, start, end }));
  };

  const handleMouseUp = () => {
    if (resizeState && previewTask) {
      const { id, start, end, originalFields } = previewTask;
      
      onTaskUpdate(id, { 
        ...originalFields, 
        prazo: `${start};${end}`,
        start_date: start,
        due_date: end
      });

      setResizeState(null);
      setPreviewTask(null);
    }
  };

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div 
      className={`calendar-container ${resizeState ? 'is-dragging' : ''}`} 
      onClick={() => popover.visible && setPopover({ ...popover, visible: false })}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="calendar-header">
        <div className="calendar-current-month">
          {monthName}
        </div>
        <div className="calendar-nav">
          <button className="calendar-btn" onClick={goToToday}>Hoje</button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="calendar-btn" onClick={prevMonth} title="Mês Anterior">
              <ChevronLeft size={18} />
            </button>
            <button className="calendar-btn" onClick={nextMonth} title="Próximo Mês">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        {weekdays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        
        {daysInMonth.map((day, idx) => {
          const dayTasks = getTasksForDay(day.date);
          return (
            <div 
              key={idx} 
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, day.date)}
              onMouseEnter={() => handleMouseEnterDay(day.date)}
            >
              <div className="day-header">
                <span className="day-number">{day.date.getDate()}</span>
              </div>
              <div className="calendar-task-list">
                {dayTasks.map(task => (
                  <div 
                    key={`${task.id}-${idx}`} 
                    className={`calendar-task-item 
                      ${task.custom_fields?.is_important ? 'important' : ''} 
                      ${task.custom_fields?.is_completed ? 'completed' : ''}
                      ${task.is_temp ? 'is-temp' : ''}
                      ${task.isStart ? 'span-start' : ''}
                      ${task.isEnd ? 'span-end' : ''}
                      ${task.isMiddle ? 'span-middle' : ''}
                      ${resizeState?.taskId === task.id ? 'is-resizing' : ''}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task.is_temp) return;
                      onTaskClick(task);
                    }}
                    title={task.is_temp ? 'Criando tarefa...' : task.title}
                  >
                    {task.isStart && !task.is_temp && (
                      <div 
                        className="resize-handle handle-left" 
                        onMouseDown={(e) => handleResizeStart(e, task, 'start')}
                      />
                    )}
                    <span className="task-item-title">
                      {(task.isStart || !task.prazo || day.date.getDay() === 0) ? task.title : ''}
                    </span>
                    {task.isEnd && !task.is_temp && (
                      <div 
                        className="resize-handle handle-right" 
                        onMouseDown={(e) => handleResizeStart(e, task, 'end')}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>



      {popover.visible && (
        <div 
          className="calendar-quick-add-popover"
          style={{ 
            position: 'fixed', 
            top: popover.y, 
            left: popover.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input 
            autoFocus
            type="text"
            className="calendar-quick-add-input"
            placeholder="Nova tarefa..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={handleQuickAddSubmit}
          />
          <div className="popover-hint">Pressione Enter para salvar</div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
