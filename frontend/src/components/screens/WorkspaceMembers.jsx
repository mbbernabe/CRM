import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Mail, Send, Trash2, RefreshCw, CheckCircle2,
  AlertCircle, Clock, UserPlus, Shield, UserCheck, X
} from 'lucide-react';
import './WorkspaceMembers.css';

const ROLES = [
  { value: 'user', label: 'Usuário' },
  { value: 'admin', label: 'Administrador' },
];

const RoleBadge = ({ role }) => {
  const map = {
    superadmin: { label: 'Super Admin', cls: 'badge-superadmin' },
    admin: { label: 'Admin', cls: 'badge-admin' },
    user: { label: 'Usuário', cls: 'badge-user' },
  };
  const r = map[role] || map.user;
  return <span className={`role-badge ${r.cls}`}>{r.label}</span>;
};

const WorkspaceMembers = () => {
  const { workspace, fetchWithAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'teams'
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user', team_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Team Management State
  const [newTeamName, setNewTeamName] = useState('');
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [teamError, setTeamError] = useState('');

  const [teamFilter, setTeamFilter] = useState('');

  const fetchData = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [membersRes, invitesRes, teamsRes] = await Promise.all([
        fetchWithAuth(`/workspaces/${workspace.id}/users`),
        fetchWithAuth(`/invitations`),
        fetchWithAuth(`/teams`),
      ]);
      if (membersRes.ok) setMembers(await membersRes.json());
      if (invitesRes.ok) setInvitations(await invitesRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, [workspace, fetchWithAuth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const res = await fetchWithAuth(`/invitations`, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          team_id: inviteForm.team_id ? Number(inviteForm.team_id) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao enviar convite.');
      setInviteSuccess(`Convite enviado com sucesso para ${inviteForm.email}!`);
      setInviteForm({ email: '', role: 'user', team_id: '' });
      fetchData();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamSubmitting(true);
    setTeamError('');
    try {
      const res = await fetchWithAuth(`/teams`, {
        method: 'POST',
        body: JSON.stringify({ name: newTeamName }),
      });
      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Erro ao criar time.');
      }
      setNewTeamName('');
      fetchData();
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Excluir este time?')) return;
    try {
      const res = await fetchWithAuth(`/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) {
          const data = await res.json();
          alert(data.detail || 'Erro ao excluir time.');
          return;
      }
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelInvite = async (id) => {
    if (!window.confirm('Cancelar este convite?')) return;
    try {
      await fetchWithAuth(`/invitations/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  };

  const filteredMembers = teamFilter 
    ? members.filter(m => m.team_id === Number(teamFilter))
    : members;

  if (!workspace) return null;

  const pendingInvites = invitations.filter(i => i.is_pending);
  const acceptedInvites = invitations.filter(i => i.is_accepted);

  return (
    <div className="wm-page animate-in">
      
      {/* Tabs */}
      <div className="wm-tabs">
        <button 
          className={`wm-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={16} /> Membros
        </button>
        <button 
          className={`wm-tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Shield size={16} /> Equipes / Times
        </button>
      </div>

      {activeTab === 'members' ? (
        <div className="wm-card">
          <div className="wm-card-header">
            <Users className="wm-header-icon" size={20} />
            <div className="header-text">
              <h2>Membros Atuais</h2>
              <p>Usuários que fazem parte da área de trabalho.</p>
            </div>
            
            <div className="header-filters">
              <select 
                className="hs-input-sm" 
                value={teamFilter} 
                onChange={e => setTeamFilter(e.target.value)}
              >
                <option value="">Todos os Times</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="refresh-btn-sm" onClick={fetchData} title="Atualizar">
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="wm-loading"><RefreshCw size={20} className="spin" /> Carregando...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="wm-empty">Nenhum membro encontrado {teamFilter ? 'neste time' : ''}.</div>
          ) : (
            <div className="wm-table-wrapper">
              <table className="wm-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Equipe</th>
                    <th>Perfil</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="member-name-cell">
                          <div className="member-avatar">{m.name?.charAt(0).toUpperCase()}</div>
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td className="email-cell">{m.email}</td>
                      <td>
                        {m.team_name ? (
                          <span className="team-label">
                            <span className="team-dot-sm"></span> {m.team_name}
                          </span>
                        ) : (
                          <span className="no-team-label">Sem Time</span>
                        )}
                      </td>
                      <td><RoleBadge role={m.role} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="wm-card">
          <div className="wm-card-header">
            <Shield className="wm-header-icon" size={20} />
            <div>
              <h2>Gestão de Equipes</h2>
              <p>Organize seus membros em diferentes times (ex: Vendas, Suporte).</p>
            </div>
          </div>

          <div className="wm-team-manager">
            <form className="wm-team-create-inline" onSubmit={handleCreateTeam}>
              <input 
                type="text" 
                className="hs-input" 
                placeholder="Nome do novo time..." 
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                required
              />
              <button type="submit" className="hs-button-primary" disabled={teamSubmitting}>
                {teamSubmitting ? <RefreshCw size={14} className="spin" /> : <UserPlus size={14} />} Criar Time
              </button>
            </form>
            {teamError && <div className="wm-msg error">{teamError}</div>}

            <div className="wm-team-list">
              {teams.length === 0 ? (
                <div className="wm-empty">Nenhum time personalizado criado.</div>
              ) : (
                teams.map(t => (
                  <div key={t.id} className="wm-team-item">
                    <div className="team-info">
                      <span className="team-dot"></span>
                      <span className="team-name">{t.name}</span>
                      <span className="team-meta">{members.filter(m => m.team_id === t.id).length} membros</span>
                    </div>
                    {t.name !== 'Geral' && (
                      <button className="delete-team-btn" onClick={() => handleDeleteTeam(t.id)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section: Send Invite */}
      <div className="wm-card wm-invite-card">
        <div className="wm-card-header">
          <UserPlus className="wm-header-icon accent" size={20} />
          <div>
            <h2>Convidar Novo Membro</h2>
            <p>O convidado receberá um e-mail com o link para criar sua conta nesta área de trabalho.</p>
          </div>
        </div>

        <form className="wm-invite-form" onSubmit={handleSendInvite}>
          <div className="wm-form-row">
            <div className="wm-form-group flex-2">
              <label><Mail size={14} /> E-mail do convidado <span className="req">*</span></label>
              <input
                type="email"
                className="hs-input"
                placeholder="nome@empresa.com"
                value={inviteForm.email}
                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
              />
            </div>
            <div className="wm-form-group">
              <label><Shield size={14} /> Perfil</label>
              <select
                className="hs-input"
                value={inviteForm.role}
                onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="wm-form-group">
              <label><Users size={14} /> Equipe / Time</label>
              <select
                className="hs-input"
                value={inviteForm.team_id}
                onChange={e => setInviteForm({ ...inviteForm, team_id: e.target.value })}
              >
                <option value="">(Sem Time)</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {inviteError && (
            <div className="wm-msg error"><AlertCircle size={15} /> {inviteError}</div>
          )}
          {inviteSuccess && (
            <div className="wm-msg success"><CheckCircle2 size={15} /> {inviteSuccess}</div>
          )}

          <div className="wm-form-actions">
            <button type="submit" className="hs-button-primary" disabled={submitting}>
              {submitting ? <><RefreshCw size={15} className="spin" /> Enviando...</> : <><Send size={15} /> Enviar Convite</>}
            </button>
          </div>
        </form>
      </div>

      {/* Section: Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="wm-card">
          <div className="wm-card-header">
            <Clock className="wm-header-icon warning" size={20} />
            <div>
              <h2>Convites Pendentes <span className="wm-count">{pendingInvites.length}</span></h2>
              <p>Aguardando aceite pelo convidado.</p>
            </div>
          </div>
          <div className="wm-table-wrapper">
            <table className="wm-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Equipe</th>
                  <th>Perfil</th>
                  <th>Expira em</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td>
                      {inv.team_name ? (
                        <span className="team-label-sm">{inv.team_name}</span>
                      ) : (
                        <span className="no-team-label-sm">Nenhuma</span>
                      )}
                    </td>
                    <td><RoleBadge role={inv.role} /></td>
                    <td className="date-cell">{formatDate(inv.expires_at)}</td>
                    <td>
                      <button
                        className="wm-cancel-btn"
                        onClick={() => handleCancelInvite(inv.id)}
                        title="Cancelar convite"
                      >
                        <X size={14} /> Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section: Accepted Invites */}
      {acceptedInvites.length > 0 && (
        <div className="wm-card">
          <div className="wm-card-header">
            <UserCheck className="wm-header-icon success" size={20} />
            <div>
              <h2>Convites Aceitos</h2>
              <p>Histórico completo de convites que foram aceitos.</p>
            </div>
          </div>
          <div className="wm-table-wrapper">
            <table className="wm-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Aceito em</th>
                </tr>
              </thead>
              <tbody>
                {acceptedInvites.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td><RoleBadge role={inv.role} /></td>
                    <td className="date-cell">{formatDate(inv.accepted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceMembers;
