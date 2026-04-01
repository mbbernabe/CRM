import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Dashboard from './components/screens/Dashboard';
import Contacts from './components/screens/Contacts';
import Companies from './components/screens/Companies';
import Reports from './components/screens/Reports';
import PropertySettings from './components/screens/PropertySettings';

const PIPELINES = [
  {
    id: 'retail',
    name: 'Pipeline de Vendas Varejo',
    columns: [
      { id: 'new', name: 'Novo' },
      { id: 'qualified', name: 'Qualificado' },
      { id: 'proposal', name: 'Proposta Enviada' },
      { id: 'won', name: 'Fechado Ganho' },
      { id: 'lost', name: 'Fechado Perdido' },
    ]
  },
  {
    id: 'partnerships',
    name: 'Pipeline de Parcerias',
    columns: [
      { id: 'lead', name: 'Lead' },
      { id: 'negotiation', name: 'Negociação' },
      { id: 'signed', name: 'Assinado' },
      { id: 'refused', name: 'Recusado' },
    ]
  },
  {
    id: 'enterprise',
    name: 'Pipeline B2B Enterprise',
    columns: [
      { id: 'prospecting', name: 'Prospecção' },
      { id: 'demo', name: 'Demonstração' },
      { id: 'value_prop', name: 'Proposta de Valor' },
      { id: 'contract', name: 'Contrato' },
      { id: 'closed', name: 'Fechado' },
    ]
  }
];

const INITIAL_DEALS = [
  { id: '1', title: 'Consultoria de RH', company: 'Acme Inc.', value: 5000, contact: 'João Silva', status: 'new', pipeline: 'retail' },
  { id: '2', title: 'Licenciamento SaaS', company: 'Globex Corp', value: 12500, contact: 'Maria Souza', status: 'qualified', pipeline: 'retail' },
  { id: '3', title: 'Treinamento de Equipe', company: 'Initech', value: 8000, contact: 'Roberto Alves', status: 'proposal', pipeline: 'retail' },
  { id: '4', title: 'Expansão de Sede', company: 'Stark Ind.', value: 45000, contact: 'Tony Stark', status: 'negotiation', pipeline: 'partnerships' },
  { id: '5', title: 'Auditória Anual', company: 'Wayne Ent.', value: 15000, contact: 'Bruce Wayne', status: 'prospecting', pipeline: 'enterprise' },
];

function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [activePipelineId, setActivePipelineId] = useState('retail');
  const [deals, setDeals] = useState(INITIAL_DEALS);

  const activePipeline = PIPELINES.find(p => p.id === activePipelineId);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeDealId = active.id;
      const overId = over.id;
      setDeals((prev) => {
        const deal = prev.find(d => d.id === activeDealId);
        if (!deal) return prev;
        const column = activePipeline.columns.find(c => c.id === overId);
        if (column) {
          return prev.map(d => d.id === activeDealId ? { ...d, status: column.id } : d);
        }
        const overDeal = prev.find(d => d.id === overId);
        if (overDeal) {
          return prev.map(d => d.id === activeDealId ? { ...d, status: overDeal.status } : d);
        }
        return prev;
      });
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard />;
      case 'contacts': return <Contacts />;
      case 'companies': return <Companies />;
      case 'deals': return (
        <>
          <Header 
            pipelines={PIPELINES} 
            activePipeline={activePipeline} 
            onPipelineChange={setActivePipelineId} 
          />
          <KanbanBoard 
            pipeline={activePipeline} 
            deals={deals.filter(d => d.pipeline === activePipelineId)} 
            onDragEnd={handleDragEnd}
          />
        </>
      );
      case 'reports': return <Reports />;
      case 'settings': return <PropertySettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <div className="content-area">
        {activeScreen !== 'deals' && (
          <header className="simple-header">
            <h1>{
              activeScreen === 'dashboard' ? 'Dashboard' :
              activeScreen === 'contacts' ? 'Contatos' :
              activeScreen === 'companies' ? 'Empresas' :
              activeScreen === 'reports' ? 'Relatórios' :
              activeScreen === 'settings' ? 'Configurações de Propriedades' : 'CRM'
            }</h1>
            <div className="header-actions">
               {/* Add common actions here if needed */}
            </div>
          </header>
        )}
        {renderScreen()}
      </div>

      <style jsx>{`
        .app-layout {
          display: flex;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
        .content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .simple-header {
          height: var(--header-height);
          background: var(--hs-white);
          border-bottom: 1px solid var(--hs-border);
          display: flex;
          align-items: center;
          padding: 0 24px;
          flex-shrink: 0;
        }
        .simple-header h1 {
          font-size: 20px;
          font-weight: 700;
          color: var(--hs-text-primary);
        }
      `}</style>
    </div>
  );
}

export default App;
