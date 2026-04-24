import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, CheckCircle2 } from 'lucide-react';
import './CalendarView.css';

const CalendarView = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month padding
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
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
      // Verifica campos individuais de data
      const dueDate = task.custom_fields?.due_date || task.custom_fields?.['Prazo Final'];
      const startDate = task.custom_fields?.start_date || task.custom_fields?.['Data de Inicio'];
      
      // Verifica se há campos de date_range (formato "YYYY-MM-DD;YYYY-MM-DD")
      const dateRangeFields = Object.values(task.custom_fields || {}).filter(val => typeof val === 'string' && val.includes(';'));
      const isDayOfRange = dateRangeFields.some(range => {
        const [start, end] = range.split(';');
        return start === dateStr || end === dateStr;
      });

      return dueDate === dateStr || startDate === dateStr || isDayOfRange;
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="calendar-container">
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
            >
              <div className="day-header">
                <span className="day-number">{day.date.getDate()}</span>
              </div>
              <div className="calendar-task-list">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`calendar-task-item ${task.custom_fields?.is_important ? 'important' : ''} ${task.custom_fields?.is_completed ? 'completed' : ''}`}
                    onClick={() => onTaskClick(task)}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
