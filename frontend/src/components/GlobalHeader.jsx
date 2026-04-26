import React from 'react';
import { PanelLeftClose, PanelLeftOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './GlobalHeader.css';

const GlobalHeader = ({ 
  title, 
  isCollapsed, 
  onMobileOpen 
}) => {
  const { workspace, user } = useAuth();
  
  const currentMembership = user?.memberships?.find(m => m.workspace_id === workspace?.id);
  const teamName = currentMembership?.team_name || 'Geral';

  return (
    <header className="global-header hide-on-mobile">
      <div className={`global-header-brand ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-placeholder">C</div>
          <span className="logo-text">CRM Premium</span>
        </div>
      </div>

      <div className="global-header-content">
        <div className="header-title-container">
          <h1>{title}</h1>
          {workspace && (
            <p className="context-meta">
              <strong>{workspace.name}</strong> 
              <span className="separator">•</span> 
              Equipe: <span className="team-badge-inline">{teamName}</span>
            </p>
          )}
        </div>
        <div className="global-header-actions">
          {/* Espaço para ações globais futuras (busca, notificações) */}
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
