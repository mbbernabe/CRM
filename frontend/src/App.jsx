import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';
import KanbanBoard from './components/KanbanBoard';
import Dashboard from './components/screens/Dashboard';
import GenericEntityScreen from './components/screens/GenericEntityScreen';
import Reports from './components/screens/Reports';
import PropertySettings from './components/screens/PropertySettings';
import AdminUsers from './components/screens/AdminUsers';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import SystemSettings from './components/screens/SystemSettings';
import WorkspaceSettings from './components/screens/WorkspaceSettings';
import PipelineBoardScreen from './components/screens/PipelineBoardScreen';
import PipelineSettings from './components/screens/PipelineSettings';
import WorkItemTypeSettings from './components/screens/WorkItemTypeSettings';
import AcceptInvite from './components/auth/AcceptInvite';
import { ToastProvider } from './components/common/Toast';
import WorkspaceMembers from './components/screens/WorkspaceMembers';
import AdminTemplates from './components/screens/AdminTemplates';
import DeactivatedScreen from './components/auth/DeactivatedScreen';
import MyTasksCenter from './components/screens/MyTasksCenter';
import Profile from './components/screens/Profile';



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
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppInner() {
  const { isAuthenticated, loading, user, workspace } = useAuth();
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePipelineId, setActivePipelineId] = useState('retail');
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(() => {
    return new URLSearchParams(window.location.search).has('token') && window.location.pathname.includes('reset');
  });
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(() => {
    return window.location.pathname.includes('accept-invite');
  });
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [inactiveInfo, setInactiveInfo] = useState(null);

  const currentMembership = user?.memberships?.find(m => m.workspace_id === workspace?.id);
  const teamName = currentMembership?.team_name || 'Geral';


  // O loading global do AuthContext não deve desmontar a aplicação inteira, 
  // caso contrário perdemos o estado dos componentes (como o Login) durante a requisição.
  // if (loading) {
  //    return <div className="loading-screen">Carregando...</div>;
  // }


  if (isAcceptingInvite) {
    return <AcceptInvite />;
  }

  if (isResetting) {
    return <ResetPassword onBackToLogin={() => {
      // Remover token da URL ao voltar
      const url = new URL(window.location);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url);
      setIsResetting(false);
    }} />;
  }

  if (isDeactivated) {
    return (
      <DeactivatedScreen 
        inactiveInfo={inactiveInfo} 
        onBackToLogin={() => {
          setIsDeactivated(false);
          setInactiveInfo(null);
        }} 
      />
    );
  }


  if (!isAuthenticated) {
    if (isForgotPassword) {
      return <ForgotPassword onBackToLogin={() => setIsForgotPassword(false)} />;
    }
    return isRegistering ? (
      <Register onSwitchToLogin={() => setIsRegistering(false)} />
    ) : (
      <Login 
        onSwitchToRegister={() => setIsRegistering(true)} 
        onForgotPassword={() => setIsForgotPassword(true)}
        onDeactivated={(info) => {
          setInactiveInfo(info);
          setIsDeactivated(true);
        }}
      />
    );

  }

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

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'dashboard': return 'Dashboard';
      case 'tasks': return 'Minhas Tarefas';
      case 'contacts': return 'Contatos';
      case 'companies': return 'Empresas';
      case 'deals': return 'Negócios';
      case 'reports': return 'Relatórios';
      case 'settings': return 'Configurações de Propriedades';
      case 'pipeline-settings': return 'Configuração de Pipelines';
      case 'workspace-settings': return 'Personalização';
      case 'system-settings': return 'Configurações Globais';
      case 'pipeline-board': return 'Quadro de Pipelines';
      case 'admin': return 'Administração';
      case 'admin-templates': return 'Biblioteca Global';
      case 'object-types': return 'Tipos de Objetos';
      case 'workspace-members': return 'Membros & Convites';
      case 'profile': return 'Meu Perfil';
      default: return 'CRM';
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <MyTasksCenter />;
      case 'contacts': return <GenericEntityScreen typeName="contact" />;
      case 'companies': return <GenericEntityScreen typeName="company" />;
      case 'deals': return (
        <>
          <div className="hide-on-mobile">
            <Header 
              pipelines={PIPELINES} 
              activePipeline={activePipeline} 
              onPipelineChange={setActivePipelineId} 
            />
          </div>
          <KanbanBoard 
            pipeline={activePipeline} 
            deals={deals.filter(d => d.pipeline === activePipelineId)} 
            onDragEnd={handleDragEnd}
          />
        </>
      );
      case 'reports': return <Reports />;
      case 'settings': return <PropertySettings />;
      case 'system-settings': return <SystemSettings />;
      case 'pipeline-settings': return <PipelineSettings />;
      case 'workspace-settings': return <WorkspaceSettings />;
      case 'pipeline-board': return <PipelineBoardScreen />;
      case 'admin': return <AdminUsers />;
      case 'admin-templates': return <AdminTemplates />;
      case 'object-types': return <WorkItemTypeSettings />;
      case 'workspace-members': return <WorkspaceMembers />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      {isSidebarOpen && (
        <div className="sidebar-overlay show-on-mobile" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <Sidebar 
        activeScreen={activeScreen} 
        onNavigate={(screen) => {
          setActiveScreen(screen);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="main-wrapper">
        {/* Mobile Header (Fixed) */}
        <div className="mobile-header show-on-mobile">
          <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
            <span className="hamburger"></span>
          </button>
          <span className="mobile-title">{getScreenTitle()}</span>
        </div>

        <div className="content-area">
          {activeScreen !== 'deals' && (
            <header className="simple-header hide-on-mobile">
              <div className="header-title-container">
                <h1>{getScreenTitle()}</h1>
                {workspace && (
                  <p className="context-meta">
                    <strong>{workspace.name}</strong> 
                    <span className="separator">•</span> 
                    Equipe: <span className="team-badge-inline">{teamName}</span>
                  </p>
                )}
              </div>
              <div className="header-actions">
              </div>
            </header>
          )}
          {renderScreen()}
        </div>
      </div>

      </div>
  );
}

export default App;
