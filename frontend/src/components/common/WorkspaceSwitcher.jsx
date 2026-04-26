import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Plus, Globe, Building2, User } from 'lucide-react';
import { useToast } from '../common/Toast';
import './WorkspaceSwitcher.css';

const WorkspaceSwitcher = ({ isCollapsed }) => {
  const { user, workspace, activeMembershipId, switchMembership, switchWorkspace, fetchWithAuth, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const memberships = user?.memberships || [];
  
  const handleSwitch = (membershipId) => {
    if (membershipId.toString() === activeMembershipId?.toString()) return;
    switchMembership(membershipId);
    setIsOpen(false);
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/workspaces/', {
        method: 'POST',
        body: JSON.stringify({ name: newWsName })
      });
      
      if (res.ok) {
        const newWs = await res.json();
        
        // Limpa a modal imediatamente
        setNewWsName('');
        setIsCreating(false);
        
        addToast("Nova área de trabalho criada com sucesso!", "success");
        
        await refreshUser();
        await switchWorkspace(newWs.id);
      } else {
        const errData = await res.json();
        addToast(errData.detail || "Erro ao criar área de trabalho", "error");
      }
    } catch (err) {
      console.error("Erro ao criar workspace:", err);
      addToast("Erro de conexão ao criar área de trabalho", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`ws-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="ws-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderColor: workspace?.primary_color || 'var(--hs-blue)' }}
        data-tooltip={isCollapsed ? workspace?.name : undefined}
      >
        <div className="ws-current-logo" style={{ backgroundColor: workspace?.primary_color || 'var(--hs-blue)' }}>
          {workspace?.logo_url ? (
            <img src={workspace.logo_url} alt="Logo" />
          ) : (
            <span>{workspace?.name?.charAt(0).toUpperCase() || 'W'}</span>
          )}
        </div>
        {!isCollapsed && (
          <>
            <div className="ws-current-info">
              <span className="ws-name">{workspace?.name || 'Carregando...'}</span>
              <span className="ws-role">
                {memberships.find(m => m.workspace_id === workspace?.id)?.role || 'Membro'}
                {memberships.find(m => m.workspace_id === workspace?.id)?.team_name && (
                  <span className="ws-team-tag"> • {memberships.find(m => m.workspace_id === workspace?.id)?.team_name}</span>
                )}
              </span>
            </div>
            <ChevronDown size={14} className={`ws-chevron ${isOpen ? 'open' : ''}`} />
          </>
        )}
      </div>

      {isOpen && (
        <>
          <div className="ws-overlay" onClick={() => setIsOpen(false)} />
          <div className="ws-dropdown animate-in-up">
            <div className="ws-dropdown-header">Áreas de Trabalho</div>
            <div className="ws-list">
              {memberships.map((m) => (
                <div 
                  key={m.id} 
                  className={`ws-item ${m.id.toString() === activeMembershipId?.toString() ? 'active' : ''}`}
                  onClick={() => handleSwitch(m.id)}
                >
                  <div 
                    className="ws-item-logo" 
                    style={{ backgroundColor: m.primary_color || 'var(--hs-blue)' }}
                  >
                    {m.workspace_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ws-item-info">
                    <span className="ws-item-name">{m.workspace_name}</span>
                    <span className="ws-item-role">
                      {m.role} {m.team_name ? ` • ${m.team_name}` : ''}
                    </span>
                  </div>
                  {m.workspace_id === workspace?.id && <div className="ws-active-dot" />}
                </div>
              ))}
            </div>
            
            <div className="ws-divider" />
            <button className="ws-add-btn" onClick={() => { setIsCreating(true); setIsOpen(false); }}>
              <Plus size={14} /> <span>Criar nova área</span>
            </button>
          </div>
        </>
      )}

      {isCreating && (
        <>
          <div className="ws-overlay" onClick={() => setIsCreating(false)} />
          <div className="ws-modal animate-in-up">
            <h3>Criar Nova Área</h3>
            <form onSubmit={handleCreateWorkspace}>
              <input 
                type="text" 
                className="hs-input" 
                placeholder="Nome da empresa ou time..." 
                value={newWsName}
                onChange={e => setNewWsName(e.target.value)}
                autoFocus
                required
              />
              <div className="ws-modal-actions">
                <button type="button" className="hs-button-secondary" onClick={() => setIsCreating(false)}>Cancelar</button>
                <button type="submit" className="hs-button-primary" disabled={submitting}>
                  {submitting ? 'Criando...' : 'Criar Área'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
