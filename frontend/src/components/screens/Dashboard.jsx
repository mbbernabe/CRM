import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Target, RefreshCw, BarChart3, PieChart, Layout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const StatCard = ({ title, value, change, icon, color }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <div className={`stat-icon`} style={{ backgroundColor: color }}>
        {icon}
      </div>
    </div>
    <div className="stat-value">{value}</div>
    {change && (
      <div className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
        {change} nos últimos 30 dias
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { user, workspace, fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [funnelData, setFunnelData] = useState(null);
  const [loadingFunnel, setLoadingFunnel] = useState(false);

  // Determina o contexto do time
  const currentMembership = user?.memberships?.find(m => m.workspace_id === workspace?.id);
  const teamName = currentMembership?.team_name || 'Geral';

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [statsRes, pipesRes] = await Promise.all([
            fetchWithAuth('/analytics/overview'),
            fetchWithAuth('/pipelines/')
        ]);
        
        if (!statsRes.ok) throw new Error('Falha ao carregar estatísticas');
        
        const stats = await statsRes.json();
        setData(stats);

        if (pipesRes.ok) {
            const pipes = await pipesRes.json();
            setPipelines(pipes);
            if (pipes.length > 0) {
                setSelectedPipelineId(pipes[0].id);
            }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [workspace?.id]);

  useEffect(() => {
    if (selectedPipelineId) {
        const loadFunnel = async () => {
            try {
                setLoadingFunnel(true);
                const res = await fetchWithAuth(`/analytics/funnel/${selectedPipelineId}`);
                if (res.ok) {
                    setFunnelData(await res.json());
                }
            } catch (err) {
                console.error('Erro ao carregar funil:', err);
            } finally {
                setLoadingFunnel(false);
            }
        };
        loadFunnel();
    }
  }, [selectedPipelineId]);

  if (loading) {
    return (
      <div className="dashboard-container loading-state">
        <RefreshCw className="spinner" size={32} />
        <p>Analisando dados do workspace...</p>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-container error-state">{error}</div>;
  }

  return (
    <div className="dashboard-container animate-in">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Olá, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="context-meta">
            Você está visualizando os dados de <strong>{workspace?.name}</strong> 
            <span className="separator">•</span> 
            Equipe: <span className="team-badge-inline">{teamName}</span>
          </p>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Total de Itens" 
          value={data?.total_items || 0} 
          change={`+${data?.new_items_30d || 0}`} 
          icon={<Layout size={18} />} 
          color="var(--hs-blue)" 
        />
        <StatCard 
          title="Novos (30d)" 
          value={data?.new_items_30d || 0} 
          change="" 
          icon={<TrendingUp size={18} />} 
          color="var(--hs-orange)" 
        />
        <StatCard 
          title="Responsáveis Ativos" 
          value={data?.top_owners?.length || 0} 
          change="" 
          icon={<Users size={18} />} 
          color="#10b981" 
        />
      </div>

      {/* Pipeline Funnel Section */}
      <div className="funnel-section mini-card">
          <div className="funnel-header">
              <div className="title-with-icon">
                  <Target size={18} />
                  <h3>Funil de Vendas</h3>
              </div>
              <select 
                className="hs-select funnel-select"
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
              >
                  {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
          </div>

          <div className="funnel-visual">
              {loadingFunnel ? (
                  <div className="funnel-loading"><RefreshCw className="spinner" size={24} /></div>
              ) : (
                  <div className="funnel-bars">
                      {funnelData?.stages?.map((stage, i) => {
                          const percentage = funnelData.total_items > 0 
                            ? (stage.count / funnelData.total_items) * 100 
                            : 0;
                          return (
                            <div key={i} className="funnel-step">
                                <div className="step-info">
                                    <span className="step-name">{stage.stage_name}</span>
                                    <span className="step-count">{stage.count}</span>
                                </div>
                                <div className="step-bar-container">
                                    <div 
                                        className="step-bar-fill" 
                                        style={{ 
                                            width: `${Math.max(percentage, 2)}%`,
                                            backgroundColor: stage.color || 'var(--hs-blue)',
                                            opacity: 1 - (i * 0.1) // Efeito visual de funil
                                        }}
                                    ></div>
                                </div>
                            </div>
                          );
                      })}
                      {(!funnelData?.stages || funnelData.stages.length === 0) && (
                          <p className="empty-msg">Nenhum estágio configurado para esta pipeline.</p>
                      )}
                  </div>
              )}
          </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-placeholder main-chart">
          <div className="chart-header">
            <div className="title-with-icon">
                <BarChart3 size={18} />
                <h3>Crescimento de Itens</h3>
            </div>
            <span className="chart-subtitle">Últimos 6 meses</span>
          </div>
          <div className="visual-bars">
            {data?.evolution?.map((item, i) => (
              <div key={i} className="bar-column">
                <div className="bar-wrapper">
                    <div 
                        className="bar" 
                        style={{ height: `${Math.max((item.count / (data.total_items || 1)) * 100, 5)}%` }}
                        title={`${item.count} itens`}
                    ></div>
                </div>
                <span className="bar-label">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="side-panels">
            <div className="activity-list mini-card">
                <div className="card-title">
                    <PieChart size={18} />
                    <h3>Distribuição</h3>
                </div>
                <div className="distribution-list">
                    {data?.type_distribution?.map((type, i) => (
                        <div key={i} className="dist-item">
                            <span className="dist-label">{type.label}</span>
                            <div className="dist-bar-bg">
                                <div 
                                    className="dist-bar-fill" 
                                    style={{ 
                                        width: `${(type.count / (data.total_items || 1)) * 100}%`,
                                        backgroundColor: i === 0 ? 'var(--hs-blue)' : i === 1 ? 'var(--hs-orange)' : '#10b981'
                                    }}
                                ></div>
                            </div>
                            <span className="dist-count">{type.count}</span>
                        </div>
                    ))}
                    {(!data?.type_distribution || data.type_distribution.length === 0) && (
                        <p className="empty-msg">Nenhum dado disponível.</p>
                    )}
                </div>
            </div>

            <div className="activity-list mini-card">
                <div className="card-title">
                    <Users size={18} />
                    <h3>Performance (Top 5)</h3>
                </div>
                <div className="owners-ranking">
                    {data?.top_owners?.map((owner, i) => (
                        <div key={i} className="activity-item">
                            <div className="activity-avatar">{owner.name[0]}</div>
                            <div className="activity-info">
                                <p><strong>{owner.name}</strong></p>
                                <span className="activity-time">{owner.count} itens atribuídos</span>
                            </div>
                        </div>
                    ))}
                    {(!data?.top_owners || data.top_owners.length === 0) && (
                        <p className="empty-msg">Nenhum responsável atribuído.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
