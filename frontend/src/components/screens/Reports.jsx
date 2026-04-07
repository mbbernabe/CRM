import React from 'react';
import { BarChart3, PieChart, LineChart, Download } from 'lucide-react';
import './Reports.css';

const ReportCard = ({ title, children, icon: Icon }) => (
  <div className="report-card">
    <div className="report-header">
      <div className="report-title">
        <Icon size={18} />
        {title}
      </div>
      <Download size={16} className="download-icon" />
    </div>
    <div className="report-content">
      {children}
    </div>
  </div>
);

const Reports = () => {
    return (
    <div className="reports-container">
      <div className="reports-grid">
        <ReportCard title="Receita por Canal" icon={PieChart}>
          <div className="pie-visual">
            {[
              { label: 'Direto', val: 40, col: 'var(--hs-blue)' },
              { label: 'Indicação', val: 30, col: 'var(--hs-orange)' },
              { label: 'Social', val: 20, col: '#10b981' },
              { label: 'Outros', val: 10, col: '#f3f4f6' },
            ].map((item, i) => (
              <div key={i} className="pie-item">
                <div className="pie-dot" style={{ backgroundColor: item.col }}></div>
                <span className="pie-label">{item.label}</span>
                <span className="pie-val">{item.val}%</span>
              </div>
            ))}
          </div>
        </ReportCard>

        <ReportCard title="Crescimento de Leads" icon={LineChart}>
          <div className="line-visual">
            <svg viewBox="0 0 400 150" className="chart-svg">
              <path d="M0 150 L50 120 L100 130 L150 80 L200 100 L250 40 L300 70 L350 20 L400 30" 
                    fill="none" stroke="var(--hs-blue)" strokeWidth="3" />
            </svg>
            <div className="chart-labels">
              {['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'].map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        </ReportCard>

        <ReportCard title="Atividade de Vendas" icon={BarChart3}>
          <div className="table-mini">
            <table>
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Calls</th>
                  <th>Emails</th>
                  <th>Meta</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'João Silva', c: 45, e: 120, m: '90%' },
                  { name: 'Maria Souza', c: 52, e: 145, m: '105%' },
                  { name: 'Roberto Alves', c: 38, e: 90, m: '82%' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{row.c}</td>
                    <td>{row.e}</td>
                    <td style={{ color: row.m.includes('105') ? '#166534' : 'inherit' }}>{row.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>
      </div>
    </div>
  );
};

export default Reports;
