import React from 'react';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
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
    <div className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
      {change} em relação ao mês passado
    </div>
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
    </div>
  );
};

export default Dashboard;
