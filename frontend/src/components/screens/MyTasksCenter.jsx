import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Star, 
  Calendar, 
  User, 
  CheckCircle2, 
  Circle,
  Plus,
  AlertCircle,
  Clock,
  Layout
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import WorkItemModal from '../kanban/WorkItemModal';
import './MyTasksCenter.css';

const MyTasksCenter = () => {
  const { fetchWithAuth, workspace, user } = useAuth();
  const { addToast } = useToast();
  const [activeList, setActiveList] = useState('atribuido');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskPipeline, setTaskPipeline] = useState(null);
  const [tasks, setTasks] = useState({
    meu_dia: [],
    importante: [],
    planejado: [],
    atribuido: [],
    concluidas: [],
    todas: []
  });
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');

  const listConfig = {
    meu_dia: { label: 'Meu Dia', icon: <Sun size={20} />, color: '#ffaa47' },
    importante: { label: 'Importante', icon: <Star size={20} />, color: '#ff7a59' },
    planejado: { label: 'Planejado', icon: <Calendar size={20} />, color: '#0091ae' },
    atribuido: { label: 'Atribuído a mim', icon: <User size={20} />, color: '#516f90' },
    concluidas: { label: 'Concluídas', icon: <CheckCircle2 size={20} />, color: '#00a65a' },
    todas: { label: 'Todas as Tarefas', icon: <Layout size={20} />, color: '#7c98b6' }
  };

  const fetchTasks = async () => {
    if (!workspace?.id || !user?.id) return;
    
    try {
      setLoading(true);
      const res = await fetchWithAuth('/workitems/my-tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else if (res.status >= 500) {
        addToast('Erro interno ao carregar tarefas', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [workspace]);

  const handleQuickAdd = async (e) => {
    if (e.key === 'Enter' && quickTitle.trim()) {
      const title = quickTitle.trim();
      setQuickTitle('');
      
      const tempId = Date.now();
      
      // Prepara custom fields com base na lista ativa para o update otimista
      const customFields = {};
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      if (activeList === 'meu_dia') {
        customFields.start_date = localDate;
        customFields.due_date = localDate;
      }
      if (activeList === 'importante') {
        customFields.is_important = true;
      }
      if (activeList === 'planejado') {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        customFields.start_date = tomorrowDate;
      }

      const newTask = {
        id: tempId,
        title: title,
        owner_id: user.id,
        custom_fields: customFields,
        is_temp: true,
        workspace_name: workspace?.name || 'Geral'
      };
      
      // Update Otimista: Adiciona na lista atual e nas listas globais
      setTasks(prev => {
        const update = {
          ...prev,
          atribuido: [newTask, ...prev.atribuido],
          todas: [newTask, ...prev.todas]
        };
        // Se estiver em uma lista específica que não seja as globais, adiciona nela também
        if (!['atribuido', 'todas', 'concluidas'].includes(activeList)) {
          update[activeList] = [newTask, ...(prev[activeList] || [])];
        }
        return update;
      });

      try {
        const typesRes = await fetchWithAuth('/workitems/types');
        if (!typesRes.ok) throw new Error('Falha ao carregar tipos');
        const types = await typesRes.json();
        
        const taskType = types.find(t => t.name === 'task_template' || t.label.toLowerCase().includes('tarefa'));
        
        const pipelinesRes = await fetchWithAuth('/pipelines/');
        if (!pipelinesRes.ok) throw new Error('Falha ao carregar pipelines');
        const pipelines = await pipelinesRes.json();
        
        const taskPipeline = pipelines.find(p => p.name === 'Fluxo de Tarefas' || (p.stages && p.stages.length > 0));
        
        if (!taskType || !taskPipeline || !taskPipeline.stages || taskPipeline.stages.length === 0) {
          throw new Error('Configuração de Tarefas incompleta no workspace');
        }

        const res = await fetchWithAuth('/workitems', {
          method: 'POST',
          body: JSON.stringify({
            title,
            type_id: taskType.id,
            pipeline_id: taskPipeline.id,
            stage_id: taskPipeline.stages[0].id,
            owner_id: user.id,
            custom_fields: customFields
          })
        });

        if (!res.ok) throw new Error('Falha ao criar tarefa no servidor');
        const resData = await res.json();
        const realTask = resData.data || resData;

        // Ao receber a tarefa real, atualizamos o estado e garantimos que ela tenha o pipeline_id correto
        setTasks(prev => {
          const update = (list) => (list || []).map(t => t.id === tempId ? { ...realTask, pipeline_id: taskPipeline.id, workspace_name: workspace?.name } : t);
          return {
            meu_dia: update(prev.meu_dia),
            importante: update(prev.importante),
            planejado: update(prev.planejado),
            atribuido: update(prev.atribuido),
            concluidas: update(prev.concluidas),
            todas: update(prev.todas)
          };
        });
      } catch (error) {
        console.error('Erro no Quick Add:', error);
        addToast('Erro ao criar tarefa: ' + error.message, 'error');
        setTasks(prev => {
          const filterOut = (list) => (list || []).filter(t => t.id !== tempId);
          return {
            meu_dia: filterOut(prev.meu_dia),
            importante: filterOut(prev.importante),
            planejado: filterOut(prev.planejado),
            atribuido: filterOut(prev.atribuido),
            concluidas: filterOut(prev.concluidas),
            todas: filterOut(prev.todas)
          };
        });
      }
    }
  };

  const handleTaskClick = async (task) => {
    if (task.is_temp) {
      addToast('Aguarde a criação da tarefa terminar...', 'info');
      return;
    }
    try {
      // Para abrir o modal, precisamos do objeto pipeline da tarefa
      const res = await fetchWithAuth(`/pipelines/${task.pipeline_id}`);
      if (res.ok) {
        const pipelineData = await res.json();
        setTaskPipeline(pipelineData);
        setSelectedTask(task);
        setIsModalOpen(true);
      } else {
        addToast('Erro ao carregar detalhes da tarefa', 'error');
      }
    } catch (error) {
      addToast('Erro ao carregar detalhes da tarefa', 'error');
    }
  };

  const toggleImportant = async (e, task) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar na estrela
    const isImportant = !(task.custom_fields?.is_important);
    const previousTasks = { ...tasks };

    // Optimistic Update
    const updateList = (list) => list.map(t => 
      t.id === task.id ? { ...t, custom_fields: { ...t.custom_fields, is_important: isImportant } } : t
    );
    
    setTasks(prev => ({
      meu_dia: updateList(prev.meu_dia),
      importante: isImportant 
        ? [...(prev.importante || []), { ...task, custom_fields: { ...task.custom_fields, is_important: isImportant } }]
        : (prev.importante || []).filter(t => t.id !== task.id),
      planejado: updateList(prev.planejado),
      atribuido: updateList(prev.atribuido),
      concluidas: updateList(prev.concluidas),
      todas: updateList(prev.todas)
    }));

    try {
      await fetchWithAuth(`/workitems/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          custom_fields: { ...task.custom_fields, is_important: isImportant }
        })
      });
    } catch (error) {
      setTasks(previousTasks);
      addToast('Erro ao atualizar tarefa', 'error');
    }
  };

  const handleToggleComplete = async (e, task) => {
    e.stopPropagation();
    const isCompleted = !(task.custom_fields?.is_completed);
    
    // Optimistic Update: Remove from current list if not "Todas"
    setTasks(prev => {
      const updatedTask = { ...task, custom_fields: { ...task.custom_fields, is_completed: isCompleted } };
      const filterOut = (list) => (list || []).filter(t => t.id !== task.id);
      const updateIn = (list) => (list || []).map(t => t.id === task.id ? updatedTask : t);
      
      return {
        meu_dia: filterOut(prev.meu_dia),
        importante: filterOut(prev.importante),
        planejado: filterOut(prev.planejado),
        atribuido: filterOut(prev.atribuido),
        concluidas: isCompleted ? [updatedTask, ...(prev.concluidas || [])] : filterOut(prev.concluidas),
        todas: updateIn(prev.todas)
      };
    });

    try {
      await fetchWithAuth(`/workitems/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          custom_fields: { ...task.custom_fields, is_completed: isCompleted }
        })
      });
    } catch (error) {
      addToast('Erro ao atualizar tarefa', 'error');
      fetchTasks();
    }
  };

  const getPriorityClass = (priority) => {
    if (!priority) return '';
    return `priority-${priority.toLowerCase()}`;
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const isOverdue = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    return d < today;
  };

  const currentTasks = tasks[activeList] || [];

  return (
    <div className="my-tasks-container">
      <div className="tasks-sidebar">
        {Object.entries(listConfig).map(([id, config]) => (
          <div 
            key={id} 
            className={`task-list-item ${activeList === id ? 'active' : ''}`}
            onClick={() => setActiveList(id)}
          >
            <span style={{ color: activeList === id ? config.color : 'inherit' }}>
              {config.icon}
            </span>
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      <div className="tasks-content">
        <div className="tasks-content-header">
          <div className="tasks-header">
            <h2 style={{ color: listConfig[activeList].color }}>
              {listConfig[activeList].label}
            </h2>
            <p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>

          <div className="quick-add-container">
            <input 
              type="text" 
              className="quick-add-input" 
              placeholder="Adicionar uma tarefa..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={handleQuickAdd}
            />
          </div>
        </div>

        <div className="task-list-rows">
          {currentTasks.length === 0 && !loading && (
            <div className="empty-tasks">
              <CheckCircle2 size={48} />
              <h3>Tudo limpo por aqui!</h3>
              <p>Você não tem tarefas nesta lista.</p>
            </div>
          )}

          {currentTasks.map(task => {
            const priority = task.custom_fields?.priority;
            const dueDate = task.custom_fields?.due_date;
            const isImp = task.custom_fields?.is_important;

            const isCompleted = task.custom_fields?.is_completed;

            return (
              <div 
                key={task.id} 
                className={`task-row ${isCompleted ? 'completed' : ''}`}
                onClick={() => handleTaskClick(task)}
                title="Clique para editar detalhes"
              >
                <div className={`priority-indicator ${getPriorityClass(priority)}`}></div>
                <div 
                  className={`task-check ${isCompleted ? 'completed' : ''}`} 
                  onClick={(e) => handleToggleComplete(e, task)}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </div>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <div className="task-meta-item">
                      <Layout size={12} /> <span>{task.workspace_name || 'Geral'}</span>
                    </div>
                    {dueDate && (
                      <div className={`task-meta-item ${isOverdue(dueDate) ? 'overdue' : ''}`}>
                        <Calendar size={12} /> <span>{formatDate(dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  className={`task-important ${isImp ? 'active' : ''}`}
                  onClick={(e) => toggleImportant(e, task)}
                >
                  <Star size={18} fill={isImp ? 'currentColor' : 'none'} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <WorkItemModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pipeline={taskPipeline}
          initialData={selectedTask}
          onSave={fetchTasks}
          addToast={addToast}
        />
      )}
    </div>
  );
};

export default MyTasksCenter;
