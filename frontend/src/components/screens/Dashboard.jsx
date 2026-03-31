import React from 'react';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

const StatCard = ({ title, value, change, icon, color }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <div className={`stat-icon`} style={{ backgroundColor: color }}>
        {icon}
      </div>
    </div>
    <div className="stat-value">{value}</div>
    <div className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
      {change} em relação ao mês passado
    </div>

    <style jsx>{`
      .stat-card {
        background: var(--hs-white);
        border: 1px solid var(--hs-border-light);
        border-radius: var(--hs-radius);
        padding: 20px;
        flex: 1;
        box-shadow: var(--hs-shadow);
      }
      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .stat-title {
        color: var(--hs-text-secondary);
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-icon {
        padding: 8px;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--hs-text-primary);
        margin-bottom: 8px;
      }
      .stat-change {
        font-size: 12px;
        font-weight: 500;
      }
      .positive { color: #15803d; }
      .negative { color: #b91c1c; }
    `}</style>
  </div>
);

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <StatCard 
          title="Total de Negócios" 
          value="128" 
          change="+12%" 
          icon={<TrendingUp size={18} />} 
          color="var(--hs-blue)" 
        />
        <StatCard 
          title="Valor em Pipeline" 
          value="R$ 450.000" 
          change="+5.4%" 
          icon={<DollarSign size={18} />} 
          color="var(--hs-orange)" 
        />
        <StatCard 
          title="Taxa de Conversão" 
          value="24.5%" 
          change="-2.1%" 
          icon={<Target size={18} />} 
          color="#10b981" 
        />
      </div>

      <div className="dashboard-content">
        <div className="chart-placeholder">
          <div className="chart-header">
            <h3>Desempenho de Vendas</h3>
            <span className="chart-subtitle">Últimos 6 meses</span>
          </div>
          <div className="visual-bars">
            {[40, 65, 45, 90, 75, 85].map((h, i) => (
              <div key={i} className="bar-column">
                <div className="bar" style={{ height: `${h}%` }}></div>
                <span className="bar-label">{['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-list">
          <h3>Atividade Recente</h3>
          {[
            { user: 'João Silva', action: 'moveu um negócio para', target: 'Proposta Enviada', time: 'Há 2 horas' },
            { user: 'Maria Souza', action: 'criou um novo contato', target: 'Carlos Oliveira', time: 'Há 5 horas' },
            { user: 'Roberto Alves', action: 'fechou um negócio com', target: 'Initech', time: 'Há 1 dia' },
          ].map((act, i) => (
            <div key={i} className="activity-item">
              <div className="activity-avatar">{act.user[0]}</div>
              <div className="activity-info">
                <p><strong>{act.user}</strong> {act.action} <strong>{act.target}</strong></p>
                <span className="activity-time">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
          overflow-y: auto;
        }
        .stats-grid {
          display: flex;
          gap: 20px;
        }
        .dashboard-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        .chart-placeholder, .activity-list {
          background: var(--hs-white);
          border: 1px solid var(--hs-border-light);
          border-radius: var(--hs-radius);
          padding: 24px;
          box-shadow: var(--hs-shadow);
        }
        .chart-header h3, .activity-list h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .visual-bars {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          height: 200px;
          padding-top: 20px;
        }
        .bar-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .bar {
          width: 32px;
          background: var(--hs-blue-hover);
          opacity: 0.8;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
        }
        .bar:hover {
          opacity: 1;
          background: var(--hs-blue);
        }
        .bar-label {
          font-size: 12px;
          color: var(--hs-text-secondary);
        }
        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--hs-border-light);
        }
        .activity-avatar {
          width: 32px;
          height: 32px;
          background: var(--hs-border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }
        .activity-info p {
          font-size: 13px;
          margin: 0;
        }
        .activity-time {
          font-size: 11px;
          color: var(--hs-text-secondary);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
