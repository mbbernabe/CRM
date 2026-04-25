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
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home = ({ onOpenItem }) => {
  const { user, workspace, fetchWithAuth, activeMembershipId, switchMembership } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth('/home/summary');
        if (res.ok) {
          const result = await res.json();
          setData(result);
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

  if (loading) {
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
  
  // Safe name split
  const firstName = (user?.name?.split(' ') || [''])[0];

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="welcome-text">
          <h1>{getGreeting()}, {firstName}! 👋</h1>
          <p>Aqui está o resumo do <strong>{workspace?.name || 'seu CRM'}</strong> hoje.</p>
        </div>
        <div className="home-date">
          {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </header>

      {/* Quick Actions */}
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
              onClick={() => onOpenItem?.(`new_${action.name}`)}
            >
              <div className="action-icon-wrapper">
                {getIcon(action.icon)}
              </div>
              <span>Novo {action.label}</span>
            </div>
          ))}
          <div 
            className="action-card" 
            style={{ '--card-color': '#64748b' }}
            onClick={() => onOpenItem?.('personalize')}
          >
            <div className="action-icon-wrapper">
              <PlusCircle size={24} />
            </div>
            <span>Personalizar</span>
          </div>
        </div>
      </section>

      {/* Workspaces Section */}
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
              onClick={() => switchMembership(m.id)}
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

      {/* Summary Row */}
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

      {/* Recent Activity */}
      <section className="recent-section">
        <div className="home-section-title">
          <Clock size={20} />
          Atividade Recente
        </div>
        <div className="recent-list">
          {recentItems.length > 0 ? (
            recentItems.map(item => (
              <div key={item.id} className="recent-item" onClick={() => onOpenItem?.(item.id)}>
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
    </div>
  );
};

export default Home;
