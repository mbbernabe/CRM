import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Users, 
    Shield, 
    Mail, 
    RefreshCw, 
    AlertCircle, 
    ExternalLink, 
    UserX, 
    MoreHorizontal,
    Search,
    Filter,
    Globe,
    Building2
} from 'lucide-react';

const AdminUsers = () => {
    const { fetchWithAuth } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth('http://localhost:8000/admin/users');
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Erro ao carregar usuários');
            }
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setError('Não foi possível conectar ao servidor. Verifique se o backend está ativo.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const filteredUsers = users.filter(u => {
        const searchLower = searchTerm.toLowerCase();
        const workspaceName = (u.workspace_name || `Workspace #${u.workspace_id}`).toLowerCase();
        
        return (
            u.name.toLowerCase().includes(searchLower) || 
            u.email.toLowerCase().includes(searchLower) ||
            workspaceName.includes(searchLower)
        );
    });

    if (loading) return (
        <div className="loading-container">
            <RefreshCw className="spinner" size={40} />
            <p>Sincronizando base global de usuários...</p>
            <style jsx>{`
                .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; color: var(--hs-text-secondary); }
                .spinner { animation: spin 1s linear infinite; color: var(--hs-blue); }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <AlertCircle size={48} />
            <h3>Falha de Autorização</h3>
            <p>{error}</p>
            <button onClick={fetchAllUsers} className="hs-button-secondary">Tentar Novamente</button>
            <style jsx>{`
                .error-container { margin: 40px; padding: 40px; text-align: center; background: #fff1f0; border: 1px solid #ffa39e; border-radius: 8px; color: #cf1322; }
                .error-container h3 { margin: 16px 0 8px; font-weight: 700; color: #2d3e50; }
                .error-container p { margin-bottom: 24px; color: #516f90; }
            `}</style>
        </div>
    );

    return (
        <div className="admin-container animate-in">
            <header className="page-header">
                <div className="header-title">
                    <div className="title-row">
                        <div className="type-badge">
                            <Globe size={14} />
                            <span>Global</span>
                        </div>
                        <h1>Administração Global</h1>
                    </div>
                    <p className="subtitle">Controle central de acesso e governança de tenants e usuários.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-card">
                        <span className="stat-value">{users.length}</span>
                        <span className="stat-label">Usuários Ativos</span>
                    </div>
                </div>
            </header>

            <div className="table-actions">
                <div className="search-bar">
                    <Search size={16} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por nome ou e-mail..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="hs-button-secondary">
                    <Filter size={16} />
                    Filtros Avançados
                </button>
            </div>

            <div className="table-wrapper">
                <table className="hs-table">
                    <thead>
                        <tr>
                            <th>IDENTIFICADOR</th>
                            <th>USUÁRIO</th>
                            <th>PERMISSÃO</th>
                            <th>ÁREA DE TRABALHO</th>
                            <th>TIME (TENANT)</th>
                            <th className="actions-header">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u) => (
                            <tr key={u.id}>
                                <td className="id-cell">
                                    <code>#{u.id}</code>
                                </td>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar" style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #aa3bff, #7a1fff)' : 'linear-gradient(135deg, #0091ae, #007a90)' }}>
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{u.name}</span>
                                            <span className="user-email"><Mail size={12} /> {u.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge ${u.role}`}>
                                        {u.role === 'admin' ? <Shield size={10} /> : null}
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="workspace-indicator">
                                        <Building2 size={14} />
                                        <span>{u.workspace_name || `Workspace #${u.workspace_id}`}</span>
                                    </div>
                                </td>
                                <td>
                                    {u.team_id ? (
                                        <div className="team-indicator">
                                            <div className="pulse-dot"></div>
                                            <span>Team #{u.team_id}</span>
                                        </div>
                                    ) : (
                                        <span className="no-team">Órfão (Sem time)</span>
                                    )}
                                </td>
                                <td className="actions-cell">
                                    <div className="actions-wrapper">
                                        <button 
                                            className="icon-button"
                                            onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                        {activeMenu === u.id && (
                                            <div className="dropdown-menu">
                                                <button onClick={() => {}}>
                                                    <ExternalLink size={14} /> Ver Detalhes
                                                </button>
                                                <button onClick={() => {}} className="danger">
                                                    <UserX size={14} /> Desativar Conta
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .admin-container {
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }

                .animate-in {
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }

                .header-title h1 {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--hs-text-primary);
                    margin: 0;
                }

                .title-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 4px;
                }

                .type-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: var(--hs-blue);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .subtitle {
                    color: var(--hs-text-secondary);
                    font-size: 14px;
                }

                .stat-card {
                    background: white;
                    padding: 12px 24px;
                    border-radius: var(--hs-radius-lg);
                    border: 1px solid var(--hs-border-light);
                    box-shadow: var(--hs-shadow-sm);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 800;
                    color: var(--hs-blue);
                    line-height: 1;
                }

                .stat-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--hs-text-secondary);
                    text-transform: uppercase;
                    margin-top: 4px;
                }

                .table-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                }

                .search-bar {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: white;
                    border: 1px solid var(--hs-border);
                    border-radius: var(--hs-radius);
                    padding: 0 16px;
                    height: 40px;
                    transition: border-color 0.2s;
                }

                .search-bar:focus-within {
                    border-color: var(--hs-blue);
                    box-shadow: 0 0 0 2px rgba(0, 145, 174, 0.1);
                }

                .search-bar input {
                    border: none;
                    outline: none;
                    width: 100%;
                    font-size: 14px;
                    color: var(--hs-text-primary);
                }

                .table-wrapper {
                    background: white;
                    border: 1px solid var(--hs-border-light);
                    border-radius: var(--hs-radius-lg);
                    box-shadow: var(--hs-shadow-md);
                    overflow: visible; /* Necessário para dropdowns */
                }

                .hs-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .hs-table th {
                    background: var(--hs-bg-main);
                    padding: 14px 20px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--hs-text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    border-bottom: 1px solid var(--hs-border-light);
                }

                .hs-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--hs-border-light);
                    font-size: 14px;
                }

                .hs-table tr:hover {
                    background: var(--hs-sidebar-hover);
                }

                .id-cell code {
                    font-size: 12px;
                    color: var(--hs-text-secondary);
                    background: var(--hs-bg-main);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 14px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 600;
                    color: var(--hs-text-primary);
                }

                .user-email {
                    font-size: 12px;
                    color: var(--hs-text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .role-badge {
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .role-badge.admin {
                    background: #f3e8ff;
                    color: #7e22ce;
                    border: 1px solid #e9d5ff;
                }

                .role-badge.user {
                    background: #e0f2fe;
                    color: #0369a1;
                    border: 1px solid #bae6fd;
                }

                .team-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    color: var(--hs-text-primary);
                }

                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--hs-blue);
                    border-radius: 50%;
                    box-shadow: 0 0 0 rgba(0, 145, 174, 0.7);
                    animation: pulse 2s infinite;
                }

                .workspace-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    color: var(--hs-text-primary);
                }

                .workspace-indicator svg {
                    color: var(--hs-blue);
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0, 145, 174, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(0, 145, 174, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 145, 174, 0); }
                }

                .no-team {
                    font-size: 12px;
                    font-style: italic;
                    color: var(--hs-text-secondary);
                }

                .actions-header {
                    text-align: right;
                }

                .actions-cell {
                    text-align: right;
                    position: relative;
                }

                .actions-wrapper {
                    display: flex;
                    justify-content: flex-end;
                    position: relative;
                }

                .icon-button {
                    background: none;
                    border: none;
                    padding: 6px;
                    border-radius: 4px;
                    color: var(--hs-text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-button:hover {
                    background: var(--hs-border-light);
                    color: var(--hs-blue);
                }

                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid var(--hs-border);
                    border-radius: var(--hs-radius);
                    box-shadow: var(--hs-shadow-lg);
                    z-index: 100;
                    width: 180px;
                    padding: 4px;
                    margin-top: 4px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .dropdown-menu button {
                    background: none;
                    border: none;
                    padding: 10px 12px;
                    text-align: left;
                    font-size: 13px;
                    color: var(--hs-text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-radius: 2px;
                }

                .dropdown-menu button:hover {
                    background: var(--hs-bg-main);
                    color: var(--hs-blue);
                }

                .dropdown-menu button.danger {
                    color: #dc2626;
                }

                .dropdown-menu button.danger:hover {
                    background: #fef2f2;
                }
            `}</style>
        </div>
    );
};

export default AdminUsers;
