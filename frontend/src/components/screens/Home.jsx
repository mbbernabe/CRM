import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  User,
  Briefcase,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  Layout,
  RefreshCw,
  Building2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  X,
  Settings
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import './Home.css';

const DEFAULT_LAYOUT = [
  { id: 'quick_actions', visible: true, label: 'Ações Rápidas' },
  { id: 'workspaces', visible: true, label: 'Minhas Áreas de Trabalho' },
  { id: 'summary', visible: true, label: 'Resumo' },
  { id: 'recent_activity', visible: true, label: 'Atividade Recente' }
];

const SortableSection = ({ id, children, visible, isEditing, onToggleVisibility }) => {
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
    opacity: isDragging ? 0.5 : (visible ? 1 : (isEditing ? 0.4 : 0)),
    display: !visible && !isEditing ? 'none' : 'block',
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style} className={`home-section-wrapper ${isEditing ? 'is-editing' : ''} ${!visible ? 'is-hidden' : ''}`}>
      {isEditing && (
        <div className="section-edit-controls">
          <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={20} />
          </div>
          <button 
            type="button" 
            className={`visibility-toggle ${!visible ? 'off' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(id); }}
            title={visible ? "Ocultar seção" : "Mostrar seção"}
          >
            {visible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      )}
      {children}
    </div>
  );
};

const Home = ({ onOpenItem }) => {
  const { user, workspace, fetchWithAuth, activeMembershipId, switchMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const { addToast } = useToast();
  const { updateUserData } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth('/home/summary');
        if (res.ok) {
          const result = await res.json();
          setData(result);
          
          if (result.preferences?.home_layout) {
            const savedLayout = result.preferences.home_layout;
            
            // 1. Filtrar itens salvos que ainda são válidos (existem no DEFAULT_LAYOUT)
            const validSaved = savedLayout.filter(s => 
              DEFAULT_LAYOUT.some(d => d.id === s.id)
            );
            
            // 2. Identificar itens do DEFAULT_LAYOUT que não estão no salvo (novas seções)
            const missingItems = DEFAULT_LAYOUT.filter(d => 
              !validSaved.some(s => s.id === d.id)
            );
            
            // 3. Combinar: Mantém a ordem do salvo e adiciona novidades ao final
            setLayout([...validSaved, ...missingItems]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar home:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [workspace?.id]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleVisibility = (id) => {
    setLayout(items => items.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    ));
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const res = await fetchWithAuth('/home/preferences', {
        method: 'POST',
        body: JSON.stringify({ home_layout: layout })
      });
      if (res.ok) {
        const result = await res.json();
        setIsEditing(false);
        addToast('Layout da Home salvo com sucesso!');
        
        // Atualizar o objeto usuário no contexto global (AuthContext)
        if (user && result.preferences) {
            updateUserData({ ...user, preferences: result.preferences });
        }
      } else {
        addToast('Erro ao salvar preferências', 'error');
      }
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
      addToast('Erro de conexão ao salvar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getIcon = (iconName) => {
    const icons = {
      'user': <User size={24} />,
      'briefcase': <Briefcase size={24} />,
      'users': <Users size={24} />,
      'message-square': <MessageSquare size={24} />,
      'file-text': <FileText size={24} />,
      'calendar': <Calendar size={24} />,
      'plus-circle': <PlusCircle size={24} />,
      'layout': <Layout size={24} />,
    };
    return icons[iconName] || <PlusCircle size={24} />;
  };

  if (loading && !data) {
    return (
      <div className="loading-home">
        <RefreshCw className="spinner" size={32} />
        <p>Carregando sua visão geral...</p>
      </div>
    );
  }

  const actions = data?.actions || [];
  const recentItems = data?.recent_items || [];
  const stats = data?.task_stats || {};
  
  const firstName = (user?.name?.split(' ') || [''])[0];

  const renderSectionContent = (id) => {
    switch (id) {
      case 'quick_actions':
        return (
          <section className="home-section">
            <h3 className="home-section-title">
              <Zap size={20} className="text-orange" />
              Ações Rápidas
            </h3>
            <div className="quick-actions-grid">
              {actions.map(action => (
                <div 
                  key={action.id} 
                  className="action-card"
                  style={{ '--card-color': action.color || 'var(--hs-blue)' }}
                  onClick={() => !isEditing && onOpenItem?.(`new_${action.name}`)}
                >
                  <div className="action-icon-wrapper">
                    {getIcon(action.icon)}
                  </div>
                  <span>Novo {action.label}</span>
                </div>
              ))}
              {/* Botão de Personalizar removido daqui para o cabeçalho */}
            </div>
          </section>
        );
      case 'workspaces':
        return (
          <section className="home-section">
            <div className="home-section-title">
              <Building2 size={20} className="text-blue" />
              Minhas Áreas de Trabalho
            </div>
            <div className="workspaces-row">
              {user?.memberships?.map(m => (
                <div 
                  key={m.id} 
                  className={`ws-home-card ${m.id.toString() === activeMembershipId?.toString() ? 'active' : ''}`}
                  onClick={() => !isEditing && switchMembership(m.id)}
                >
                  <div 
                    className="ws-card-logo" 
                    style={{ backgroundColor: m.primary_color || 'var(--hs-blue)' }}
                  >
                    {m.workspace_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ws-card-info">
                    <span className="ws-card-name">{m.workspace_name}</span>
                    <span className="ws-card-team">
                      {m.team_name || 'Geral'}
                      {m.id.toString() === activeMembershipId?.toString() && <span className="active-badge">Atual</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'summary':
        return (
          <div className="summary-row">
            <div className="summary-card">
              <div className="summary-icon overdue">
                <AlertCircle size={24} />
              </div>
              <div className="summary-info">
                <h4>Tarefas Vencidas</h4>
                <div className="summary-value">{stats.overdue || 0}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon today">
                <Clock size={24} />
              </div>
              <div className="summary-info">
                <h4>Para Hoje</h4>
                <div className="summary-value">{stats.today || 0}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon pending">
                <CheckCircle2 size={24} />
              </div>
              <div className="summary-info">
                <h4>Pendentes</h4>
                <div className="summary-value">{stats.pending || 0}</div>
              </div>
            </div>
          </div>
        );
      case 'recent_activity':
        return (
          <section className="recent-section">
            <div className="home-section-title">
              <Clock size={20} />
              Atividade Recente
            </div>
            <div className="recent-list">
              {recentItems.length > 0 ? (
                recentItems.map(item => (
                  <div key={item.id} className="recent-item" onClick={() => !isEditing && onOpenItem?.(item.id)}>
                    <div className="item-main">
                      <div 
                        className="item-type-icon" 
                        style={{ 
                            background: `${item.type?.color || '#cbd5e0'}15`, 
                            color: item.type?.color || '#4a5568' 
                        }}
                      >
                        {getIcon(item.type?.icon)}
                      </div>
                      <div className="item-details">
                        <h4>{item.title}</h4>
                        <span className="item-meta">{item.type?.label || 'Item'} • {workspace?.name}</span>
                      </div>
                    </div>
                    <div className="item-time">
                      {new Date(item.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      <ChevronRight size={16} className="chevron" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>Nenhuma atividade recente no workspace.</p>
                </div>
              )}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`home-container ${isEditing ? 'is-editing-home' : ''}`}>
      <header className="home-header">
        <div className="welcome-text">
          <h1>{getGreeting()}, {firstName}! 👋</h1>
          <p>Aqui está o resumo do <strong>{workspace?.name || 'seu CRM'}</strong> hoje.</p>
        </div>
        <div className="home-header-right">
            {isEditing ? (
                <div className="edit-actions">
                    <button className="hs-button-secondary btn-small" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        <X size={16} /> Cancelar
                    </button>
                    <button className="hs-button-primary btn-small" onClick={savePreferences} disabled={isSaving}>
                        {isSaving ? (
                            <RefreshCw size={16} className="spinner" />
                        ) : (
                            <>
                                <Save size={16} /> Salvar Layout
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="home-header-actions">
                    <div className="home-date">
                        {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <button className="personalize-btn" onClick={() => setIsEditing(true)} title="Personalizar layout da Home">
                        <Settings size={16} /> <span>Personalizar</span>
                    </button>
                </div>
            )}
        </div>
      </header>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={layout.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {layout.map((item) => (
            <SortableSection 
              key={item.id} 
              id={item.id} 
              visible={item.visible}
              isEditing={isEditing}
              onToggleVisibility={toggleVisibility}
            >
              {renderSectionContent(item.id)}
            </SortableSection>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Home;

